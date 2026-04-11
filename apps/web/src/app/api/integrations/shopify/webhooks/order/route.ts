import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";

/**
 * Webhook handler for Shopify orders/create events.
 * Matches skr_ref parameters from product URLs to existing Skinner
 * recommendations and records a purchase Conversion + commission UsageEvent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const shopDomain = req.headers.get("x-shopify-shop-domain");

    if (!shopDomain) {
      return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
    }

    const integration = await db.integration.findFirst({
      where: { platform: "shopify", storeId: shopDomain, status: "active" },
    });

    if (!integration) {
      // Unknown shop or disconnected — accept but ignore
      return NextResponse.json({ ok: true });
    }

    // Scan line items for skr_ref query param in the product URL or tags
    const lineItems = Array.isArray(body.line_items) ? body.line_items : [];
    const noteAttributes = Array.isArray(body.note_attributes)
      ? body.note_attributes
      : [];

    const refs = new Set<string>();

    for (const item of lineItems) {
      // Shopify doesn't pass the landing URL, but if the merchant uses
      // "properties" or tags to record the ref, we can pick it up.
      const props = Array.isArray(item.properties) ? item.properties : [];
      for (const prop of props) {
        if (prop.name === "skr_ref" && prop.value) {
          refs.add(String(prop.value));
        }
      }
    }

    // Fallback: check order-level note_attributes for skr_ref
    for (const attr of noteAttributes) {
      if (attr.name === "skr_ref" && attr.value) {
        refs.add(String(attr.value));
      }
    }

    if (refs.size === 0) {
      // No Skinner reference in this order — nothing to do
      return NextResponse.json({ ok: true });
    }

    const totalPrice = body.total_price ? parseFloat(body.total_price) : 0;
    const commission = totalPrice * 0.05; // default 5% — tenant commission rate read below

    const tenant = await db.tenant.findUnique({
      where: { id: integration.tenantId },
      select: { commissionRate: true },
    });
    const commissionRate = tenant?.commissionRate ?? 0.05;
    const calculatedCommission = totalPrice * commissionRate;

    for (const ref of refs) {
      const recommendation = await db.recommendation.findFirst({
        where: { productId: ref },
      });
      if (!recommendation) continue;

      await db.conversion.create({
        data: {
          recommendationId: recommendation.id,
          type: "purchase",
          saleValue: totalPrice,
          commission: calculatedCommission,
        },
      });

      await db.usageEvent.create({
        data: {
          tenantId: integration.tenantId,
          type: "commission",
          quantity: 1,
          unitPrice: calculatedCommission,
          total: calculatedCommission,
          metadata: JSON.stringify({
            source: "shopify",
            orderId: body.id,
            ref,
          }),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[shopify/webhooks/order] error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
