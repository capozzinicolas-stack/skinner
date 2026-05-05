import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import { verifyWebhookHmac } from "@/lib/integrations/shopify";

/**
 * Fired by Shopify when the merchant removes our app from their store. The
 * accessToken gets revoked on Shopify's side immediately, so any future API
 * call returns 401. We mirror that by flipping our row to "disconnected"
 * and clearing the accessToken — the dispatcher and patient flow stop
 * deep-linking, the dashboard card switches back to "Conectar".
 *
 * The Integration row is preserved (matchStats, lastSyncAt, original storeId)
 * for audit. Reconnecting via OAuth upserts on (tenantId, platform) and
 * flips status back to "active".
 *
 * HMAC verification is mandatory: without it, anyone could spoof an uninstall
 * and DoS our integrations.
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
    return NextResponse.json({ ok: true });
  }

  try {
    await db.integration.updateMany({
      where: { storeId: shopDomain, platform: "shopify", status: "active" },
      data: { status: "disconnected", accessToken: null },
    });
  } catch (err) {
    console.error("[shopify uninstall webhook] update failed:", err);
  }

  return NextResponse.json({ ok: true });
}
