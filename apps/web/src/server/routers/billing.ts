import { z } from "zod/v4";
import { router, tenantProcedure, adminProcedure } from "../trpc";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { calculateMonthlyBill, createCheckoutUrl, createPortalUrl, isStripeConfigured } from "@/lib/billing/stripe-mock";

export const billingRouter = router({
  // Get current plan and usage for tenant
  status: tenantProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db.tenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
      include: {
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const plan = tenant.plan as PlanId;
    const planConfig = PLANS[plan];

    // Count conversions this period
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const conversions = await ctx.db.conversion.aggregate({
      where: {
        recommendation: { analysis: { tenantId: ctx.tenantId } },
        type: "purchase",
        createdAt: { gte: periodStart },
      },
      _sum: { saleValue: true },
    });

    const salesTotal = conversions._sum.saleValue ?? 0;
    const bill = calculateMonthlyBill(plan, tenant.analysisUsed, salesTotal);

    return {
      plan,
      planName: planConfig.name,
      analysisLimit: tenant.analysisLimit,
      analysisUsed: tenant.analysisUsed,
      creditsRemaining: tenant.analysisLimit - tenant.analysisUsed,
      commissionRate: tenant.commissionRate,
      subscription: tenant.subscriptions[0] ?? null,
      currentBill: bill,
      salesTotal,
      portalUrl: createPortalUrl(ctx.tenantId),
    };
  }),

  // Get available plans
  plans: tenantProcedure.query(() => {
    return Object.entries(PLANS).map(([id, plan]) => ({
      id,
      ...plan,
    }));
  }),

  // Create checkout session for plan upgrade
  checkout: tenantProcedure
    .input(z.object({ planId: z.enum(["growth", "pro", "enterprise"]) }))
    .mutation(async ({ ctx, input }) => {
      if (isStripeConfigured() && input.planId !== "enterprise") {
        // Real Stripe — return API endpoint URL for the client to POST to
        return { url: `/api/billing/checkout`, planId: input.planId, useApi: true };
      }
      const url = createCheckoutUrl(input.planId, ctx.tenantId);
      return { url, useApi: false };
    }),

  // Create portal session for managing subscription
  portal: tenantProcedure.mutation(async () => {
    if (isStripeConfigured()) {
      return { url: `/api/billing/portal`, useApi: true };
    }
    return { url: `/dashboard/faturamento`, useApi: false };
  }),

  // Upgrade/downgrade plan (mock - in production this would be Stripe webhook)
  changePlan: tenantProcedure
    .input(z.object({ planId: z.enum(["growth", "pro", "enterprise"]) }))
    .mutation(async ({ ctx, input }) => {
      const planConfig = PLANS[input.planId];

      await ctx.db.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          plan: input.planId,
          analysisLimit: planConfig.analysisLimit,
          commissionRate: planConfig.commissionRate,
          excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
        },
      });

      // Create/update subscription record
      await ctx.db.subscription.upsert({
        where: {
          stripeSubscriptionId: `mock_sub_${ctx.tenantId}`,
        },
        create: {
          tenantId: ctx.tenantId,
          plan: input.planId,
          status: "active",
          stripeSubscriptionId: `mock_sub_${ctx.tenantId}`,
          stripeCustomerId: `mock_cus_${ctx.tenantId}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan: input.planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return { success: true };
    }),

  // Usage events history
  usageHistory: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.usageEvent.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  // Admin: billing overview across all tenants
  adminOverview: adminProcedure.query(async ({ ctx }) => {
    const tenants = await ctx.db.tenant.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        analysisUsed: true,
        analysisLimit: true,
      },
    });

    const totalMRR = tenants.reduce((sum, t) => {
      const plan = PLANS[t.plan as PlanId];
      return sum + (plan?.monthlyPrice ?? 0);
    }, 0);

    return { tenants, totalMRR };
  }),
});
