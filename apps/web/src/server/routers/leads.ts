import { z } from "zod/v4";
import { router, tenantProcedure } from "../trpc";

/**
 * Leads router — surfaces analyses where the patient supplied at least one
 * contact channel during the capture step. Tenant-scoped via tenantProcedure
 * so a tenant only ever sees its own leads.
 *
 * "Lead" definition: an Analysis with non-null contactCapturedAt AND consent
 * to contact (LGPD requirement). Analyses where the patient skipped capture
 * or did not opt in are NOT surfaced here, even if they happen to have a
 * client name attached from another flow.
 */
export const leadsRouter = router({
  list: tenantProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
        onlyConsented: z.boolean().default(true),
        channelId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 86_400_000);
      const leads = await ctx.db.analysis.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input.channelId ? { channelId: input.channelId } : {}),
          createdAt: { gte: since },
          contactCapturedAt: { not: null },
          ...(input.onlyConsented ? { consentToContact: true } : {}),
        },
        select: {
          id: true,
          createdAt: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          clientAge: true,
          skinType: true,
          primaryObjective: true,
          barrierStatus: true,
          consentToContact: true,
          contactCapturedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      return leads;
    }),

  // CSV export — returns a serializable list of rows; the client builds the
  // file with UTF-8 BOM so Excel reads accents correctly (same convention as
  // the dashboard exportSnapshot).
  exportCsv: tenantProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
        channelId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 86_400_000);
      const rows = await ctx.db.analysis.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input.channelId ? { channelId: input.channelId } : {}),
          createdAt: { gte: since },
          contactCapturedAt: { not: null },
          consentToContact: true,
        },
        select: {
          id: true,
          createdAt: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          clientAge: true,
          skinType: true,
          primaryObjective: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });
      return rows.map((r) => ({
        data: r.createdAt.toISOString(),
        nome: r.clientName ?? "",
        email: r.clientEmail ?? "",
        whatsapp: r.clientPhone ?? "",
        idade: r.clientAge ?? "",
        tipoPele: r.skinType ?? "",
        objetivoPrincipal: r.primaryObjective ?? "",
        analiseId: r.id,
      }));
    }),
});
