import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure } from "../trpc";
import { getPlan } from "@/lib/billing/plans";

/**
 * Tenant-scoped channel manager. Each channel is a slug + label that routes
 * to the same analysis flow (welcome → result) but lets the tenant segment
 * stats by campanha, unidade, embed, QR. Plan-gated via Plan.maxChannels.
 *
 * Slug uniqueness is GLOBAL — never per-tenant. The UI auto-suggests
 * "{tenantSlug}-{label-slug}" to keep the namespace clean.
 *
 * Lifecycle invariants:
 *   - Every tenant has exactly ONE isDefault=true channel (slug = tenant.slug).
 *     It cannot be deleted — protects the legacy /analise/{tenantSlug} URL.
 *   - status: "active" → analysis.run accepts. "paused" → 403. "expired" is
 *     computed at read time when expiresAt < now (no cron needed).
 *   - maxAnalyses caps cumulative analyses on this channel; hitting the cap
 *     blocks new runs at /api/.../analysis.run with a friendly error.
 */
const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const analysisChannelRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    const channels = await ctx.db.analysisChannel.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    const counts = await Promise.all(
      channels.map((c) =>
        ctx.db.analysis.count({ where: { channelId: c.id } })
      )
    );
    const tenant = await ctx.db.tenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
      select: { plan: true },
    });
    const plan = await getPlan(tenant.plan);
    return {
      channels: channels.map((c, i) => ({
        ...c,
        analysisCount: counts[i],
        // Compute live expired status without hitting a cron — read-time only.
        isExpired:
          c.expiresAt != null && c.expiresAt.getTime() < Date.now(),
      })),
      maxChannels: plan?.maxChannels ?? 1,
      planId: tenant.plan,
      planName: plan?.name ?? tenant.plan,
    };
  }),

  create: tenantProcedure
    .input(
      z.object({
        label: z.string().min(2).max(60),
        slug: z
          .string()
          .min(3)
          .max(60)
          .regex(slugRegex, "Use letras minusculas, numeros e hifens"),
        expiresAt: z.iso.datetime().optional().nullable(),
        maxAnalyses: z.number().int().positive().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUniqueOrThrow({
        where: { id: ctx.tenantId },
        select: { plan: true },
      });
      const plan = await getPlan(tenant.plan);
      const cap = plan?.maxChannels ?? 1;
      const current = await ctx.db.analysisChannel.count({
        where: { tenantId: ctx.tenantId },
      });
      if (current >= cap) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Limite de ${cap} canal(is) atingido para o plano ${plan?.name ?? tenant.plan}. Faca upgrade para criar mais.`,
        });
      }
      const slug = slugify(input.slug);
      if (!slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slug invalido apos normalizacao.",
        });
      }
      const taken = await ctx.db.analysisChannel.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este slug ja esta em uso. Escolha outro.",
        });
      }
      return ctx.db.analysisChannel.create({
        data: {
          tenantId: ctx.tenantId,
          slug,
          label: input.label,
          isDefault: false,
          status: "active",
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          maxAnalyses: input.maxAnalyses ?? null,
        },
      });
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(2).max(60).optional(),
        expiresAt: z.iso.datetime().optional().nullable(),
        maxAnalyses: z.number().int().positive().optional().nullable(),
        status: z.enum(["active", "paused"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.analysisChannel.findUnique({
        where: { id: input.id },
        select: { id: true, tenantId: true, isDefault: true },
      });
      if (!channel || channel.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const data: {
        label?: string;
        expiresAt?: Date | null;
        maxAnalyses?: number | null;
        status?: "active" | "paused";
      } = {};
      if (input.label !== undefined) data.label = input.label;
      if (input.expiresAt !== undefined) {
        data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      }
      if (input.maxAnalyses !== undefined) {
        data.maxAnalyses = input.maxAnalyses ?? null;
      }
      if (input.status !== undefined) {
        // Default channel cannot be paused — would break /analise/{tenantSlug}.
        if (channel.isDefault && input.status === "paused") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "O canal padrao nao pode ser pausado.",
          });
        }
        data.status = input.status;
      }
      return ctx.db.analysisChannel.update({
        where: { id: input.id },
        data,
      });
    }),

  archive: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.analysisChannel.findUnique({
        where: { id: input.id },
        select: { id: true, tenantId: true, isDefault: true },
      });
      if (!channel || channel.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (channel.isDefault) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O canal padrao nao pode ser excluido.",
        });
      }
      return ctx.db.analysisChannel.delete({ where: { id: input.id } });
    }),
});
