import { router } from "../trpc";
import { healthRouter } from "./health";
import { tenantRouter } from "./tenant";
import { userRouter } from "./user";
import { dashboardRouter } from "./dashboard";
import { productRouter } from "./product";
import { dermatologyRouter } from "./dermatology";
import { analysisRouter } from "./analysis";
import { reportRouter } from "./report";
import { billingRouter } from "./billing";
import { adminRouter } from "./admin";
import { kitRouter } from "./kit";
import { integrationRouter } from "./integration";

export const appRouter = router({
  health: healthRouter,
  tenant: tenantRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  product: productRouter,
  dermatology: dermatologyRouter,
  analysis: analysisRouter,
  report: reportRouter,
  billing: billingRouter,
  admin: adminRouter,
  kit: kitRouter,
  integration: integrationRouter,
});

export type AppRouter = typeof appRouter;
