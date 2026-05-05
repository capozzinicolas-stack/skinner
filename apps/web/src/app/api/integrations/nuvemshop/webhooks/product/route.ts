import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import { fetchProduct, mapNuvemshopProduct } from "@/lib/integrations/nuvemshop";

/**
 * Real-time catalog sync. Nuvemshop fires this webhook on product/created and
 * product/updated. The body shape is:
 *
 *   { store_id: number, event: "product/updated", id: number }
 *
 * We always re-fetch the product via the API rather than trusting the body to
 * carry the full record (Nuvemshop only sends the id by spec — the full
 * payload is "available but not guaranteed" in their docs).
 *
 * Failures here are NEVER raised back to Nuvemshop with 5xx — the daily
 * resync cron is the safety net, and replaying webhooks on retry is more
 * costly than letting one slip through. We log + return 200.
 */
export async function POST(req: NextRequest) {
  let body: { store_id?: number | string; event?: string; id?: number | string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const storeId =
    req.headers.get("x-store-id") ??
    req.headers.get("x-tiendanube-store-id") ??
    (body.store_id != null ? String(body.store_id) : "");
  const productId = body.id != null ? String(body.id) : "";
  const event = body.event ?? "";

  if (!storeId || !productId) {
    return NextResponse.json({ ok: true });
  }

  const integration = await db.integration.findFirst({
    where: { storeId, platform: "nuvemshop", status: "active" },
  });
  if (!integration || !integration.accessToken) {
    return NextResponse.json({ ok: true });
  }

  // product/deleted: soft-disable. We do NOT delete the Skinner Product row
  // because past Recommendations / Conversions reference it. Setting
  // isActive=false keeps history intact and removes it from new analyses.
  if (event === "product/deleted") {
    try {
      const existing = await db.product.findFirst({
        where: { tenantId: integration.tenantId, ecommerceLink: { contains: `/${productId}` } },
        select: { id: true },
      });
      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
      }
    } catch (err) {
      console.error("[nuvemshop product webhook] delete soft-disable failed:", err);
    }
    return NextResponse.json({ ok: true });
  }

  let raw: Record<string, unknown> | null = null;
  try {
    raw = await fetchProduct(storeId, integration.accessToken, productId);
  } catch (err) {
    console.error("[nuvemshop product webhook] fetchProduct failed:", err);
    return NextResponse.json({ ok: true });
  }

  // Product disappeared between fire and fetch — treat as deleted.
  if (!raw) {
    return NextResponse.json({ ok: true });
  }

  const mapped = mapNuvemshopProduct(raw);
  if (!mapped) {
    return NextResponse.json({ ok: true });
  }

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
        ecommerceLink: mapped.ecommerceLink,
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
        ecommerceLink: mapped.ecommerceLink,
        isActive: true,
      },
    });
  } catch (err) {
    console.error("[nuvemshop product webhook] upsert failed:", err);
  }

  return NextResponse.json({ ok: true });
}
