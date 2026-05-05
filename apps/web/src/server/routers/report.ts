import { z } from "zod/v4";
import { router, tenantProcedure } from "../trpc";

export const reportRouter = router({
  list: tenantProcedure
    .input(z.object({ channelId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const channelId = input?.channelId;
      return ctx.db.analysis.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(channelId ? { channelId } : {}),
          status: "completed",
        },
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
          channel: {
            select: { id: true, label: true, slug: true },
          },
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
