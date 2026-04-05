import { router, tenantProcedure } from "../trpc";

export const reportRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.analysis.findMany({
      where: { tenantId: ctx.tenantId, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        clientEmail: true,
        clientName: true,
        clientAge: true,
        skinType: true,
        conditions: true,
        primaryObjective: true,
        latencyMs: true,
        createdAt: true,
        report: {
          select: { id: true, channel: true, sentAt: true },
        },
        recommendations: {
          select: { product: { select: { name: true } } },
          orderBy: { rank: "asc" },
          take: 3,
        },
      },
    });
  }),
});
