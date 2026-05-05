import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure, publicProcedure } from "../trpc";
import { getAuthUrl } from "@/lib/integrations/nuvemshop";
import { getAuthUrl as getShopifyAuthUrl } from "@/lib/integrations/shopify";

// Normalize a shop domain input from the user. Accepts:
//   "my-store"                        -> "my-store.myshopify.com"
//   "my-store.myshopify.com"          -> "my-store.myshopify.com"
//   "https://my-store.myshopify.com"  -> "my-store.myshopify.com"
function normalizeShopDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(cleaned)) return cleaned;
  if (/^[a-z0-9][a-z0-9-]*$/.test(cleaned)) return `${cleaned}.myshopify.com`;
  return null;
}

export const integrationRouter = router({
  // Public list of active integrations for a tenant slug. Used by the patient
  // analise/kit pages to resolve which checkout channel each product card
  // should use. Only returns the platform/status/storeId — never tokens.
  publicByTenantSlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (!tenant) return [];
      return ctx.db.integration.findMany({
        where: { tenantId: tenant.id, status: "active" },
        select: { platform: true, status: true, storeId: true },
      });
    }),

  // Returns the current integration record for "nuvemshop" (or null if not connected).
  // Kept for backwards compatibility with the existing NuvemshopCard component.
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

  // Returns integration status for a specific platform
  getStatusByPlatform: tenantProcedure
    .input(z.object({ platform: z.enum(["nuvemshop", "shopify"]) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.integration.findUnique({
        where: {
          tenantId_platform: {
            tenantId: ctx.tenantId,
            platform: input.platform,
          },
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

  // Returns the OAuth URL for Shopify. Requires the merchant to provide their shop domain.
  connectShopify: tenantProcedure
    .input(z.object({ shop: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const normalized = normalizeShopDomain(input.shop);
      if (!normalized) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Dominio invalido. Use o formato 'minha-loja' ou 'minha-loja.myshopify.com'.",
        });
      }
      const url = getShopifyAuthUrl(ctx.tenantId, normalized);
      return { url };
    }),

  // Sets the Shopify integration status to "disconnected"
  disconnectShopify: tenantProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db.integration.findUnique({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "shopify" },
      },
    });
    if (!existing) return { ok: true };

    await ctx.db.integration.update({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "shopify" },
      },
      data: { status: "disconnected" },
    });
    return { ok: true };
  }),

  // Triggers a Shopify product sync
  syncShopifyProducts: tenantProcedure.mutation(async ({ ctx }) => {
    const integration = await ctx.db.integration.findUnique({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "shopify" },
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

    const { fetchProducts } = await import("@/lib/integrations/shopify");

    function stripHtml(html: string): string {
      return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
    }

    let rawProducts: Array<Record<string, unknown>>;
    try {
      rawProducts = await fetchProducts(
        integration.storeId,
        integration.accessToken
      );
    } catch (err) {
      console.error("Shopify sync fetch failed:", err);
      await ctx.db.integration.update({
        where: {
          tenantId_platform: {
            tenantId: ctx.tenantId,
            platform: "shopify",
          },
        },
        data: { status: "error" },
      });
      return { synced: 0, errors: ["Falha ao buscar produtos do Shopify"] };
    }

    let synced = 0;
    const errors: string[] = [];

    for (const p of rawProducts) {
      try {
        const title = typeof p.title === "string" ? p.title : "";
        if (!title) continue;

        const variants = Array.isArray(p.variants)
          ? (p.variants as Array<Record<string, unknown>>)
          : [];
        const variant = variants[0] ?? {};
        const sku =
          typeof variant.sku === "string" && variant.sku
            ? variant.sku
            : String(p.id);
        const price =
          typeof variant.price === "string"
            ? parseFloat(variant.price)
            : undefined;

        const images = Array.isArray(p.images)
          ? (p.images as Array<Record<string, unknown>>)
          : [];
        const imageUrl =
          images[0] && typeof images[0].src === "string"
            ? (images[0].src as string)
            : undefined;

        const handle = typeof p.handle === "string" ? p.handle : "";
        const ecommerceLink = handle
          ? `https://${integration.storeId}/products/${handle}`
          : undefined;

        const rawDesc =
          typeof p.body_html === "string" ? p.body_html : "";
        const description = rawDesc ? stripHtml(rawDesc) : undefined;

        await ctx.db.product.upsert({
          where: { tenantId_sku: { tenantId: ctx.tenantId, sku } },
          create: {
            tenantId: ctx.tenantId,
            sku,
            name: title,
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
            name: title,
            description,
            imageUrl,
            price,
            ecommerceLink,
            isActive: true,
          },
        });
        synced++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        errors.push(`Produto ${p.id}: ${msg}`);
      }
    }

    await ctx.db.integration.update({
      where: {
        tenantId_platform: { tenantId: ctx.tenantId, platform: "shopify" },
      },
      data: { lastSyncAt: new Date() },
    });

    return { synced, errors };
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
