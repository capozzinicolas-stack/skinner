import { router } from "../trpc";
import { healthRouter } from "./health";
import { tenantRouter } from "./tenant";
import { userRouter } from "./user";
import { dashboardRouter } from "./dashboard";
import { productRouter } from "./product";
import { dermatologyRouter } from "./dermatology";
import { analysisRouter } from "./analysis";
import { reportRouter } from "./report";

export const appRouter = router({
  health: healthRouter,
  tenant: tenantRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  product: productRouter,
  dermatology: dermatologyRouter,
  analysis: analysisRouter,
  report: reportRouter,
});

export type AppRouter = typeof appRouter;
