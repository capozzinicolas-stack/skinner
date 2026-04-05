import { router, tenantProcedure } from "../trpc";

export const dashboardRouter = router({
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [analysisCount, productCount, conversionCount, tenant] =
      await Promise.all([
        ctx.db.analysis.count({ where: { tenantId: ctx.tenantId } }),
        ctx.db.product.count({ where: { tenantId: ctx.tenantId, isActive: true } }),
        ctx.db.conversion.count({
          where: {
            recommendation: { analysis: { tenantId: ctx.tenantId } },
            type: "purchase",
          },
        }),
        ctx.db.tenant.findUniqueOrThrow({
          where: { id: ctx.tenantId },
          select: {
            analysisLimit: true,
            analysisUsed: true,
            plan: true,
          },
        }),
      ]);

    return {
      analysisCount,
      productCount,
      conversionCount,
      creditsRemaining: tenant.analysisLimit - tenant.analysisUsed,
      plan: tenant.plan,
    };
  }),
});
