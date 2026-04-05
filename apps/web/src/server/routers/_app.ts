import { router } from "../trpc";
import { healthRouter } from "./health";
import { tenantRouter } from "./tenant";
import { userRouter } from "./user";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  health: healthRouter,
  tenant: tenantRouter,
  user: userRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
