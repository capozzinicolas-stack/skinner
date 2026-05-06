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

// Whitelist of TenantConfig fields a channel override may shadow. Anything
// outside this list is silently dropped at update time so the override slot
// can never be used to bypass tenant-wide limits (analysisLimit,
// commissionRate, etc.) — those are operational fields, not UI copy.
const CHANNEL_OVERRIDE_FIELDS = [
  "welcomeTitle",
  "welcomeDescription",
  "welcomeCtaText",
  "welcomeSubtext",
  "welcomeSubtextVisible",
  "consentExtraText",
  "consentButtonText",
  "photoTitle",
  "photoInstruction",
  "photoExtraText",
  "contactCaptureEnabled",
  "contactCaptureRequired",
  "contactCustomMessage",
  "productCtaText",
  "serviceCtaText",
  "resultsTopMessage",
  "resultsFooterText",
  // Per-channel locale override. When present, supersedes Tenant.defaultLocale
  // for patient-facing copy + AI analysis output. Validated as a Locale value
  // at update time below so we don't persist garbage.
  "locale",
] as const;

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
      select: { plan: true, customAllowIdentityLimit: true },
    });
    const plan = await getPlan(tenant.plan);
    // Effective capability: tenant override wins (NULL = inherit from plan).
    const allowIdentityLimit =
      tenant.customAllowIdentityLimit !== null
        ? tenant.customAllowIdentityLimit
        : plan?.allowIdentityLimit ?? false;
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
      allowIdentityLimit,
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
        // Identity-based abuse limit (Nivel 1). identityLimit > 0 enables it;
        // identityLimit null/0 disables it. identityWindowDays null = forever.
        identityLimit: z.number().int().min(0).max(99).optional().nullable(),
        identityWindowDays: z.number().int().min(0).max(365).optional().nullable(),
        // Per-channel UI overrides — only fields in CHANNEL_OVERRIDE_FIELDS
        // are accepted; others are silently dropped before persistence so
        // we never accidentally let a tenant override sensitive limits like
        // analysisLimit or commissionRate via the channel overrides slot.
        overrides: z.record(z.string(), z.unknown()).optional().nullable(),
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
        identityLimit?: number | null;
        identityWindowDays?: number | null;
        overrides?: string | null;
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
      if (input.overrides !== undefined) {
        if (input.overrides === null) {
          data.overrides = null;
        } else {
          // Whitelist only — never let arbitrary tenantConfig fields slip in.
          const filtered: Record<string, unknown> = {};
          for (const key of CHANNEL_OVERRIDE_FIELDS) {
            if (key in input.overrides && input.overrides[key] !== undefined) {
              // Special validation for `locale`: must be one of our supported
              // codes, otherwise drop silently. Prevents persisting "fr" or
              // "xx" via the overrides slot.
              if (key === "locale") {
                const v = input.overrides[key];
                if (v === "pt-BR" || v === "es" || v === "en") {
                  filtered[key] = v;
                }
                continue;
              }
              filtered[key] = input.overrides[key];
            }
          }
          data.overrides =
            Object.keys(filtered).length > 0 ? JSON.stringify(filtered) : null;
        }
      }
      // Identity limits are plan-gated. We re-check the effective capability
      // here so a tenant can't bypass via direct API call.
      if (input.identityLimit !== undefined || input.identityWindowDays !== undefined) {
        const tenantInfo = await ctx.db.tenant.findUniqueOrThrow({
          where: { id: ctx.tenantId },
          select: { plan: true, customAllowIdentityLimit: true },
        });
        const plan = await getPlan(tenantInfo.plan);
        const effective =
          tenantInfo.customAllowIdentityLimit !== null
            ? tenantInfo.customAllowIdentityLimit
            : plan?.allowIdentityLimit ?? false;
        const enabling =
          (input.identityLimit ?? 0) > 0 || (input.identityWindowDays ?? 0) > 0;
        if (enabling && !effective) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Limite por identidade nao esta disponivel no seu plano. Faca upgrade para Pro ou superior.",
          });
        }
        if (input.identityLimit !== undefined) {
          data.identityLimit =
            input.identityLimit && input.identityLimit > 0 ? input.identityLimit : null;
        }
        if (input.identityWindowDays !== undefined) {
          data.identityWindowDays =
            input.identityWindowDays && input.identityWindowDays > 0
              ? input.identityWindowDays
              : null;
        }
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
