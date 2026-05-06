import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";
import { getPlan, getAllPlans, invalidatePlanCache } from "@/lib/billing/plans";
import { calculateMonthlyBill } from "@/lib/billing/stripe-mock";
import { getStripe } from "@/lib/billing/stripe";
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
          // Custom-plan price override. Tenants who came in via
          // /admin/tenants/novo-custom carry the negotiated monthly here;
          // without including it the MRR sum used the generic plan tier
          // price (e.g. R$ 3.299 for "enterprise") instead of the actual
          // R$ 445 the customer pays at Stripe — overstating MRR.
          customMonthlyPriceBRL: true,
        },
      }),
    ]);

    const allPlans = await getAllPlans({ visibleOnly: false, includeDeprecated: true });
    const planMap = new Map(allPlans.map((p) => [p.id, p]));
    const totalMRR = allActiveTenants.reduce((sum, t) => {
      const plan = planMap.get(t.plan);
      // Mirror the override pattern from billing.ts and tenantDetail above.
      return sum + (t.customMonthlyPriceBRL ?? plan?.monthlyPriceBRL ?? 0);
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

  // ─── Critical configs monitoring ──────────────────────────────────────────

  criticalConfigs: adminProcedure.query(async ({ ctx }) => {
    const configs = await ctx.db.tenantConfig.findMany({
      where: {
        OR: [
          { questionPregnantEnabled: false },
          { resultsShowAlertSigns: false },
          { photoOnlyMode: true },
        ],
      },
      select: {
        tenantId: true,
        questionPregnantEnabled: true,
        resultsShowAlertSigns: true,
        photoOnlyMode: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    return configs.map((c) => {
      const issues: string[] = [];
      if (!c.questionPregnantEnabled) issues.push("Pergunta de gravidez desativada");
      if (!c.resultsShowAlertSigns) issues.push("Sinais de alerta ocultos");
      if (c.photoOnlyMode) issues.push("Modo somente foto ativo");
      return {
        tenantId: c.tenantId,
        tenantName: c.tenant.name,
        tenantSlug: c.tenant.slug,
        tenantPlan: c.tenant.plan,
        issues,
      };
    });
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
      const planForBill = await getPlan(tenant.plan);
      // Custom-plan override: same posture as billing.ts (B2B side). When the
      // tenant signed up via /admin/tenants/novo-custom the webhook persisted
      // Tenant.customMonthlyPriceBRL — without this override admin would show
      // the generic enterprise tier price (R$ 3.299) instead of the negotiated
      // price the customer is actually paying at Stripe (e.g. R$ 445).
      const effectivePlanForBill = planForBill
        ? {
            ...planForBill,
            monthlyPriceBRL:
              tenant.customMonthlyPriceBRL ?? planForBill.monthlyPriceBRL,
          }
        : null;
      const bill = calculateMonthlyBill(
        effectivePlanForBill,
        tenant.analysisUsed,
        salesTotal
      );

      return {
        tenant,
        users,
        recentAnalyses,
        currentBill: bill,
        salesTotal,
      };
    }),

  // ─── Admin analysis config management ─────────────────────────────────────

  // Get the full analysis config for a specific tenant
  getAnalysisConfig: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.db.tenantConfig.findUnique({
        where: { tenantId: input.tenantId },
      });
      return config;
    }),

  // Admin can update any field plus adminLockedFields and adminNotes
  updateAnalysisConfig: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        // Questionnaire toggles
        questionAllergiesEnabled: z.boolean().optional(),
        questionSunscreenEnabled: z.boolean().optional(),
        questionPregnantEnabled: z.boolean().optional(),
        photoOnlyMode: z.boolean().optional(),
        // Results toggles
        resultsShowBarrier: z.boolean().optional(),
        resultsShowConditions: z.boolean().optional(),
        resultsShowConditionsDesc: z.boolean().optional(),
        resultsShowSeverityBars: z.boolean().optional(),
        resultsShowActionPlan: z.boolean().optional(),
        resultsShowTimeline: z.boolean().optional(),
        resultsShowAlertSigns: z.boolean().optional(),
        resultsShowProducts: z.boolean().optional(),
        resultsShowServices: z.boolean().optional(),
        resultsShowMatchScore: z.boolean().optional(),
        resultsShowPdfButton: z.boolean().optional(),
        resultsShowPrices: z.boolean().optional(),
        // Admin control
        adminLockedFields: z.string().nullable().optional(),
        adminNotes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, ...data } = input;
      return ctx.db.tenantConfig.update({
        where: { tenantId },
        data,
      });
    }),

  // Lock a specific field so the tenant cannot change it
  lockField: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        field: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = await ctx.db.tenantConfig.findUnique({
        where: { tenantId: input.tenantId },
        select: { adminLockedFields: true },
      });

      let locked: string[] = [];
      try {
        locked = config?.adminLockedFields ? JSON.parse(config.adminLockedFields) : [];
      } catch {
        locked = [];
      }

      if (!locked.includes(input.field)) {
        locked.push(input.field);
      }

      return ctx.db.tenantConfig.update({
        where: { tenantId: input.tenantId },
        data: { adminLockedFields: JSON.stringify(locked) },
      });
    }),

  // Unlock a specific field so the tenant can change it again
  unlockField: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        field: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = await ctx.db.tenantConfig.findUnique({
        where: { tenantId: input.tenantId },
        select: { adminLockedFields: true },
      });

      let locked: string[] = [];
      try {
        locked = config?.adminLockedFields ? JSON.parse(config.adminLockedFields) : [];
      } catch {
        locked = [];
      }

      locked = locked.filter((f) => f !== input.field);

      return ctx.db.tenantConfig.update({
        where: { tenantId: input.tenantId },
        data: { adminLockedFields: locked.length > 0 ? JSON.stringify(locked) : null },
      });
    }),

  // Admin: change plan for any tenant. Plan id is now a free string (admin
  // can create custom plans via /admin/planos), validated via getPlan.
  changeTenantPlan: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        plan: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const planConfig = await getPlan(input.plan);
      if (!planConfig) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plano nao encontrado." });
      }
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

  // ─── Questionnaire configuration ───────────────────────────────────────────

  getQuestionnaireConfig: adminProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.platformConfig.findUnique({
      where: { id: "default" },
    });
    if (config?.questionnaireConfig) {
      try {
        return JSON.parse(config.questionnaireConfig);
      } catch {
        return null;
      }
    }
    return null;
  }),

  updateQuestionnaireConfig: adminProcedure
    .input(
      z.object({
        questions: z.array(
          z.object({
            id: z.string().min(1),
            text: z.string().min(1),
            type: z.enum(["single", "multi", "text"]),
            required: z.boolean(),
            enabled: z.boolean(),
            maxSelect: z.number().int().min(1).optional(),
            options: z.array(
              z.object({
                value: z.string().min(1),
                label: z.string().min(1),
              })
            ).optional(),
            order: z.number().int(),
            showCondition: z.object({
              questionId: z.string(),
              value: z.string(),
            }).optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate core questions are present
      const coreIds = ["sex", "skin_type", "concerns", "primary_objective"];
      const inputIds = input.questions.map((q) => q.id);
      for (const coreId of coreIds) {
        if (!inputIds.includes(coreId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `A pergunta "${coreId}" e obrigatoria e nao pode ser removida.`,
          });
        }
      }

      // Validate unique IDs
      const uniqueIds = new Set(inputIds);
      if (uniqueIds.size !== inputIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IDs de perguntas devem ser unicos.",
        });
      }

      return ctx.db.platformConfig.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          questionnaireConfig: JSON.stringify(input.questions),
        },
        update: {
          questionnaireConfig: JSON.stringify(input.questions),
        },
      });
    }),

  // ─── Prompt configuration ──────────────────────────────────────────────────

  getPromptConfig: adminProcedure.query(async ({ ctx }) => {
    // Upsert singleton — create if it doesn't exist
    const config = await ctx.db.platformConfig.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    });
    return config;
  }),

  updatePromptConfig: adminProcedure
    .input(
      z.object({
        analysisGlobalRules: z.string().nullable().optional(),
        analysisRestrictedConditions: z.string().nullable().optional(),
        projectionPromptTemplate: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.platformConfig.upsert({
        where: { id: "default" },
        create: { id: "default", ...input },
        update: input,
      });
    }),

  // Returns the full system prompt preview as it would be sent to Claude
  getPromptPreview: adminProcedure.query(async ({ ctx }) => {
    const conditions = await ctx.db.skinCondition.findMany();
    const ingredients = await ctx.db.ingredient.findMany();
    const platformConfig = await ctx.db.platformConfig.findUnique({
      where: { id: "default" },
    });

    const conditionsKB = conditions
      .map(
        (c) =>
          `- ${c.name} (${c.displayName}): ${c.description}. Severidade 1: ${c.severity1Desc ?? "leve"}. Severidade 2: ${c.severity2Desc ?? "moderada"}. Severidade 3: ${c.severity3Desc ?? "severa"}.`
      )
      .join("\n");

    const ingredientsKB = ingredients
      .map((i) => `- ${i.name} (${i.displayName}): ${i.description ?? ""}`)
      .join("\n");

    const basePrompt = `Voce e um dermatologista especialista em analise facial e dermocosmeticos. Voce trabalha para a plataforma Skinner, que fornece analise de pele baseada em IA para clinicas, laboratorios e farmacias no Brasil.

Sua tarefa e analisar a foto facial do paciente junto com as respostas do questionario para fornecer um diagnostico dermatologico preciso e um plano de tratamento personalizado.`;

    const rules = `REGRAS:
1. Analise a foto com atencao: textura, poros, manchas, vermelhidao, oleosidade, linhas, firmeza, tom de pele
2. Cruze o que voce ve na foto com as respostas do questionario
3. Identifique TODAS as condicoes visiveis, nao apenas as que o paciente reportou
4. Atribua severidade (1-3) baseada no que voce observa na foto
5. Avalie o estado da barreira cutanea
6. Estime o fototipo Fitzpatrick pela foto
7. Crie um plano de acao em 3 fases progressivas
8. Seja honesto mas acolhedor - nao alarme, mas nao minimize
9. Se detectar algo que requer atencao medica, indique claramente
10. Todas as respostas devem ser em portugues brasileiro
11. Para zone_annotations: analise CADA zona facial individualmente. Inclua pelo menos 5 zonas.
12. DISCREPANCIA DE TIPO DE PELE: Compare o tipo auto-relatado com o observado na foto. Se diferentes, preencha skin_type_discrepancy.`;

    const globalRules = platformConfig?.analysisGlobalRules || null;
    const restrictedConditions = platformConfig?.analysisRestrictedConditions || null;

    return {
      basePrompt,
      conditionsKB,
      ingredientsKB,
      rules,
      globalRules,
      restrictedConditions,
      conditionsCount: conditions.length,
      ingredientsCount: ingredients.length,
    };
  }),

  // Recent analyses with full raw response for debugging
  recentAnalysesDetailed: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.analysis.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          createdAt: true,
          skinType: true,
          conditions: true,
          barrierStatus: true,
          fitzpatrick: true,
          primaryObjective: true,
          questionnaireData: true,
          rawResponse: true,
          latencyMs: true,
          clientName: true,
          clientEmail: true,
          tenant: { select: { name: true, slug: true } },
        },
      });
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
