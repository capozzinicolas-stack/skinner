import { router, tenantProcedure } from "../trpc";
import { getAuthUrl } from "@/lib/integrations/nuvemshop";

export const integrationRouter = router({
  // Returns the current integration record for "nuvemshop" (or null if not connected)
  getStatus: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.integration.findUnique({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "nuvemshop" },
      },
      select: {
        id: true,
        platform: true,
        status: true,
        lastSyncAt: true,
        storeId: true,
        createdAt: true,
      },
    });
  }),

  // Returns the OAuth URL to redirect the user to Nuvemshop authorization
  connectNuvemshop: tenantProcedure.mutation(async ({ ctx }) => {
    const url = getAuthUrl(ctx.tenantId);
    return { url };
  }),

  // Sets integration status to "disconnected"
  disconnect: tenantProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db.integration.findUnique({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "nuvemshop" },
      },
    });
    if (!existing) return { ok: true };

    await ctx.db.integration.update({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "nuvemshop" },
      },
      data: { status: "disconnected" },
    });
    return { ok: true };
  }),

  // Triggers a product sync by calling the sync API route internally
  syncProducts: tenantProcedure.mutation(async ({ ctx }) => {
    const integration = await ctx.db.integration.findUnique({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "nuvemshop" },
      },
    });

    if (
      !integration ||
      integration.status !== "active" ||
      !integration.storeId ||
      !integration.accessToken
    ) {
      return { synced: 0, errors: ["Integracao nao configurada ou inativa"] };
    }

    // Import the sync logic inline to avoid HTTP round-trips in tRPC context
    const { fetchProducts } = await import("@/lib/integrations/nuvemshop");

    function stripHtml(html: string): string {
      return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    }

    function ptBr(
      field: Record<string, string> | string | null | undefined
    ): string {
      if (!field) return "";
      if (typeof field === "string") return field;
      return field["pt"] ?? field["pt-BR"] ?? Object.values(field)[0] ?? "";
    }

    let rawProducts: any[];
    try {
      rawProducts = await fetchProducts(
        integration.storeId,
        integration.accessToken
      );
    } catch (err: any) {
      await ctx.db.integration.update({
        where: {
          tenantId_platform: {
            tenantId: ctx.tenantId,
            platform: "nuvemshop",
          },
        },
        data: { status: "error" },
      });
      return { synced: 0, errors: ["Falha ao buscar produtos da Nuvemshop"] };
    }

    let synced = 0;
    const errors: string[] = [];

    for (const p of rawProducts) {
      try {
        const name = ptBr(p.name);
        if (!name) continue;

        const variant = Array.isArray(p.variants) ? p.variants[0] : null;
        const sku: string = variant?.sku || String(p.id);
        const price: number | undefined =
          variant?.price != null ? parseFloat(variant.price) : undefined;
        const imageUrl: string | undefined =
          Array.isArray(p.images) && p.images[0]?.src
            ? p.images[0].src
            : undefined;
        const ecommerceLink: string | undefined = p.permalink ?? undefined;
        const rawDesc = ptBr(p.description);
        const description: string | undefined = rawDesc
          ? stripHtml(rawDesc)
          : undefined;

        await ctx.db.product.upsert({
          where: { tenantId_sku: { tenantId: ctx.tenantId, sku } },
          create: {
            tenantId: ctx.tenantId,
            sku,
            name,
            description,
            imageUrl,
            price,
            ecommerceLink,
            concernTags: "[]",
            skinTypeTags: "[]",
            objectiveTags: "[]",
            isActive: true,
          },
          update: {
            name,
            description,
            imageUrl,
            price,
            ecommerceLink,
            isActive: true,
          },
        });
        synced++;
      } catch (err: any) {
        errors.push(`Produto ${p.id}: ${err.message}`);
      }
    }

    await ctx.db.integration.update({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "nuvemshop" },
      },
      data: { lastSyncAt: new Date() },
    });

    return { synced, errors };
  }),

  // Returns the lastSyncAt timestamp for the Nuvemshop integration
  getLastSync: tenantProcedure.query(async ({ ctx }) => {
    const integration = await ctx.db.integration.findUnique({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "nuvemshop" },
      },
      select: { lastSyncAt: true },
    });
    return { lastSyncAt: integration?.lastSyncAt ?? null };
  }),
});
