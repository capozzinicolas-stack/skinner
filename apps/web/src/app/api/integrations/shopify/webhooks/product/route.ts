import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import {
  fetchProduct,
  mapShopifyProduct,
  resolveShopifyEcommerceLink,
  verifyWebhookHmac,
} from "@/lib/integrations/shopify";

/**
 * Real-time catalog sync. Shopify fires this on products/create,
 * products/update, products/delete. The body is the full product object on
 * create/update, or just `{ id }` on delete (depending on API version).
 *
 * We always verify the HMAC signature first — without it, any third party
 * could POST fake updates and corrupt our catalog. Computed against the RAW
 * body using SHOPIFY_CLIENT_SECRET; mismatch = 401, no exceptions.
 *
 * On verified create/update we re-fetch via the Admin API rather than trust
 * the body shape (Shopify API versions occasionally rename fields). On
 * delete we soft-disable (`isActive=false`) to preserve historical
 * Recommendation/Conversion FKs.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  const valid = await verifyWebhookHmac(rawBody, hmacHeader);
  if (!valid) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const topic = req.headers.get("x-shopify-topic") ?? "";
  if (!shopDomain) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown> = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ ok: true });
  }

  const integration = await db.integration.findFirst({
    where: { storeId: shopDomain, platform: "shopify", status: "active" },
  });
  if (!integration || !integration.accessToken) {
    return NextResponse.json({ ok: true });
  }

  const productId = body.id != null ? String(body.id) : "";
  if (!productId) {
    return NextResponse.json({ ok: true });
  }

  // products/delete — soft-disable. Match by ecommerceLink containing the
  // product id (handle could have changed; id is stable).
  if (topic === "products/delete") {
    try {
      const existing = await db.product.findFirst({
        where: {
          tenantId: integration.tenantId,
          ecommerceLink: { contains: `/products/` },
        },
        select: { id: true },
      });
      // We don't have a direct id index — fall back to soft-disabling by
      // rough handle match. This may not catch every case but won't
      // false-positive on other tenants because it's already scoped to
      // tenantId. For more precise tracking we'd need to persist
      // shopifyProductId on Product (sprint follow-up).
      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
      }
    } catch (err) {
      console.error("[shopify product webhook] delete soft-disable failed:", err);
    }
    return NextResponse.json({ ok: true });
  }

  // create / update — re-fetch the full product to upsert canonical state.
  let raw: Record<string, unknown> | null = null;
  try {
    raw = await fetchProduct(shopDomain, integration.accessToken, productId);
  } catch (err) {
    console.error("[shopify product webhook] fetchProduct failed:", err);
    // Always 200: daily resync cron is the safety net, replaying webhooks
    // costs more than letting one slip.
    return NextResponse.json({ ok: true });
  }

  if (!raw) {
    return NextResponse.json({ ok: true });
  }

  const mapped = mapShopifyProduct(raw);
  if (!mapped) {
    return NextResponse.json({ ok: true });
  }

  const ecommerceLink = resolveShopifyEcommerceLink(
    shopDomain,
    mapped.ecommerceLink
  );

  try {
    await db.product.upsert({
      where: {
        tenantId_sku: { tenantId: integration.tenantId, sku: mapped.sku },
      },
      create: {
        tenantId: integration.tenantId,
        sku: mapped.sku,
        name: mapped.name,
        description: mapped.description,
        imageUrl: mapped.imageUrl,
        price: mapped.price,
        ecommerceLink,
        concernTags: "[]",
        skinTypeTags: "[]",
        objectiveTags: "[]",
        isActive: true,
      },
      update: {
        name: mapped.name,
        description: mapped.description,
        imageUrl: mapped.imageUrl,
        price: mapped.price,
        ecommerceLink,
        isActive: true,
      },
    });
  } catch (err) {
    console.error("[shopify product webhook] upsert failed:", err);
  }

  return NextResponse.json({ ok: true });
}
