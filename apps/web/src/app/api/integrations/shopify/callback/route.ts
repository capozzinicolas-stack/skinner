import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import {
  decodeState,
  exchangeCodeForToken,
  registerOrderWebhook,
  registerProductWebhooks,
  registerUninstallWebhook,
  SHOPIFY_CALLBACK_URL,
} from "@/lib/integrations/shopify";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const shopParam = searchParams.get("shop");

  if (!code || !stateRaw || !shopParam) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/integracao?shopify=error&reason=missing_params",
        req.url
      )
    );
  }

  const decoded = decodeState(stateRaw);
  if (!decoded) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/integracao?shopify=error&reason=invalid_state",
        req.url
      )
    );
  }

  // Verify the shop from the callback matches the shop in the state
  if (decoded.shop !== shopParam) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/integracao?shopify=error&reason=shop_mismatch",
        req.url
      )
    );
  }

  const { tenantId, shop } = decoded;

  let tokenData: { access_token: string; scope: string };
  try {
    tokenData = await exchangeCodeForToken(shop, code);
  } catch (err) {
    console.error("Shopify callback: token exchange failed", err);
    return NextResponse.redirect(
      new URL(
        "/dashboard/integracao?shopify=error&reason=token_exchange",
        req.url
      )
    );
  }

  try {
    // Shopify storefront URL is `https://{shop}` directly — no separate API
    // call needed (unlike Nuvemshop which has a localized `url` field). The
    // dispatcher reads this to build cart permalinks.
    const storeUrl = `https://${shop}`;
    await db.integration.upsert({
      where: { tenantId_platform: { tenantId, platform: "shopify" } },
      create: {
        tenantId,
        platform: "shopify",
        storeId: shop,
        storeUrl,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope
          ? JSON.stringify(tokenData.scope.split(","))
          : "[]",
        status: "active",
      },
      update: {
        storeId: shop,
        storeUrl,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope
          ? JSON.stringify(tokenData.scope.split(","))
          : "[]",
        status: "active",
      },
    });
  } catch (err) {
    console.error("Shopify callback: db upsert failed", err);
    return NextResponse.redirect(
      new URL("/dashboard/integracao?shopify=error&reason=db_error", req.url)
    );
  }

  // Register webhooks — non-blocking, errors logged. Re-OAuth is safe:
  // Shopify returns 422 "address has already been taken" for duplicates and
  // registerWebhook swallows it. Order webhook drives commission attribution;
  // product webhooks keep catalog fresh in real-time; uninstall webhook lets
  // us flip status to "disconnected" without a stale token sitting around.
  const baseWebhookUrl = SHOPIFY_CALLBACK_URL.replace("/callback", "/webhooks");
  registerOrderWebhook(
    shop,
    tokenData.access_token,
    `${baseWebhookUrl}/order`
  ).catch((err) =>
    console.error("Shopify: order webhook registration error", err)
  );
  registerProductWebhooks(
    shop,
    tokenData.access_token,
    `${baseWebhookUrl}/product`
  ).catch((err) =>
    console.error("Shopify: product webhook registration error", err)
  );
  registerUninstallWebhook(
    shop,
    tokenData.access_token,
    `${baseWebhookUrl}/uninstall`
  ).catch((err) =>
    console.error("Shopify: uninstall webhook registration error", err)
  );

  return NextResponse.redirect(
    new URL("/dashboard/integracao?shopify=connected", req.url)
  );
}
