import { z } from "zod/v4";
import { router, adminProcedure, publicProcedure } from "../trpc";

export const tenantRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.tenant.findMany({
      orderBy: { createdAt: "desc" },
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
});
