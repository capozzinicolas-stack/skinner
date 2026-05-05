import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { mockAnalyze } from "@/lib/sae/mock-analyzer";
import { claudeAnalyze } from "@/lib/sae/claude-analyzer";
import { matchProducts } from "@/lib/sae/matcher";
import type { AnalysisInput, FullAnalysisResult } from "@/lib/sae/types";
import { analysisLimiter, getClientIp, getClientGeo } from "@/lib/rate-limit";
import {
  sendEmail,
  buildAnalysisDeliveryEmail,
  buildNewLeadNotificationEmail,
} from "@/lib/email";

export const analysisRouter = router({
  run: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        photoBase64: z.string(),
        questionnaire: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        clientEmail: z.string().optional(),
        clientName: z.string().optional(),
        clientPhone: z.string().optional(),
        consentToContact: z.boolean().optional(),
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

      // 1. Resolve tenant via channel slug first (multi-channel) then by
      // tenant.slug as legacy fallback. Channel-specific guards (paused,
      // expired, maxAnalyses) run BEFORE the tenant-wide quota so the
      // patient sees the most specific error.
      const channel = await ctx.db.analysisChannel.findUnique({
        where: { slug: input.tenantSlug },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          maxAnalyses: true,
          tenantId: true,
        },
      });

      const tenant = await ctx.db.tenant.findUnique({
        where: channel ? { id: channel.tenantId } : { slug: input.tenantSlug },
        include: { tenantConfig: true },
      });
      if (!tenant || tenant.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado." });
      }

      if (channel) {
        if (channel.status === "paused") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Este canal esta pausado pela clinica.",
          });
        }
        if (channel.expiresAt && channel.expiresAt.getTime() < Date.now()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Este canal expirou. Entre em contato com a clinica para um novo link.",
          });
        }
        if (channel.maxAnalyses != null) {
          const used = await ctx.db.analysis.count({
            where: { channelId: channel.id },
          });
          if (used >= channel.maxAnalyses) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Este canal atingiu o limite de analises.",
            });
          }
        }
      }

      // 2. Check credits — block public analysis creation when the tenant has
      // exhausted its monthly quota. The B2B panel stays accessible (only the
      // public /analise/[slug] flow is blocked). Counter resets via Stripe
      // invoice.paid webhook on the next billing cycle (see webhook/route.ts).
      if (tenant.analysisUsed >= tenant.analysisLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Esta clinica atingiu o limite mensal de analises. Tente novamente apos a renovacao do periodo ou entre em contato diretamente com a clinica.",
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

      // Capture LGPD-friendly geo (city/region/country only, never raw IP) for B2B analytics.
      const geo = ctx.headers
        ? getClientGeo(ctx.headers)
        : { country: null, region: null, city: null };

      // 5. Save to database. Track lead capture: contactCapturedAt is set
      // whenever ANY contact field arrives (even just a name) so reports can
      // distinguish "patient skipped capture" from "tenant disabled capture".
      const anyContactField =
        !!input.clientEmail || !!input.clientName || !!input.clientPhone;
      const analysis = await ctx.db.analysis.create({
        data: {
          tenantId: tenant.id,
          channelId: channel?.id ?? null,
          clientEmail: input.clientEmail,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          consentToContact: input.consentToContact === true,
          contactCapturedAt: anyContactField ? new Date() : null,
          clientAge: (input.questionnaire.age_range as string) ?? null,
          clientCountry: geo.country,
          clientRegion: geo.region,
          clientCity: geo.city,
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

      // 10. Side-effect emails. Both are best-effort (try/catch + log) so a
      // Resend hiccup never blocks the analysis from returning to the patient.
      const tConfig = tenant.tenantConfig;
      try {
        if (
          tConfig?.autoSendPdfEmail &&
          input.clientEmail &&
          input.consentToContact === true
        ) {
          const reportUrl = `https://app.skinner.lat/api/report/${analysis.id}`;
          const { subject, html } = buildAnalysisDeliveryEmail({
            tenantName: tenant.name,
            patientName: input.clientName ?? null,
            reportUrl,
          });
          await sendEmail({ to: input.clientEmail, subject, html });
        }
      } catch (err) {
        console.error("[analysis] auto-send delivery email failed:", err);
      }

      try {
        if (tConfig?.notifyTenantNewLead && anyContactField) {
          const admins = await ctx.db.user.findMany({
            where: { tenantId: tenant.id, role: "b2b_admin" },
            select: { email: true },
          });
          if (admins.length > 0) {
            const { subject, html } = buildNewLeadNotificationEmail({
              tenantName: tenant.name,
              patientName: input.clientName ?? "Anonimo",
              patientEmail: input.clientEmail ?? null,
              patientPhone: input.clientPhone ?? null,
              skinType: analysisOutput.skin_type,
              primaryObjective: analysisOutput.primary_objective,
              dashboardUrl: "https://app.skinner.lat/dashboard/leads",
            });
            await Promise.all(
              admins.map((u) => sendEmail({ to: u.email, subject, html }))
            );
          }
        }
      } catch (err) {
        console.error("[analysis] notify-tenant new-lead failed:", err);
      }

      return {
        analysisId: analysis.id,
        kitLink,
        analysis: analysisOutput,
        recommendations,
        latencyMs,
      };
    }),
});
