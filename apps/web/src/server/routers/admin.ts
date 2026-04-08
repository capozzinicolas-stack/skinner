import { z } from "zod/v4";
import { router, adminProcedure } from "../trpc";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { calculateMonthlyBill } from "@/lib/billing/stripe-mock";
import { hashSync } from "bcryptjs";

export const adminRouter = router({
  // ─── Dashboard overview ────────────────────────────────────────────────────

  dashboardOverview: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      analysesThisMonth,
      recentAnalyses,
      allActiveTenants,
    ] = await Promise.all([
      ctx.db.tenant.count(),
      ctx.db.tenant.count({ where: { status: "active" } }),
      ctx.db.user.count({ where: { role: { not: "skinner_admin" } } }),
      ctx.db.analysis.count({ where: { createdAt: { gte: monthStart } } }),
      ctx.db.analysis.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          status: true,
          skinType: true,
          conditions: true,
          latencyMs: true,
          clientEmail: true,
          clientName: true,
          tenant: { select: { name: true, slug: true } },
        },
      }),
      ctx.db.tenant.findMany({
        where: { status: "active" },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          analysisUsed: true,
          analysisLimit: true,
        },
      }),
    ]);

    const totalMRR = allActiveTenants.reduce((sum, t) => {
      const plan = PLANS[t.plan as PlanId];
      return sum + (plan?.monthlyPrice ?? 0);
    }, 0);

    const tenantsAtRisk = allActiveTenants.filter(
      (t) => t.analysisLimit > 0 && t.analysisUsed / t.analysisLimit >= 0.8
    );

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      analysesThisMonth,
      totalMRR,
      recentAnalyses,
      tenantsAtRisk,
    };
  }),

  // ─── Tenant detail ─────────────────────────────────────────────────────────

  tenantDetail: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          tenantConfig: true,
          _count: { select: { users: true, products: true, analyses: true } },
          subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      const periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);

      const [users, recentAnalyses, conversions] = await Promise.all([
        ctx.db.user.findMany({
          where: { tenantId: input.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.analysis.findMany({
          where: { tenantId: input.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            status: true,
            skinType: true,
            conditions: true,
            latencyMs: true,
            clientEmail: true,
            clientName: true,
          },
        }),
        ctx.db.conversion.aggregate({
          where: {
            recommendation: { analysis: { tenantId: input.id } },
            type: "purchase",
            createdAt: { gte: periodStart },
          },
          _sum: { saleValue: true },
        }),
      ]);

      const salesTotal = conversions._sum.saleValue ?? 0;
      const bill = calculateMonthlyBill(tenant.plan as PlanId, tenant.analysisUsed, salesTotal);

      return {
        tenant,
        users,
        recentAnalyses,
        currentBill: bill,
        salesTotal,
      };
    }),

  // Admin: change plan for any tenant
  changeTenantPlan: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        plan: z.enum(["starter", "growth", "enterprise"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const planConfig = PLANS[input.plan];
      return ctx.db.tenant.update({
        where: { id: input.tenantId },
        data: {
          plan: input.plan,
          analysisLimit: planConfig.analysisLimit,
          commissionRate: planConfig.commissionRate,
          excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
        },
      });
    }),

  // Admin: reset usage counter for a tenant
  resetTenantUsage: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenant.update({
        where: { id: input.tenantId },
        data: { analysisUsed: 0 },
      });
    }),

  // Admin: change tenant status
  changeTenantStatus: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        status: z.enum(["active", "paused", "deleted"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenant.update({
        where: { id: input.tenantId },
        data: { status: input.status },
      });
    }),

  // ─── Users management ──────────────────────────────────────────────────────

  listAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createUserForTenant: adminProcedure
    .input(
      z.object({
        email: z.email(),
        name: z.string().min(2),
        password: z.string().min(6),
        role: z.enum(["skinner_admin", "b2b_admin", "b2b_analyst", "b2b_viewer"]),
        tenantId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashSync(input.password, 10),
          role: input.role,
          tenantId: input.tenantId ?? null,
        },
        select: { id: true, email: true, name: true, role: true, tenantId: true },
      });
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deleting yourself
      if (input.id === ctx.userId) {
        throw new Error("Voce nao pode remover a si mesmo.");
      }
      return ctx.db.user.delete({ where: { id: input.id } });
    }),

  // ─── Leads management ─────────────────────────────────────────────────────

  listLeads: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  deleteLead: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.delete({ where: { id: input.id } });
    }),

  // ─── Platform analytics ────────────────────────────────────────────────────

  analytics: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Analyses per day (last 30 days)
    const analyses = await ctx.db.analysis.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        createdAt: true,
        conditions: true,
        latencyMs: true,
        recommendations: {
          select: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (const a of analyses) {
      const day = a.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    const analysesByDay = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Most common conditions
    const conditionCounts: Record<string, number> = {};
    for (const a of analyses) {
      if (!a.conditions) continue;
      try {
        const conds: Array<{ name: string }> = JSON.parse(a.conditions);
        for (const c of conds) {
          conditionCounts[c.name] = (conditionCounts[c.name] ?? 0) + 1;
        }
      } catch {
        // ignore parse errors
      }
    }
    const topConditions = Object.entries(conditionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Most recommended products
    const productCounts: Record<string, { name: string; count: number }> = {};
    for (const a of analyses) {
      for (const r of a.recommendations) {
        const key = r.product.sku;
        if (!productCounts[key]) {
          productCounts[key] = { name: r.product.name, count: 0 };
        }
        productCounts[key].count += 1;
      }
    }
    const topProducts = Object.entries(productCounts)
      .map(([sku, { name, count }]) => ({ sku, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average latency
    const latencies = analyses.map((a) => a.latencyMs).filter((l): l is number => l !== null);
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
        : null;

    return {
      analysesByDay,
      topConditions,
      topProducts,
      avgLatencyMs,
      totalAnalysed: analyses.length,
    };
  }),
});
