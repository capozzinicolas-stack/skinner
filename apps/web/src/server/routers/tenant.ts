import { z } from "zod/v4";
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
        },
      });
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenantConfig.update({
        where: { tenantId: ctx.tenantId },
        data: input,
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
