import { router, publicProcedure } from "../trpc";

export const healthRouter = router({
  check: publicProcedure.query(async ({ ctx }) => {
    // Test DB connection
    const tenantCount = await ctx.db.tenant.count();
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "connected",
      tenants: tenantCount,
    };
  }),
});
