import { router } from "../trpc";
import { healthRouter } from "./health";
import { tenantRouter } from "./tenant";

export const appRouter = router({
  health: healthRouter,
  tenant: tenantRouter,
});

export type AppRouter = typeof appRouter;
