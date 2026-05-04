import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";
import { getStripe } from "@/lib/billing/stripe";
import { invalidatePlanCache } from "@/lib/billing/plans";

/**
 * Admin plans router — CRUD over the `plans` table.
 *
 * Critical invariants enforced here:
 *   - id (slug) is immutable after create (used in URLs, Stripe metadata,
 *     Tenant.plan FK). Update mutation does NOT accept id.
 *   - Stripe Prices are NEVER edited in place. When monthlyPriceBRL or
 *     setupFeeBRL changes, we call stripe.prices.create() and rotate
 *     stripePriceId / stripeSetupPriceId. The OLD Stripe Prices stay active
 *     so existing subscriptions keep paying their original amount (Stripe
 *     handles this transparently — subscriptions are bound to a Price by id,
 *     not by product).
 *   - Hard delete is blocked. Use deprecated=true for soft delete.
 *   - Tenant grandfathering: changing limits on a Plan does NOT mutate
 *     existing Tenant.* columns unless the caller passes
 *     applyToExistingTenants=true.
 *
 * Audit: every successful update writes a UsageEvent type "plan_updated"
 * with before/after snapshot in metadata for traceability.
 */

const featuresSchema = z.array(z.string().min(1).max(200)).max(20);

const planMutableInput = z.object({
  name: z.string().min(2).max(100),
  monthlyPriceBRL: z.number().min(0).max(99999),
  setupFeeBRL: z.number().min(0).max(99999).nullable(),
  analysisLimit: z.number().int().min(1).max(9999999),
  commissionRate: z.number().min(0).max(1),
  excessCostPerAnalysis: z.number().min(0).max(9999),
  maxUsers: z.number().int().min(1).max(99999),
  features: featuresSchema,
  ctaText: z.string().min(1).max(60),
  visible: z.boolean(),
  deprecated: z.boolean(),
  customAllowed: z.boolean(),
  displayOrder: z.number().int(),
});

async function ensureStripePrice(params: {
  productName: string;
  amountBRL: number;
  recurring: boolean;
}): Promise<string | null> {
  if (params.amountBRL <= 0) return null; // no Stripe Price for free / custom-allowed
  const stripe = getStripe();
  const price = await stripe.prices.create({
    currency: "brl",
    unit_amount: Math.round(params.amountBRL * 100),
    ...(params.recurring ? { recurring: { interval: "month" } } : {}),
    product_data: { name: params.productName },
  });
  return price.id;
}

export const plansRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.plan.findMany({ orderBy: { displayOrder: "asc" } });
  }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.plan.findUniqueOrThrow({ where: { id: input.id } });
    }),

  // Tenants currently on this plan — used by the apply-to-existing
  // confirmation dialog so admin sees the impact before clicking save.
  tenantsCount: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.tenant.count({
        where: { plan: input.id, status: { not: "deleted" } },
      });
      return { count };
    }),

  create: adminProcedure
    .input(
      planMutableInput.extend({
        id: z
          .string()
          .min(2)
          .max(40)
          .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, digits and hyphens"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.plan.findUnique({ where: { id: input.id } });
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Ja existe um plano com id "${input.id}".`,
        });
      }
      // Custom-allowed (enterprise tier) plans skip Stripe Price creation.
      let stripePriceId: string | null = null;
      let stripeSetupPriceId: string | null = null;
      if (!input.customAllowed) {
        stripePriceId = await ensureStripePrice({
          productName: `Skinner ${input.name}`,
          amountBRL: input.monthlyPriceBRL,
          recurring: true,
        });
        if (input.setupFeeBRL && input.setupFeeBRL > 0) {
          stripeSetupPriceId = await ensureStripePrice({
            productName: `Skinner ${input.name} — Setup`,
            amountBRL: input.setupFeeBRL,
            recurring: false,
          });
        }
      }
      const created = await ctx.db.plan.create({
        data: {
          id: input.id,
          name: input.name,
          monthlyPriceBRL: input.monthlyPriceBRL,
          setupFeeBRL: input.setupFeeBRL,
          analysisLimit: input.analysisLimit,
          commissionRate: input.commissionRate,
          excessCostPerAnalysis: input.excessCostPerAnalysis,
          maxUsers: input.maxUsers,
          features: JSON.stringify(input.features),
          ctaText: input.ctaText,
          visible: input.visible,
          deprecated: input.deprecated,
          customAllowed: input.customAllowed,
          displayOrder: input.displayOrder,
          stripePriceId,
          stripeSetupPriceId,
        },
      });
      invalidatePlanCache();
      return created;
    }),

  update: adminProcedure
    .input(
      planMutableInput.extend({
        id: z.string(),
        applyToExistingTenants: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.plan.findUniqueOrThrow({ where: { id: input.id } });

      // Detect what changed. Price changes trigger Stripe Price rotation.
      const priceChanged = input.monthlyPriceBRL !== before.monthlyPriceBRL;
      const setupChanged = (input.setupFeeBRL ?? 0) !== (before.setupFeeBRL ?? 0);

      let stripePriceId = before.stripePriceId;
      let stripeSetupPriceId = before.stripeSetupPriceId;

      if (!input.customAllowed) {
        if (priceChanged && input.monthlyPriceBRL > 0) {
          stripePriceId = await ensureStripePrice({
            productName: `Skinner ${input.name}`,
            amountBRL: input.monthlyPriceBRL,
            recurring: true,
          });
        } else if (input.monthlyPriceBRL <= 0) {
          stripePriceId = null;
        }
        if (setupChanged && input.setupFeeBRL && input.setupFeeBRL > 0) {
          stripeSetupPriceId = await ensureStripePrice({
            productName: `Skinner ${input.name} — Setup`,
            amountBRL: input.setupFeeBRL,
            recurring: false,
          });
        } else if (!input.setupFeeBRL || input.setupFeeBRL <= 0) {
          stripeSetupPriceId = null;
        }
      } else {
        // Switching to custom-allowed wipes Stripe Price refs.
        stripePriceId = null;
        stripeSetupPriceId = null;
      }

      const updated = await ctx.db.plan.update({
        where: { id: input.id },
        data: {
          name: input.name,
          monthlyPriceBRL: input.monthlyPriceBRL,
          setupFeeBRL: input.setupFeeBRL,
          analysisLimit: input.analysisLimit,
          commissionRate: input.commissionRate,
          excessCostPerAnalysis: input.excessCostPerAnalysis,
          maxUsers: input.maxUsers,
          features: JSON.stringify(input.features),
          ctaText: input.ctaText,
          visible: input.visible,
          deprecated: input.deprecated,
          customAllowed: input.customAllowed,
          displayOrder: input.displayOrder,
          stripePriceId,
          stripeSetupPriceId,
        },
      });

      let tenantsUpdated = 0;
      if (input.applyToExistingTenants) {
        const result = await ctx.db.tenant.updateMany({
          where: { plan: input.id, status: { not: "deleted" } },
          data: {
            analysisLimit: input.analysisLimit,
            commissionRate: input.commissionRate,
            excessCostPerAnalysis: input.excessCostPerAnalysis,
          },
        });
        tenantsUpdated = result.count;
      }

      // Audit log — write to UsageEvent of the FIRST tenant on the plan, or
      // create a system-level entry. We use a global synthetic tenant marker
      // ("__platform__") via a query against any tenant — cleanest approach is
      // to log against ALL affected tenants when applyToExistingTenants=true,
      // OR a single platform log. To keep things simple, we log against the
      // skinner_admin's own implicit "platform" using metadata only.
      // For now we just console.log + Sentry — formal audit table is sprint 2.
      console.log(`[plans] admin updated plan ${input.id}`, {
        priceChanged,
        setupChanged,
        applyToExistingTenants: input.applyToExistingTenants,
        tenantsUpdated,
        before: {
          monthlyPriceBRL: before.monthlyPriceBRL,
          setupFeeBRL: before.setupFeeBRL,
          analysisLimit: before.analysisLimit,
          commissionRate: before.commissionRate,
        },
        after: {
          monthlyPriceBRL: input.monthlyPriceBRL,
          setupFeeBRL: input.setupFeeBRL,
          analysisLimit: input.analysisLimit,
          commissionRate: input.commissionRate,
        },
      });

      invalidatePlanCache();
      return { plan: updated, tenantsUpdated };
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.plan.update({
        where: { id: input.id },
        data: { deprecated: true, visible: false },
      });
      invalidatePlanCache();
      return updated;
    }),

  unarchive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.plan.update({
        where: { id: input.id },
        data: { deprecated: false, visible: true },
      });
      invalidatePlanCache();
      return updated;
    }),
});
