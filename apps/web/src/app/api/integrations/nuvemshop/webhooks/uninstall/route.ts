import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";

/**
 * Fired by Nuvemshop when the merchant removes our app from their store.
 * The token gets revoked on Nuvemshop's side immediately, so any future
 * sync/fetch attempts will return 401. We mirror that state on our row by
 * flipping status to "disconnected" — the dispatcher and patient flow stop
 * deep-linking, the dashboard card switches back to "Conectar".
 *
 * Body shape:
 *   { store_id: number, event: "app/uninstalled" }
 *
 * We do NOT delete the Integration row to preserve audit trail (matchStats,
 * lastSyncAt, original storeId). Reconnecting via OAuth upserts on the same
 * (tenantId, platform) unique key and flips status back to "active".
 */
export async function POST(req: NextRequest) {
  let body: { store_id?: number | string; event?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const storeId =
    req.headers.get("x-store-id") ??
    req.headers.get("x-tiendanube-store-id") ??
    (body.store_id != null ? String(body.store_id) : "");

  if (!storeId) {
    return NextResponse.json({ ok: true });
  }

  try {
    await db.integration.updateMany({
      where: { storeId, platform: "nuvemshop", status: "active" },
      data: { status: "disconnected", accessToken: null },
    });
  } catch (err) {
    console.error("[nuvemshop uninstall webhook] update failed:", err);
  }

  return NextResponse.json({ ok: true });
}
