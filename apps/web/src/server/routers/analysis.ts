import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { mockAnalyze } from "@/lib/sae/mock-analyzer";
import { claudeAnalyze } from "@/lib/sae/claude-analyzer";
import { matchProducts } from "@/lib/sae/matcher";
import type { AnalysisInput, FullAnalysisResult } from "@/lib/sae/types";
import { analysisLimiter, getClientIp } from "@/lib/rate-limit";

export const analysisRouter = router({
  run: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        photoBase64: z.string(),
        questionnaire: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        clientEmail: z.string().optional(),
        clientName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<FullAnalysisResult> => {
      const startTime = Date.now();

      // 0. Rate limit by client IP (prevents scripts from burning credits)
      if (ctx.headers) {
        const ip = getClientIp(ctx.headers);
        const rl = await analysisLimiter.limit(`${input.tenantSlug}:${ip}`);
        if (!rl.success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Muitas solicitacoes. Aguarde alguns minutos antes de tentar novamente.",
          });
        }
      }

      // 1. Resolve tenant
      const tenant = await ctx.db.tenant.findUnique({
        where: { slug: input.tenantSlug },
        include: { tenantConfig: true },
      });
      if (!tenant || tenant.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado." });
      }

      // 2. Check credits
      if (tenant.analysisUsed >= tenant.analysisLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Limite de análises atingido para este período.",
        });
      }

      // 3. Run analysis (mock or Claude)
      const analysisInput: AnalysisInput = {
        tenantId: tenant.id,
        photoBase64: input.photoBase64,
        questionnaire: input.questionnaire,
      };

      // Use Claude API if key is available, otherwise fall back to mock
      let analysisOutput;
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          analysisOutput = await claudeAnalyze(analysisInput);
        } catch (error) {
          console.error("Claude API error, falling back to mock:", error);
          analysisOutput = await mockAnalyze(analysisInput);
        }
      } else {
        analysisOutput = await mockAnalyze(analysisInput);
      }

      // 4. Match products (pass pregnancy status for contraindication filtering)
      const pregnantOrNursing = typeof input.questionnaire.pregnant_or_nursing === "string"
        ? input.questionnaire.pregnant_or_nursing
        : "no";
      const recommendations = await matchProducts(tenant.id, analysisOutput, {
        pregnantOrNursing,
      });

      const latencyMs = Date.now() - startTime;

      // 5. Save to database
      const analysis = await ctx.db.analysis.create({
        data: {
          tenantId: tenant.id,
          clientEmail: input.clientEmail,
          clientName: input.clientName,
          clientAge: (input.questionnaire.age_range as string) ?? null,
          questionnaireData: JSON.stringify(input.questionnaire),
          status: "completed",
          skinType: analysisOutput.skin_type,
          conditions: JSON.stringify(analysisOutput.conditions),
          severityScores: JSON.stringify(
            Object.fromEntries(
              analysisOutput.conditions.map((c) => [c.name, c.severity])
            )
          ),
          barrierStatus: analysisOutput.barrier_status,
          fitzpatrick: analysisOutput.fitzpatrick,
          primaryObjective: analysisOutput.primary_objective,
          rawResponse: JSON.stringify(analysisOutput),
          latencyMs,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          results: {
            create: {
              summary: analysisOutput.summary,
              actionPlan: JSON.stringify(analysisOutput.action_plan),
              timelineExpected: JSON.stringify(analysisOutput.timeline),
              alertSigns: JSON.stringify(analysisOutput.alert_signs),
            },
          },
        },
      });

      // 6. Save recommendations
      for (let i = 0; i < recommendations.length; i++) {
        const rec = recommendations[i];
        await ctx.db.recommendation.create({
          data: {
            analysisId: analysis.id,
            productId: rec.productId,
            rank: i + 1,
            matchScore: rec.matchScore,
            reason: rec.reason,
            howToUse: rec.howToUse,
          },
        });
      }

      // 7. Generate kit link and persist
      const kitLink = analysis.id.slice(0, 12);
      await ctx.db.analysis.update({
        where: { id: analysis.id },
        data: { kitLink },
      });

      // 8. Increment usage
      await ctx.db.tenant.update({
        where: { id: tenant.id },
        data: { analysisUsed: { increment: 1 } },
      });

      // 9. Log usage event
      await ctx.db.usageEvent.create({
        data: {
          tenantId: tenant.id,
          type: "analysis",
        },
      });

      return {
        analysisId: analysis.id,
        kitLink,
        analysis: analysisOutput,
        recommendations,
        latencyMs,
      };
    }),
});
