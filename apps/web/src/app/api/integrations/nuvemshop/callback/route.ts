import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import {
  exchangeCodeForToken,
  fetchStoreInfo,
  registerOrderWebhook,
  registerProductWebhooks,
  registerUninstallWebhook,
  NUVEMSHOP_CALLBACK_URL,
} from "@/lib/integrations/nuvemshop";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/dashboard/integracao?nuvemshop=error&reason=missing_params", req.url)
    );
  }

  let tenantId: string;
  try {
    const decoded = JSON.parse(Buffer.from(decodeURIComponent(stateRaw), "base64").toString("utf-8"));
    tenantId = decoded.tenantId;
    if (!tenantId) throw new Error("Missing tenantId in state");
  } catch (err) {
    console.error("Nuvemshop callback: invalid state", err);
    return NextResponse.redirect(
      new URL("/dashboard/integracao?nuvemshop=error&reason=invalid_state", req.url)
    );
  }

  let tokenData: { access_token: string; token_type: string; scope: string; user_id: number };
  try {
    tokenData = await exchangeCodeForToken(code);
  } catch (err) {
    console.error("Nuvemshop callback: token exchange failed", err);
    return NextResponse.redirect(
      new URL("/dashboard/integracao?nuvemshop=error&reason=token_exchange", req.url)
    );
  }

  const storeId = String(tokenData.user_id);

  // Best-effort: fetch the store's public URL right after OAuth so the cart
  // dispatcher can deep-link to the correct storefront. If this fails (Nuvemshop
  // 5xx, network blip, rate limit), the integration still saves and the lazy
  // backfill in integration.publicByTenantSlug will recover later.
  const storeInfo = await fetchStoreInfo(storeId, tokenData.access_token);

  try {
    await db.integration.upsert({
      where: { tenantId_platform: { tenantId, platform: "nuvemshop" } },
      create: {
        tenantId,
        platform: "nuvemshop",
        storeId,
        storeUrl: storeInfo?.url ?? null,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope ? JSON.stringify(tokenData.scope.split(" ")) : "[]",
        status: "active",
      },
      update: {
        storeId,
        // Only overwrite storeUrl if we successfully fetched it — never wipe a
        // previously-good value with a null from a transient API failure.
        ...(storeInfo?.url ? { storeUrl: storeInfo.url } : {}),
        accessToken: tokenData.access_token,
        scopes: tokenData.scope ? JSON.stringify(tokenData.scope.split(" ")) : "[]",
        status: "active",
      },
    });
  } catch (err) {
    console.error("Nuvemshop callback: db upsert failed", err);
    return NextResponse.redirect(
      new URL("/dashboard/integracao?nuvemshop=error&reason=db_error", req.url)
    );
  }

  // Register webhooks — non-blocking, failures are logged. Re-registering on a
  // reconnect is safe: Nuvemshop returns 422 for duplicate (event,url) and we
  // swallow that in registerWebhook(). Order webhook drives commission
  // attribution; product webhooks keep catalog fresh in real-time; uninstall
  // webhook lets us flip status to "disconnected" automatically.
  const baseWebhookUrl = NUVEMSHOP_CALLBACK_URL.replace("/callback", "/webhooks");
  registerOrderWebhook(
    storeId,
    tokenData.access_token,
    `${baseWebhookUrl}/order`
  ).catch((err) =>
    console.error("Nuvemshop: order webhook registration error", err)
  );
  registerProductWebhooks(
    storeId,
    tokenData.access_token,
    `${baseWebhookUrl}/product`
  ).catch((err) =>
    console.error("Nuvemshop: product webhook registration error", err)
  );
  registerUninstallWebhook(
    storeId,
    tokenData.access_token,
    `${baseWebhookUrl}/uninstall`
  ).catch((err) =>
    console.error("Nuvemshop: uninstall webhook registration error", err)
  );

  return NextResponse.redirect(
    new URL("/dashboard/integracao?nuvemshop=connected", req.url)
  );
}
