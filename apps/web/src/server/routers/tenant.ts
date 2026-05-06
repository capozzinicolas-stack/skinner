import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, publicProcedure, tenantProcedure } from "../trpc";
import { getPlan } from "@/lib/billing/plans";

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

  // Resolves a slug to its tenant + active channel (if any). Search order:
  //   1. AnalysisChannel.slug match → returns the parent tenant + channelId.
  //   2. Tenant.slug fallback → returns tenant with channelId=null (legacy).
  // Channel state is enforced here so paused/expired channels block before
  // the patient even sees the welcome screen.
  //
  // Per-channel overrides: AnalysisChannel.overrides is a JSON map of
  // tenantConfig field overrides. We merge it onto the resolved tenantConfig
  // so patients on channel "X" see channel-specific welcome / contact
  // capture / CTA copy without changing the underlying tenant defaults.
  // Whitelist enforced at write time (see analysisChannel.update); read time
  // applies whatever's stored.
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const channel = await ctx.db.analysisChannel.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          slug: true,
          label: true,
          status: true,
          expiresAt: true,
          maxAnalyses: true,
          isDefault: true,
          overrides: true,
          tenantId: true,
        },
      });

      const tenantSlug = channel ? null : input.slug;

      const tenant = await ctx.db.tenant.findUnique({
        where: channel ? { id: channel.tenantId } : { slug: tenantSlug! },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          brandVoice: true,
          disclaimer: true,
          defaultLocale: true,
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
              // Lead capture (public so the analysis flow knows whether to render the step)
              contactCaptureEnabled: true,
              contactCaptureRequired: true,
              contactCustomMessage: true,
            },
          },
        },
      });

      if (!tenant) return null;

      // Compute live channel status (expired = expiresAt < now). Paused or
      // expired channels block the analysis flow with a friendly message —
      // the patient page surfaces this. Default channel is always active so
      // legacy URLs (slug = tenant.slug) keep resolving.
      let channelStatus: "active" | "paused" | "expired" | null = null;
      if (channel) {
        if (channel.status === "paused") channelStatus = "paused";
        else if (channel.expiresAt && channel.expiresAt.getTime() < Date.now())
          channelStatus = "expired";
        else channelStatus = "active";
      }

      // Merge channel overrides onto tenantConfig. Failure to parse leaves
      // tenantConfig untouched — never crashes the patient flow.
      let mergedTenantConfig = tenant.tenantConfig;
      // Channel-level locale override (Commit 4 May-2026). Lives in
      // overrides.locale because we don't add a column for every per-channel
      // knob; the UI/whitelist controls what's safe to override.
      let channelLocaleOverride: string | null = null;
      if (channel?.overrides && tenant.tenantConfig) {
        try {
          const parsed = JSON.parse(channel.overrides);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            if (typeof obj.locale === "string") {
              channelLocaleOverride = obj.locale;
            }
            // locale is NOT a TenantConfig field, so strip it before merging
            // into tenantConfig (would break Prisma type assertions).
            const { locale: _drop, ...rest } = obj;
            mergedTenantConfig = {
              ...tenant.tenantConfig,
              ...(rest as Record<string, unknown>),
            } as typeof tenant.tenantConfig;
          }
        } catch {
          // Malformed overrides JSON — ignore silently.
        }
      }

      // Effective locale: channel override → tenant default → "pt-BR" fallback.
      // Used by Commit 5 to drive Claude prompt + by client to set i18n provider.
      const effectiveLocale =
        channelLocaleOverride ?? tenant.defaultLocale ?? "pt-BR";

      return {
        ...tenant,
        tenantConfig: mergedTenantConfig,
        channelId: channel?.id ?? null,
        channelSlug: channel?.slug ?? input.slug,
        channelLabel: channel?.label ?? null,
        channelStatus,
        channelMaxAnalyses: channel?.maxAnalyses ?? null,
        effectiveLocale,
      };
    }),

  // Public query: returns the full TenantConfig for a given tenant slug.
  // Used by the unauthenticated B2C analysis flow to drive UI behaviour.
  // When the slug matches an AnalysisChannel, the channel.overrides JSON is
  // merged onto tenantConfig so per-channel UI variants take effect.
  getAnalysisConfig: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve channel first (same precedence as getBySlug).
      const channel = await ctx.db.analysisChannel.findUnique({
        where: { slug: input.slug },
        select: { tenantId: true, overrides: true },
      });

      const [tenant, platformConfig] = await Promise.all([
        ctx.db.tenant.findUnique({
          where: channel ? { id: channel.tenantId } : { slug: input.slug },
          select: { tenantConfig: true },
        }),
        ctx.db.platformConfig.findUnique({
          where: { id: "default" },
          select: { questionnaireConfig: true },
        }),
      ]);

      let tenantConfig: Record<string, unknown> | null =
        (tenant?.tenantConfig as unknown as Record<string, unknown>) ?? null;

      // Merge channel overrides — channel keys win.
      if (channel?.overrides && tenantConfig) {
        try {
          const parsed = JSON.parse(channel.overrides);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            tenantConfig = { ...tenantConfig, ...(parsed as Record<string, unknown>) };
          }
        } catch { /* ignore malformed overrides */ }
      }

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

  // Self-service organization metadata update. Tenant-admin only — analysts
  // and viewers see the page in read-only mode but can't save. The fields
  // here are intentionally NOT plan/limit related — those live on /admin only.
  updateOrganization: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100).optional(),
        country: z.string().length(2).nullable().optional(), // ISO-3166 alpha-2
        timezone: z.string().max(50).nullable().optional(), // IANA tz
        defaultLocale: z.enum(["pt-BR", "es", "en"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Role guard: only b2b_admin can edit org settings.
      const me = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
        select: { role: true },
      });
      if (me.role !== "b2b_admin" && me.role !== "skinner_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem alterar dados da organizacao.",
        });
      }
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.country !== undefined) data.country = input.country;
      if (input.timezone !== undefined) data.timezone = input.timezone;
      if (input.defaultLocale !== undefined)
        data.defaultLocale = input.defaultLocale;
      return ctx.db.tenant.update({
        where: { id: ctx.tenantId },
        data,
        select: {
          id: true,
          name: true,
          country: true,
          timezone: true,
          defaultLocale: true,
        },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        plan: z.string().min(1).default("growth"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const planConfig = await getPlan(input.plan);
      if (!planConfig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Plano "${input.plan}" nao encontrado.`,
        });
      }

      return ctx.db.tenant.create({
        data: {
          ...input,
          analysisLimit: planConfig.analysisLimit,
          commissionRate: planConfig.commissionRate,
          excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
          tenantConfig: { create: {} },
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        plan: z.string().min(1).optional(),
        status: z.enum(["active", "paused", "deleted"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, plan, ...rest } = input;

      let planLimits: {
        analysisLimit: number;
        commissionRate: number;
        excessCostPerAnalysis: number;
      } | null = null;
      if (plan) {
        const planConfig = await getPlan(plan);
        if (!planConfig) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Plano "${plan}" nao encontrado.`,
          });
        }
        planLimits = {
          analysisLimit: planConfig.analysisLimit,
          commissionRate: planConfig.commissionRate,
          excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
        };
      }

      return ctx.db.tenant.update({
        where: { id },
        data: { ...rest, ...(plan && planLimits ? { plan, ...planLimits } : {}) },
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
        // Analysis tone — controls how patient-facing fields are written
        analysisTone: z.enum(["humanized", "technical"]).optional(),
        // Cross-tenant benchmark opt-in (privacy-first; off by default)
        benchmarkOptIn: z.boolean().optional(),
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
        // Lead capture
        contactCaptureEnabled: z.boolean().optional(),
        contactCaptureRequired: z.boolean().optional(),
        contactCustomMessage: z.string().nullable().optional(),
        autoSendPdfEmail: z.boolean().optional(),
        notifyTenantNewLead: z.boolean().optional(),
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
