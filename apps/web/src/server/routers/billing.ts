import { z } from "zod/v4";
import { router, tenantProcedure, adminProcedure, publicProcedure } from "../trpc";
import { getPlan, getAllPlans, type PlanId } from "@/lib/billing/plans";
import { calculateMonthlyBill, createCheckoutUrl, createPortalUrl, isStripeConfigured } from "@/lib/billing/stripe-mock";

export const billingRouter = router({
  // Public list of plans for the marketing /planos page. Same shape as the
  // authenticated `plans` query but doesn't require a tenant session.
  publicPlans: publicProcedure.query(async () => {
    const all = await getAllPlans({ visibleOnly: true });
    return all.map((plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyPriceBRL: plan.monthlyPriceBRL,
      setupFeeBRL: plan.setupFeeBRL,
      analysisLimit: plan.analysisLimit,
      commissionRate: plan.commissionRate,
      maxUsers: plan.maxUsers,
      features: plan.features,
      ctaText: plan.ctaText,
      customAllowed: plan.customAllowed,
      displayOrder: plan.displayOrder,
    }));
  }),


  // Get current plan and usage for tenant
  status: tenantProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db.tenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
      include: {
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const planConfig = await getPlan(tenant.plan);

    // Custom-plan override: when the tenant signed up via /admin/tenants/novo-custom,
    // the webhook persisted Tenant.planLabel + Tenant.customMonthlyPriceBRL from
    // Stripe metadata. Apply them here so faturamento shows the negotiated label
    // and the actual price the customer pays at Stripe — not the generic plan
    // tier defaults that the custom signup mapped to (currently "enterprise").
    const isCustomPlan = tenant.planLabel !== null;
    const effectivePlanForBill = planConfig
      ? {
          ...planConfig,
          monthlyPriceBRL:
            tenant.customMonthlyPriceBRL ?? planConfig.monthlyPriceBRL,
        }
      : null;

    // Count conversions this period
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const conversions = await ctx.db.conversion.aggregate({
      where: {
        recommendation: { analysis: { tenantId: ctx.tenantId } },
        type: "purchase",
        createdAt: { gte: periodStart },
      },
      _sum: { saleValue: true },
    });

    const salesTotal = conversions._sum.saleValue ?? 0;
    const bill = calculateMonthlyBill(
      effectivePlanForBill,
      tenant.analysisUsed,
      salesTotal
    );

    return {
      plan: tenant.plan,
      planName: tenant.planLabel ?? planConfig?.name ?? tenant.plan,
      isCustomPlan,
      analysisLimit: tenant.analysisLimit,
      analysisUsed: tenant.analysisUsed,
      creditsRemaining: tenant.analysisLimit - tenant.analysisUsed,
      commissionRate: tenant.commissionRate,
      subscription: tenant.subscriptions[0] ?? null,
      currentBill: bill,
      salesTotal,
      portalUrl: createPortalUrl(ctx.tenantId),
    };
  }),

  // Get available plans (visible + non-deprecated)
  plans: tenantProcedure.query(async () => {
    const all = await getAllPlans({ visibleOnly: true });
    return all.map((plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyPrice: plan.monthlyPriceBRL,
      setupFee: plan.setupFeeBRL,
      analysisLimit: plan.analysisLimit,
      excessCostPerAnalysis: plan.excessCostPerAnalysis,
      commissionRate: plan.commissionRate,
      maxUsers: plan.maxUsers,
      features: plan.features,
      ctaText: plan.ctaText,
      customAllowed: plan.customAllowed,
    }));
  }),

  // Create checkout session for plan upgrade. Plan id is now any string
  // (admin can create custom slugs); validation happens server-side via getPlan.
  checkout: tenantProcedure
    .input(z.object({ planId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const plan = await getPlan(input.planId);
      if (!plan) {
        return { url: `/dashboard/faturamento?error=plan-not-found`, useApi: false };
      }
      if (isStripeConfigured() && !plan.customAllowed) {
        // Real Stripe — return API endpoint URL for the client to POST to
        return { url: `/api/billing/checkout`, planId: input.planId, useApi: true };
      }
      const url = createCheckoutUrl(input.planId, ctx.tenantId);
      return { url, useApi: false };
    }),

  // Create portal session for managing subscription
  portal: tenantProcedure.mutation(async () => {
    if (isStripeConfigured()) {
      return { url: `/api/billing/portal`, useApi: true };
    }
    return { url: `/dashboard/faturamento`, useApi: false };
  }),

  // Upgrade/downgrade plan (mock - in production this would be Stripe webhook)
  changePlan: tenantProcedure
    .input(z.object({ planId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const planConfig = await getPlan(input.planId);
      if (!planConfig) {
        throw new Error("Plan not found");
      }

      await ctx.db.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          plan: input.planId,
          analysisLimit: planConfig.analysisLimit,
          commissionRate: planConfig.commissionRate,
          excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
        },
      });

      // Create/update subscription record
      await ctx.db.subscription.upsert({
        where: {
          stripeSubscriptionId: `mock_sub_${ctx.tenantId}`,
        },
        create: {
          tenantId: ctx.tenantId,
          plan: input.planId,
          status: "active",
          stripeSubscriptionId: `mock_sub_${ctx.tenantId}`,
          stripeCustomerId: `mock_cus_${ctx.tenantId}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan: input.planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return { success: true };
    }),

  // Usage events history
  usageHistory: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.usageEvent.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  // Admin: billing overview across all tenants
  adminOverview: adminProcedure.query(async ({ ctx }) => {
    const tenants = await ctx.db.tenant.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        analysisUsed: true,
        analysisLimit: true,
      },
    });

    const allPlans = await getAllPlans({ visibleOnly: false, includeDeprecated: true });
    const planMap = new Map(allPlans.map((p) => [p.id, p]));

    const totalMRR = tenants.reduce((sum, t) => {
      const plan = planMap.get(t.plan);
      return sum + (plan?.monthlyPriceBRL ?? 0);
    }, 0);

    return { tenants, totalMRR };
  }),
});
