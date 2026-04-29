import { z } from "zod/v4";
import { router, tenantProcedure } from "../trpc";

/**
 * Dashboard analytics for B2B tenants.
 *
 * All queries are scoped to ctx.tenantId via tenantProcedure (multi-tenant isolation).
 * Period filter: number of days back from now (default 30).
 *
 * Pre-aggregates server-side so the client UI stays simple.
 */

const periodInput = z.object({
  days: z.number().int().min(1).max(365).default(30),
});

function safeParseArray(json: string | null | undefined): unknown[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObject(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export const dashboardRouter = router({
  // ─── Original light stats (kept for backward compat) ──────────────────────────────
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [analysisCount, productCount, conversionCount, tenant] =
      await Promise.all([
        ctx.db.analysis.count({ where: { tenantId: ctx.tenantId } }),
        ctx.db.product.count({ where: { tenantId: ctx.tenantId, isActive: true } }),
        ctx.db.conversion.count({
          where: {
            recommendation: { analysis: { tenantId: ctx.tenantId } },
            type: "purchase",
          },
        }),
        ctx.db.tenant.findUniqueOrThrow({
          where: { id: ctx.tenantId },
          select: {
            analysisLimit: true,
            analysisUsed: true,
            plan: true,
          },
        }),
      ]);

    return {
      analysisCount,
      productCount,
      conversionCount,
      creditsRemaining: tenant.analysisLimit - tenant.analysisUsed,
      plan: tenant.plan,
    };
  }),

  // ─── ROI overview ─────────────────────────────────────────────────────────────────
  overview: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const tenantId = ctx.tenantId;

    const [
      analysesInPeriod,
      analysesCompletedInPeriod,
      tenant,
      conversionsInPeriod,
      pdfReportsInPeriod,
    ] = await Promise.all([
      ctx.db.analysis.count({
        where: { tenantId, createdAt: { gte: since } },
      }),
      ctx.db.analysis.count({
        where: { tenantId, status: "completed", createdAt: { gte: since } },
      }),
      ctx.db.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { analysisLimit: true, analysisUsed: true, plan: true, commissionRate: true },
      }),
      ctx.db.conversion.findMany({
        where: {
          recommendation: { analysis: { tenantId } },
          type: "purchase",
          createdAt: { gte: since },
        },
        select: { saleValue: true },
      }),
      ctx.db.report.count({
        where: { analysis: { tenantId }, createdAt: { gte: since } },
      }),
    ]);

    const totalRevenue = conversionsInPeriod.reduce((sum, c) => sum + (c.saleValue ?? 0), 0);
    const conversionCount = conversionsInPeriod.length;
    const conversionRate =
      analysesCompletedInPeriod > 0 ? conversionCount / analysesCompletedInPeriod : 0;
    const avgTicket = conversionCount > 0 ? totalRevenue / conversionCount : 0;
    const completionRate =
      analysesInPeriod > 0 ? analysesCompletedInPeriod / analysesInPeriod : 0;
    const usagePct =
      tenant.analysisLimit > 0 ? tenant.analysisUsed / tenant.analysisLimit : 0;

    return {
      periodDays: input.days,
      analysesStarted: analysesInPeriod,
      analysesCompleted: analysesCompletedInPeriod,
      completionRate,
      conversions: conversionCount,
      conversionRate,
      revenue: totalRevenue,
      avgTicket,
      pdfDownloads: pdfReportsInPeriod,
      planUsage: {
        plan: tenant.plan,
        used: tenant.analysisUsed,
        limit: tenant.analysisLimit,
        pct: usagePct,
      },
    };
  }),

  // ─── Monthly trend (last N months) ────────────────────────────────────────────────
  monthlyTrend: tenantProcedure
    .input(z.object({ months: z.number().int().min(1).max(24).default(6) }))
    .query(async ({ ctx, input }) => {
      const start = new Date();
      start.setMonth(start.getMonth() - input.months + 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const [analyses, conversions] = await Promise.all([
        ctx.db.analysis.findMany({
          where: { tenantId: ctx.tenantId, createdAt: { gte: start } },
          select: { createdAt: true },
        }),
        ctx.db.conversion.findMany({
          where: {
            recommendation: { analysis: { tenantId: ctx.tenantId } },
            type: "purchase",
            createdAt: { gte: start },
          },
          select: { createdAt: true, saleValue: true },
        }),
      ]);

      const buckets: Record<
        string,
        { month: string; analyses: number; conversions: number; revenue: number }
      > = {};
      for (let i = 0; i < input.months; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets[key] = { month: key, analyses: 0, conversions: 0, revenue: 0 };
      }
      for (const a of analyses) {
        const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (buckets[key]) buckets[key].analyses += 1;
      }
      for (const c of conversions) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (buckets[key]) {
          buckets[key].conversions += 1;
          buckets[key].revenue += c.saleValue ?? 0;
        }
      }

      return Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month));
    }),

  // ─── Geo (region + city) ──────────────────────────────────────────────────────────
  byRegion: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const grouped = await ctx.db.analysis.groupBy({
      by: ["clientRegion"],
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    });
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    return grouped.map((g) => ({
      region: g.clientRegion ?? "Desconhecido",
      count: g._count._all,
      pct: total > 0 ? g._count._all / total : 0,
    }));
  }),

  byCity: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const grouped = await ctx.db.analysis.groupBy({
      by: ["clientCity", "clientRegion"],
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });
    return grouped.map((g) => ({
      city: g.clientCity ?? "Desconhecido",
      region: g.clientRegion ?? null,
      count: g._count._all,
    }));
  }),

  // ─── Clinical insights ────────────────────────────────────────────────────────────
  bySkinType: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const grouped = await ctx.db.analysis.groupBy({
      by: ["skinType"],
      where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
      _count: { _all: true },
    });
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    return grouped
      .filter((g) => g.skinType)
      .map((g) => ({
        skinType: g.skinType!,
        count: g._count._all,
        pct: total > 0 ? g._count._all / total : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }),

  byAgeRange: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const grouped = await ctx.db.analysis.groupBy({
      by: ["clientAge"],
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      _count: { _all: true },
    });
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    const order = ["18-24", "25-34", "35-44", "45-54", "55+"];
    return grouped
      .filter((g) => g.clientAge)
      .map((g) => ({
        ageRange: g.clientAge!,
        count: g._count._all,
        pct: total > 0 ? g._count._all / total : 0,
      }))
      .sort(
        (a, b) =>
          (order.indexOf(a.ageRange) === -1 ? 99 : order.indexOf(a.ageRange)) -
          (order.indexOf(b.ageRange) === -1 ? 99 : order.indexOf(b.ageRange))
      );
  }),

  byObjective: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const grouped = await ctx.db.analysis.groupBy({
      by: ["primaryObjective"],
      where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    });
    return grouped
      .filter((g) => g.primaryObjective)
      .map((g) => ({ objective: g.primaryObjective!, count: g._count._all }));
  }),

  byBarrierStatus: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const grouped = await ctx.db.analysis.groupBy({
      by: ["barrierStatus"],
      where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
      _count: { _all: true },
    });
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    return grouped
      .filter((g) => g.barrierStatus)
      .map((g) => ({
        status: g.barrierStatus!,
        count: g._count._all,
        pct: total > 0 ? g._count._all / total : 0,
      }));
  }),

  /**
   * Top-N detected conditions in the period + average severity.
   * Iterates JSON conditions because they're serialized per analysis.
   */
  topConditions: tenantProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 86_400_000);
      const rows = await ctx.db.analysis.findMany({
        where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
        select: { conditions: true },
      });
      const tally = new Map<string, { count: number; severitySum: number }>();
      for (const r of rows) {
        const arr = safeParseArray(r.conditions) as Array<{ name?: string; severity?: number }>;
        for (const c of arr) {
          if (!c?.name) continue;
          const cur = tally.get(c.name) ?? { count: 0, severitySum: 0 };
          cur.count += 1;
          cur.severitySum += typeof c.severity === "number" ? c.severity : 0;
          tally.set(c.name, cur);
        }
      }
      return Array.from(tally.entries())
        .map(([name, v]) => ({
          condition: name,
          count: v.count,
          avgSeverity: v.count > 0 ? v.severitySum / v.count : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit);
    }),

  /**
   * Skin-type discrepancy: how often Claude's detected type differs from
   * the patient's self-reported type. High value → strong selling point.
   */
  skinTypeDiscrepancy: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const rows = await ctx.db.analysis.findMany({
      where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
      select: { questionnaireData: true, skinType: true },
    });
    let total = 0;
    let mismatch = 0;
    const matrix: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      const q = safeParseObject(r.questionnaireData);
      const reported = typeof q.skin_type === "string" ? q.skin_type : null;
      const detected = r.skinType;
      if (!reported || !detected) continue;
      total += 1;
      if (reported !== detected) mismatch += 1;
      if (!matrix[reported]) matrix[reported] = {};
      matrix[reported][detected] = (matrix[reported][detected] ?? 0) + 1;
    }
    return {
      total,
      mismatch,
      mismatchPct: total > 0 ? mismatch / total : 0,
      matrix,
    };
  }),

  // ─── Catalog performance ──────────────────────────────────────────────────────────
  topProducts: tenantProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 86_400_000);
      const grouped = await ctx.db.recommendation.groupBy({
        by: ["productId"],
        where: { analysis: { tenantId: ctx.tenantId, createdAt: { gte: since } } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: input.limit,
      });
      if (grouped.length === 0) return [];
      const products = await ctx.db.product.findMany({
        where: { id: { in: grouped.map((g) => g.productId) } },
        select: { id: true, name: true, sku: true, type: true, stepRoutine: true, price: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      return grouped.map((g) => ({
        productId: g.productId,
        recommendationCount: g._count._all,
        product: byId.get(g.productId) ?? null,
      }));
    }),

  /**
   * Catalog gaps: detected conditions where the tenant has NO product tagged.
   * Tells the B2B exactly what to add to capture more demand.
   */
  catalogGaps: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const [analyses, products] = await Promise.all([
      ctx.db.analysis.findMany({
        where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
        select: { conditions: true },
      }),
      ctx.db.product.findMany({
        where: { tenantId: ctx.tenantId, isActive: true },
        select: { concernTags: true },
      }),
    ]);

    const conditionTally = new Map<string, number>();
    for (const a of analyses) {
      const arr = safeParseArray(a.conditions) as Array<{ name?: string }>;
      for (const c of arr) {
        if (c?.name) conditionTally.set(c.name, (conditionTally.get(c.name) ?? 0) + 1);
      }
    }
    const tagsCovered = new Set<string>();
    for (const p of products) {
      for (const t of safeParseArray(p.concernTags) as string[]) {
        if (typeof t === "string") tagsCovered.add(t);
      }
    }
    const total = Array.from(conditionTally.values()).reduce((s, v) => s + v, 0);
    return Array.from(conditionTally.entries())
      .filter(([name]) => !tagsCovered.has(name))
      .map(([name, count]) => ({
        condition: name,
        count,
        pctOfPatients: total > 0 ? count / total : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }),

  // ─── Engagement ───────────────────────────────────────────────────────────────────
  engagementMetrics: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const [completed, pdfsByChannel] = await Promise.all([
      ctx.db.analysis.count({
        where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: since } },
      }),
      ctx.db.report.groupBy({
        by: ["channel"],
        where: { analysis: { tenantId: ctx.tenantId }, createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);
    const reportTotals: Record<string, number> = {};
    for (const r of pdfsByChannel) reportTotals[r.channel] = r._count._all;
    const downloadCount = reportTotals.download ?? 0;
    const emailCount = reportTotals.email ?? 0;
    return {
      completed,
      pdfDownloads: downloadCount,
      emailsSent: emailCount,
      downloadRate: completed > 0 ? downloadCount / completed : 0,
      emailRate: completed > 0 ? emailCount / completed : 0,
    };
  }),

  /**
   * Conversion lift by patient profile.
   *
   * For each segment (skin type, age range, primary objective, region), computes:
   *   - patients in that segment
   *   - patients in that segment who converted (purchase)
   *   - segment conversion rate
   *   - lift vs the global tenant baseline (e.g. 1.45x means 45% above average)
   *
   * Helps the B2B identify which audiences buy more — actionable for paid campaigns
   * and inventory planning. Returns top segments per dimension by lift, filtered to
   * segments with meaningful sample size (>= 3 patients in segment) to avoid noise.
   */
  conversionLiftByProfile: tenantProcedure
    .input(periodInput)
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 86_400_000);
      const tenantId = ctx.tenantId;

      // Pull all completed analyses with the dims we slice on, plus convert flag.
      const analyses = await ctx.db.analysis.findMany({
        where: { tenantId, status: "completed", createdAt: { gte: since } },
        select: {
          id: true,
          skinType: true,
          clientAge: true,
          primaryObjective: true,
          clientRegion: true,
          recommendations: { select: { conversions: { where: { type: "purchase" }, select: { id: true } } } },
        },
      });

      const totalPatients = analyses.length;
      const converted = analyses.filter((a) =>
        a.recommendations.some((r) => r.conversions.length > 0)
      ).length;
      const baselineRate = totalPatients > 0 ? converted / totalPatients : 0;

      function buildLift(
        dim: "skinType" | "clientAge" | "primaryObjective" | "clientRegion"
      ) {
        const tally = new Map<string, { patients: number; converted: number }>();
        for (const a of analyses) {
          const key = (a as Record<string, unknown>)[dim] as string | null;
          if (!key) continue;
          const cur = tally.get(key) ?? { patients: 0, converted: 0 };
          cur.patients += 1;
          if (a.recommendations.some((r) => r.conversions.length > 0)) cur.converted += 1;
          tally.set(key, cur);
        }
        return Array.from(tally.entries())
          .filter(([, v]) => v.patients >= 3) // require min sample
          .map(([key, v]) => {
            const rate = v.patients > 0 ? v.converted / v.patients : 0;
            const lift = baselineRate > 0 ? rate / baselineRate : 0;
            return { key, patients: v.patients, converted: v.converted, rate, lift };
          })
          .sort((a, b) => b.lift - a.lift);
      }

      return {
        baseline: { totalPatients, converted, rate: baselineRate },
        bySkinType: buildLift("skinType"),
        byAgeRange: buildLift("clientAge"),
        byObjective: buildLift("primaryObjective"),
        byRegion: buildLift("clientRegion"),
      };
    }),

  /**
   * Seasonality of detected conditions: for each top condition, how its monthly
   * volume changes over the last N months. Reveals patterns like "manchas
   * spike in March-April after summer" so the B2B can plan campaigns.
   *
   * Returns a matrix: { months[], series[{ condition, values[] }] }.
   */
  seasonalityByCondition: tenantProcedure
    .input(z.object({ months: z.number().int().min(3).max(24).default(12), topConditions: z.number().int().min(2).max(8).default(5) }))
    .query(async ({ ctx, input }) => {
      const start = new Date();
      start.setMonth(start.getMonth() - input.months + 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const rows = await ctx.db.analysis.findMany({
        where: { tenantId: ctx.tenantId, status: "completed", createdAt: { gte: start } },
        select: { conditions: true, createdAt: true },
      });

      // Identify the top-N conditions by total count
      const totalTally = new Map<string, number>();
      for (const r of rows) {
        const arr = safeParseArray(r.conditions) as Array<{ name?: string }>;
        for (const c of arr) {
          if (c?.name) totalTally.set(c.name, (totalTally.get(c.name) ?? 0) + 1);
        }
      }
      const topNames = Array.from(totalTally.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, input.topConditions)
        .map(([name]) => name);

      // Build month buckets
      const months: string[] = [];
      for (let i = 0; i < input.months; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }

      // For each top condition, compute monthly counts
      const series = topNames.map((name) => {
        const counts = new Array(months.length).fill(0);
        for (const r of rows) {
          const arr = safeParseArray(r.conditions) as Array<{ name?: string }>;
          if (!arr.some((c) => c?.name === name)) continue;
          const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
          const idx = months.indexOf(key);
          if (idx >= 0) counts[idx] += 1;
        }
        const peak = Math.max(...counts);
        const peakMonth = peak > 0 ? months[counts.indexOf(peak)] : null;
        return { condition: name, values: counts, peak, peakMonth };
      });

      return { months, series };
    }),

  /**
   * Returns ALL the dashboard data in one CSV-friendly snapshot for export.
   * Used by the "Export CSV" button. Includes overview KPIs + every distribution
   * + top conditions + top products + catalog gaps. Intentionally returns plain
   * arrays so the UI can serialize to CSV without further transformation.
   */
  exportSnapshot: tenantProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const tenantId = ctx.tenantId;

    const [
      analysesStarted,
      analysesCompleted,
      conversions,
      analysesForGeo,
      products,
    ] = await Promise.all([
      ctx.db.analysis.count({ where: { tenantId, createdAt: { gte: since } } }),
      ctx.db.analysis.count({
        where: { tenantId, status: "completed", createdAt: { gte: since } },
      }),
      ctx.db.conversion.findMany({
        where: {
          recommendation: { analysis: { tenantId } },
          type: "purchase",
          createdAt: { gte: since },
        },
        select: { saleValue: true },
      }),
      ctx.db.analysis.findMany({
        where: { tenantId, status: "completed", createdAt: { gte: since } },
        select: {
          skinType: true,
          clientAge: true,
          primaryObjective: true,
          clientRegion: true,
          clientCity: true,
          clientCountry: true,
          barrierStatus: true,
          conditions: true,
          createdAt: true,
        },
      }),
      ctx.db.product.findMany({
        where: { tenantId, isActive: true },
        select: { name: true, sku: true, type: true, stepRoutine: true, price: true },
      }),
    ]);

    const revenue = conversions.reduce((s, c) => s + (c.saleValue ?? 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      periodDays: input.days,
      summary: {
        analysesStarted,
        analysesCompleted,
        conversions: conversions.length,
        revenue,
        completionRate: analysesStarted > 0 ? analysesCompleted / analysesStarted : 0,
        conversionRate:
          analysesCompleted > 0 ? conversions.length / analysesCompleted : 0,
      },
      analyses: analysesForGeo.map((a) => ({
        date: a.createdAt.toISOString().slice(0, 10),
        skinType: a.skinType ?? "",
        ageRange: a.clientAge ?? "",
        primaryObjective: a.primaryObjective ?? "",
        country: a.clientCountry ?? "",
        region: a.clientRegion ?? "",
        city: a.clientCity ?? "",
        barrierStatus: a.barrierStatus ?? "",
        conditions: (safeParseArray(a.conditions) as Array<{ name?: string; severity?: number }>)
          .filter((c) => c?.name)
          .map((c) => `${c.name}(${c.severity ?? 0})`)
          .join("|"),
      })),
      catalog: products,
    };
  }),
});
