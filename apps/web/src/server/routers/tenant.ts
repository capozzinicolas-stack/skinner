import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, publicProcedure, tenantProcedure } from "../trpc";

export const tenantRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, products: true, analyses: true } },
      },
    });
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tenant.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          tenantConfig: true,
          _count: { select: { users: true, products: true, analyses: true } },
        },
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tenant.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          brandVoice: true,
          disclaimer: true,
          tenantConfig: {
            select: {
              questionAllergiesEnabled: true,
              questionSunscreenEnabled: true,
              questionPregnantEnabled: true,
              photoOnlyMode: true,
              welcomeTitle: true,
              welcomeDescription: true,
              welcomeCtaText: true,
              welcomeSubtext: true,
              welcomeSubtextVisible: true,
              consentExtraText: true,
              consentButtonText: true,
              photoTitle: true,
              photoInstruction: true,
              photoExtraText: true,
              resultsShowBarrier: true,
              resultsShowConditions: true,
              resultsShowConditionsDesc: true,
              resultsShowSeverityBars: true,
              resultsShowActionPlan: true,
              resultsShowTimeline: true,
              resultsShowAlertSigns: true,
              resultsShowProducts: true,
              resultsShowServices: true,
              resultsShowMatchScore: true,
              resultsShowPdfButton: true,
              resultsShowPrices: true,
              resultsTopMessage: true,
              resultsFooterText: true,
              productCtaText: true,
              serviceCtaText: true,
              maxProductRecs: true,
              maxServiceRecs: true,
              // Storefront Lite
              storefrontEnabled: true,
              storefrontCtaMode: true,
              whatsappNumber: true,
              whatsappMessage: true,
              mercadoPagoEnabled: true,
              mercadoPagoEmail: true,
              // Skin projection
              projectionEnabled: true,
            },
          },
        },
      });
    }),

  // Public query: returns the full TenantConfig for a given tenant slug.
  // Used by the unauthenticated B2C analysis flow to drive UI behaviour.
  getAnalysisConfig: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [tenant, platformConfig] = await Promise.all([
        ctx.db.tenant.findUnique({
          where: { slug: input.slug },
          select: { tenantConfig: true },
        }),
        ctx.db.platformConfig.findUnique({
          where: { id: "default" },
          select: { questionnaireConfig: true },
        }),
      ]);

      const tenantConfig = tenant?.tenantConfig ?? null;
      let questions = null;
      if (platformConfig?.questionnaireConfig) {
        try {
          questions = JSON.parse(platformConfig.questionnaireConfig);
        } catch { /* ignore */ }
      }

      return {
        ...tenantConfig,
        questions,
      };
    }),

  // Public query: returns only storefront config for a given tenant slug.
  // Used by the unauthenticated B2C kit/results pages to determine CTA mode.
  getStorefrontConfig: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({
        where: { slug: input.slug },
        select: {
          tenantConfig: {
            select: {
              storefrontEnabled: true,
              storefrontCtaMode: true,
              whatsappNumber: true,
              whatsappMessage: true,
              mercadoPagoEnabled: true,
              mercadoPagoEmail: true,
            },
          },
        },
      });
      return tenant?.tenantConfig ?? null;
    }),

  getMine: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.tenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
      include: { tenantConfig: true },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        plan: z.enum(["starter", "growth", "enterprise"]).default("starter"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const limits = {
        starter: { analysisLimit: 200, commissionRate: 0.03, excessCostPerAnalysis: 3.5 },
        growth: { analysisLimit: 1000, commissionRate: 0.02, excessCostPerAnalysis: 2.0 },
        enterprise: { analysisLimit: 999999, commissionRate: 0.01, excessCostPerAnalysis: 0 },
      };

      return ctx.db.tenant.create({
        data: {
          ...input,
          ...limits[input.plan],
          tenantConfig: { create: {} },
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        plan: z.enum(["starter", "growth", "enterprise"]).optional(),
        status: z.enum(["active", "paused", "deleted"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, plan, ...rest } = input;

      const planLimits = plan
        ? {
            starter: { analysisLimit: 200, commissionRate: 0.03, excessCostPerAnalysis: 3.5 },
            growth: { analysisLimit: 1000, commissionRate: 0.02, excessCostPerAnalysis: 2.0 },
            enterprise: { analysisLimit: 999999, commissionRate: 0.01, excessCostPerAnalysis: 0 },
          }[plan]
        : {};

      return ctx.db.tenant.update({
        where: { id },
        data: { ...rest, ...(plan ? { plan, ...planLimits } : {}) },
      });
    }),

  updateBrand: tenantProcedure
    .input(
      z.object({
        logoUrl: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        brandVoice: z.string().optional(),
        disclaimer: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenant.update({
        where: { id: ctx.tenantId },
        data: input,
      });
    }),

  updateConfig: tenantProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        whatsappEnabled: z.boolean().optional(),
        whatsappNumber: z.string().optional(),
        pdfRetentionDays: z.number().int().min(7).max(365).optional(),
        webhookUrl: z.string().url().optional(),
        restrictedConditions: z.string().optional(),
        customPromptSuffix: z.string().optional(),
        kitEnabled: z.boolean().optional(),
        kitDiscount: z.number().min(0).max(100).nullable().optional(),
        // Storefront Lite
        storefrontEnabled: z.boolean().optional(),
        storefrontCtaMode: z.enum(["whatsapp", "mercadopago", "both", "external"]).optional(),
        whatsappMessage: z.string().nullable().optional(),
        mercadoPagoEnabled: z.boolean().optional(),
        mercadoPagoEmail: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenantConfig.update({
        where: { tenantId: ctx.tenantId },
        data: input,
      });
    }),

  // Authenticated mutation: update analysis display / UX configuration fields.
  // Respects adminLockedFields — any field listed there cannot be changed by the tenant.
  updateAnalysisConfig: tenantProcedure
    .input(
      z.object({
        // Questionnaire toggles
        questionAllergiesEnabled: z.boolean().optional(),
        questionSunscreenEnabled: z.boolean().optional(),
        questionPregnantEnabled: z.boolean().optional(),
        photoOnlyMode: z.boolean().optional(),
        // Welcome screen
        welcomeTitle: z.string().nullable().optional(),
        welcomeDescription: z.string().nullable().optional(),
        welcomeCtaText: z.string().nullable().optional(),
        welcomeSubtext: z.string().nullable().optional(),
        welcomeSubtextVisible: z.boolean().optional(),
        // Consent screen
        consentExtraText: z.string().nullable().optional(),
        consentButtonText: z.string().nullable().optional(),
        // Photo screen
        photoTitle: z.string().nullable().optional(),
        photoInstruction: z.string().nullable().optional(),
        photoExtraText: z.string().nullable().optional(),
        // Results toggles
        resultsShowBarrier: z.boolean().optional(),
        resultsShowConditions: z.boolean().optional(),
        resultsShowConditionsDesc: z.boolean().optional(),
        resultsShowSeverityBars: z.boolean().optional(),
        resultsShowActionPlan: z.boolean().optional(),
        resultsShowTimeline: z.boolean().optional(),
        resultsShowAlertSigns: z.boolean().optional(),
        resultsShowProducts: z.boolean().optional(),
        resultsShowServices: z.boolean().optional(),
        resultsShowMatchScore: z.boolean().optional(),
        resultsShowPdfButton: z.boolean().optional(),
        resultsShowPrices: z.boolean().optional(),
        // Results text
        resultsTopMessage: z.string().nullable().optional(),
        resultsFooterText: z.string().nullable().optional(),
        productCtaText: z.string().nullable().optional(),
        serviceCtaText: z.string().nullable().optional(),
        // Limits
        maxProductRecs: z.number().int().min(1).max(20).nullable().optional(),
        maxServiceRecs: z.number().int().min(1).max(20).nullable().optional(),
        // Skin projection feature
        projectionEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the current config to check locked fields
      const config = await ctx.db.tenantConfig.findUnique({
        where: { tenantId: ctx.tenantId },
        select: { adminLockedFields: true },
      });

      let lockedFields: string[] = [];
      try {
        lockedFields = config?.adminLockedFields
          ? JSON.parse(config.adminLockedFields)
          : [];
      } catch {
        lockedFields = [];
      }

      // Strip out any fields that are admin-locked
      const safeInput = { ...input };
      for (const field of lockedFields) {
        if (field in safeInput) {
          delete (safeInput as Record<string, unknown>)[field];
        }
      }

      // If any attempted change was blocked, throw an informative error
      const blockedAttempts = lockedFields.filter((f) => f in input);
      if (blockedAttempts.length > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Um ou mais campos foram bloqueados pelo administrador da plataforma e nao podem ser alterados.",
        });
      }

      return ctx.db.tenantConfig.update({
        where: { tenantId: ctx.tenantId },
        data: safeInput,
      });
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const [totalTenants, activeTenants, totalAnalyses, totalUsers] =
      await Promise.all([
        ctx.db.tenant.count(),
        ctx.db.tenant.count({ where: { status: "active" } }),
        ctx.db.analysis.count(),
        ctx.db.user.count({ where: { role: { not: "skinner_admin" } } }),
      ]);

    return { totalTenants, activeTenants, totalAnalyses, totalUsers };
  }),
});
