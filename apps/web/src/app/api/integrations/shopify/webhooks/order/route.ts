import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import { verifyWebhookHmac } from "@/lib/integrations/shopify";

/**
 * Webhook handler for Shopify orders/create events.
 *
 * Attribution chain (must all line up for a Conversion to land):
 *   1. Patient adds product to cart → dispatcher builds Shopify cart URL
 *      with `?attributes[skr_ref]=...&attributes[channel_id]=...&note=...`.
 *   2. Shopify carries `attributes[*]` into `note_attributes` of the order
 *      and `note=` into `order.note`. We scan BOTH for `skr_ref` and
 *      `channel_id` (defensive — `note` survives wider checkout flows than
 *      `attributes`, which only survive Shopify-hosted checkout).
 *   3. For each ref, look up Recommendation by `trackingRef` (NOT
 *      `productId` — bug fixed May-2026, previously this was silently
 *      broken and zero Shopify conversions ever matched).
 *   4. Persist Conversion + commission UsageEvent with the resolved
 *      channelId in metadata for /dashboard/relatorios groupings.
 *
 * Security: HMAC-SHA256 verification is mandatory. Without it any third
 * party could POST fake orders and create commissions out of thin air.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  const valid = await verifyWebhookHmac(rawBody, hmacHeader);
  if (!valid) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const shopDomain = req.headers.get("x-shopify-shop-domain");
  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  let body: {
    line_items?: Array<{ properties?: Array<{ name: string; value: string }> }>;
    note_attributes?: Array<{ name: string; value: string }>;
    note?: string;
    total_price?: string;
    id?: number | string;
  } = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ ok: true });
  }

  const integration = await db.integration.findFirst({
    where: { platform: "shopify", storeId: shopDomain, status: "active" },
  });
  if (!integration) {
    // Unknown shop or disconnected — accept but ignore (avoids leaking which
    // shops we have integrations with).
    return NextResponse.json({ ok: true });
  }

  const refs = new Set<string>();
  let originatingChannelId: string | null = null;

  // Source 1: line item properties[name=skr_ref]. Some merchants surface
  // these via custom snippets; we keep the original behavior.
  const lineItems = Array.isArray(body.line_items) ? body.line_items : [];
  for (const item of lineItems) {
    const props = Array.isArray(item.properties) ? item.properties : [];
    for (const prop of props) {
      if (prop.name === "skr_ref" && prop.value) refs.add(String(prop.value));
      if (prop.name === "channel_id" && prop.value)
        originatingChannelId = String(prop.value);
    }
  }

  // Source 2: order-level note_attributes (cart `?attributes[key]=value`
  // becomes `note_attributes` here). This is the primary path for orders
  // that came through our dispatcher.
  const noteAttributes = Array.isArray(body.note_attributes)
    ? body.note_attributes
    : [];
  for (const attr of noteAttributes) {
    if (attr.name === "skr_ref" && attr.value) refs.add(String(attr.value));
    if (attr.name === "channel_id" && attr.value)
      originatingChannelId = String(attr.value);
  }

  // Source 3: order.note free-form scan. Defensive — Shopify Plus and some
  // headless checkouts strip note_attributes but preserve `note`. The
  // dispatcher writes both, so this acts as a fallback.
  const orderNote = typeof body.note === "string" ? body.note : "";
  const skrMatches = orderNote.matchAll(/skr_ref=([a-z0-9]+)/gi);
  for (const m of skrMatches) {
    if (m[1]) refs.add(m[1]);
  }
  if (!originatingChannelId) {
    const channelMatch = orderNote.match(/channel_id=([a-z0-9]+)/i);
    if (channelMatch) originatingChannelId = channelMatch[1];
  }

  if (refs.size === 0) {
    return NextResponse.json({ ok: true });
  }

  const tenant = await db.tenant.findUnique({
    where: { id: integration.tenantId },
    select: { commissionRate: true },
  });
  // 0.03 default mirrors the platform-wide growth-tier rate. Custom plans
  // override via Tenant.commissionRate at signup; we use whatever is on the
  // row at order time.
  const commissionRate = tenant?.commissionRate ?? 0.03;

  const totalPrice =
    body.total_price != null ? parseFloat(String(body.total_price)) : 0;
  const commission = parseFloat((totalPrice * commissionRate).toFixed(2));

  // For each ref, look up Recommendation by trackingRef (NOT productId).
  // The previous implementation queried by productId which is a different
  // field entirely — it never matched and silently dropped every order.
  for (const ref of refs) {
    const recommendation = await db.recommendation.findUnique({
      where: { trackingRef: ref },
      select: { id: true },
    });
    if (!recommendation) continue;

    await db.conversion.create({
      data: {
        recommendationId: recommendation.id,
        type: "purchase",
        saleValue: totalPrice,
        commission,
      },
    });

    await db.usageEvent.create({
      data: {
        tenantId: integration.tenantId,
        type: "commission",
        quantity: 1,
        unitPrice: commission,
        total: commission,
        metadata: JSON.stringify({
          skr_ref: ref,
          source: "shopify",
          orderId: body.id,
          channel_id: originatingChannelId,
        }),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
