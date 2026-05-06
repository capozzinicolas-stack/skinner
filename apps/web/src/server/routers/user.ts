import { z } from "zod/v4";
import { hashSync, compareSync } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure, adminProcedure, protectedProcedure } from "../trpc";
import { getPlan } from "@/lib/billing/plans";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        passwordChangedAt: true,
        locale: true,
        tenant: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            defaultLocale: true,
          },
        },
      },
    });
  }),

  // Self-service: update own dashboard language preference. Null = inherit
  // from Tenant.defaultLocale. Persists immediately; the i18n provider re-reads
  // on next page load (we don't push it through React context to keep MVP
  // simple — a hard reload after save is acceptable UX for a settings page).
  updateLocale: protectedProcedure
    .input(
      z.object({
        locale: z.enum(["pt-BR", "es", "en"]).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: { locale: input.locale },
      });
      return { success: true };
    }),

  // Self-service: update own profile (name + email).
  // Email change does NOT trigger a confirmation flow yet (sprint-2 hardening).
  // Email uniqueness is enforced at DB level via @unique.
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const me = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
      });

      if (input.email !== me.email) {
        const taken = await ctx.db.user.findUnique({
          where: { email: input.email },
          select: { id: true },
        });
        if (taken && taken.id !== ctx.userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este e-mail ja esta em uso por outra conta.",
          });
        }
      }

      return ctx.db.user.update({
        where: { id: ctx.userId },
        data: { name: input.name, email: input.email },
        select: { id: true, name: true, email: true },
      });
    }),

  // LGPD: tenant-wide data deletion request. Soft-deletes the tenant and
  // anonymizes PII on its analyses + users. Aggregates (skin type counts,
  // conversion stats) are preserved so cross-tenant benchmarks don't break,
  // but no PII remains. Hard delete is admin-only via /admin/tenants/[id].
  // Only b2b_admin can request this — analysts and viewers cannot.
  requestDataDeletion: protectedProcedure
    .input(z.object({ confirm: z.literal("DELETAR") }))
    .mutation(async ({ ctx }) => {
      const me = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
        select: { id: true, role: true, tenantId: true },
      });
      if (me.role !== "b2b_admin" || !me.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores da conta podem solicitar a exclusao.",
        });
      }
      const tenantId = me.tenantId;

      await ctx.db.$transaction([
        // 1. Anonymize analyses — drop everything that could identify a patient
        //    but keep aggregates (skinType, primaryObjective, conversion data).
        //    questionnaireData is non-null in schema, so we replace it with an
        //    empty JSON object instead of nulling the column.
        ctx.db.analysis.updateMany({
          where: { tenantId },
          data: {
            clientEmail: null,
            clientName: null,
            clientAge: null,
            clientCity: null,
            clientRegion: null,
            clientCountry: null,
            questionnaireData: "{}",
            rawResponse: null,
          },
        }),
        // 2. Anonymize users of this tenant.
        ctx.db.user.updateMany({
          where: { tenantId },
          data: {
            email: `deleted-${tenantId}-${Date.now()}@deleted.local`,
            name: "Removido",
            password: "deleted",
          },
        }),
        // 3. Soft-delete the tenant. tenantProcedure will treat this as
        //    UNAUTHORIZED on the next request and force a logout.
        ctx.db.tenant.update({
          where: { id: tenantId },
          data: { status: "deleted" },
        }),
        // 4. Audit log.
        ctx.db.usageEvent.create({
          data: {
            tenantId,
            type: "data_deletion",
            quantity: 1,
            metadata: JSON.stringify({
              requestedBy: me.id,
              requestedAt: new Date().toISOString(),
            }),
          },
        }),
      ]);
      return { success: true };
    }),

  // Self-service: rotate own password. The current password must be supplied
  // (no "magic link" path here — that lives in /api/auth/forgot, sprint 2).
  // On success we also stamp passwordChangedAt = now so the temp-password
  // banner disappears.
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const me = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
        select: { id: true, password: true },
      });
      const ok = compareSync(input.currentPassword, me.password);
      if (!ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Senha atual incorreta.",
        });
      }
      if (input.currentPassword === input.newPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A nova senha deve ser diferente da atual.",
        });
      }
      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: {
          password: hashSync(input.newPassword, 10),
          passwordChangedAt: new Date(),
        },
      });
      return { success: true };
    }),

  listByTenant: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
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

  create: tenantProcedure
    .input(
      z.object({
        email: z.email(),
        name: z.string().min(2),
        password: z.string().min(6),
        role: z.enum(["b2b_admin", "b2b_analyst", "b2b_viewer"]).default("b2b_viewer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check role permission: only b2b_admin can create users
      const currentUser = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
      });
      if (currentUser.role !== "b2b_admin" && currentUser.role !== "skinner_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar usuários." });
      }

      // Check tenant user limits — sourced from the Plan row managed via
      // /admin/planos. Falls back to 2 if the plan row was deleted.
      const tenant = await ctx.db.tenant.findUniqueOrThrow({
        where: { id: ctx.tenantId },
      });
      const userCount = await ctx.db.user.count({
        where: { tenantId: ctx.tenantId },
      });
      const planConfig = await getPlan(tenant.plan);
      const limit = planConfig?.maxUsers ?? 2;
      if (userCount >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Limite de ${limit} usuários atingido para o plano ${tenant.plan}.`,
        });
      }

      return ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashSync(input.password, 10),
          role: input.role,
          tenantId: ctx.tenantId,
        },
        select: { id: true, email: true, name: true, role: true },
      });
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        role: z.enum(["b2b_admin", "b2b_analyst", "b2b_viewer"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user belongs to same tenant
      const target = await ctx.db.user.findUniqueOrThrow({ where: { id: input.id } });
      if (target.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, ...data } = input;
      return ctx.db.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true },
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.user.findUniqueOrThrow({ where: { id: input.id } });
      if (target.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (target.id === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode remover a si mesmo." });
      }

      return ctx.db.user.delete({ where: { id: input.id } });
    }),

  // Admin: create user for any tenant
  adminCreate: adminProcedure
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
          tenantId: input.tenantId,
        },
      });
    }),
});
