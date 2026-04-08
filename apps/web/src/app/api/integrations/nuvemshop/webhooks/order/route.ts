import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Nuvemshop sends the store ID as a header
  const storeId =
    req.headers.get("x-store-id") ??
    req.headers.get("x-tiendanube-store-id") ??
    String(body?.store_id ?? "");

  if (!storeId) {
    return NextResponse.json({ ok: true });
  }

  // Find the integration for this store
  const integration = await db.integration.findFirst({
    where: { storeId, platform: "nuvemshop", status: "active" },
  });

  if (!integration) {
    return NextResponse.json({ ok: true });
  }

  const tenantId = integration.tenantId;
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { commissionRate: true },
  });

  const commissionRate = tenant?.commissionRate ?? 0.03;

  // Parse order products looking for skr_ref tracking refs
  const orderProducts: any[] = body?.products ?? [];
  const orderNote: string = body?.note ?? "";
  const orderTotal: number = parseFloat(body?.total ?? "0") || 0;

  // Collect all skr_ref values from product URLs or order note
  const skrRefs: string[] = [];

  for (const item of orderProducts) {
    const permalink: string = item?.permalink ?? item?.product_id ?? "";
    const match = String(permalink).match(/skr_ref=([a-z0-9]+)/i);
    if (match) skrRefs.push(match[1]);
  }

  // Also scan note field
  const noteMatches = orderNote.matchAll(/skr_ref=([a-z0-9]+)/gi);
  for (const m of noteMatches) {
    if (!skrRefs.includes(m[1])) skrRefs.push(m[1]);
  }

  // For each found skr_ref, record a conversion and a commission usage event
  for (const ref of skrRefs) {
    const recommendation = await db.recommendation.findUnique({
      where: { trackingRef: ref },
      select: { id: true },
    });
    if (!recommendation) continue;

    const saleValue = orderTotal;
    const commission = parseFloat((saleValue * commissionRate).toFixed(2));

    await db.conversion.create({
      data: {
        recommendationId: recommendation.id,
        type: "purchase",
        saleValue,
        commission,
      },
    });

    await db.usageEvent.create({
      data: {
        tenantId,
        type: "commission",
        quantity: 1,
        unitPrice: commission,
        total: commission,
        metadata: JSON.stringify({ skr_ref: ref, source: "nuvemshop" }),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
