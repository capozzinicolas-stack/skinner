import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import {
  fetchProducts,
  mapShopifyProduct,
  resolveShopifyEcommerceLink,
} from "@/lib/integrations/shopify";

/**
 * Daily safety-net resync of every active Shopify integration. The
 * products/create and products/update webhooks (registered at OAuth
 * callback) cover real-time updates, but webhooks can drop (network,
 * Shopify outage, lojista importing thousands of products faster than
 * webhook delivery). This cron walks every active integration once a day
 * and reconciles the catalog.
 *
 * Auth: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}`. Same
 * pattern as nuvemshop-resync and usage-alerts. Local dev allowed without
 * when CRON_SECRET unset.
 *
 * Schedule: see vercel.json — daily 03:30 UTC (00:30 BRT). Offset 30
 * minutes from nuvemshop-resync to avoid both crons hammering Shopify and
 * Nuvemshop APIs simultaneously.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integrations = await db.integration.findMany({
    where: { platform: "shopify", status: "active" },
    select: {
      id: true,
      tenantId: true,
      storeId: true,
      accessToken: true,
    },
  });

  let totalSynced = 0;
  const results: Array<{
    integrationId: string;
    synced: number;
    error: string | null;
  }> = [];

  for (const integration of integrations) {
    if (!integration.storeId || !integration.accessToken) {
      results.push({
        integrationId: integration.id,
        synced: 0,
        error: "missing storeId or accessToken",
      });
      continue;
    }

    let raw: Array<Record<string, unknown>>;
    try {
      raw = await fetchProducts(integration.storeId, integration.accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // 401 means the merchant uninstalled but we never got the webhook.
      // Mark the row as error so the dashboard surfaces it for re-auth.
      const tokenRevoked = /401/.test(message);
      if (tokenRevoked) {
        await db.integration.update({
          where: { id: integration.id },
          data: { status: "error" },
        });
      }
      results.push({
        integrationId: integration.id,
        synced: 0,
        error: message,
      });
      continue;
    }

    let synced = 0;
    for (const p of raw) {
      const mapped = mapShopifyProduct(p);
      if (!mapped) continue;
      const ecommerceLink = resolveShopifyEcommerceLink(
        integration.storeId,
        mapped.ecommerceLink
      );
      try {
        await db.product.upsert({
          where: {
            tenantId_sku: {
              tenantId: integration.tenantId,
              sku: mapped.sku,
            },
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
        synced += 1;
      } catch (err) {
        console.error(
          `[shopify-resync] upsert failed tenant=${integration.tenantId} sku=${mapped.sku}:`,
          err
        );
      }
    }

    await db.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    totalSynced += synced;
    results.push({ integrationId: integration.id, synced, error: null });
  }

  return NextResponse.json({
    ok: true,
    integrationsProcessed: integrations.length,
    totalSynced,
    results,
  });
}
