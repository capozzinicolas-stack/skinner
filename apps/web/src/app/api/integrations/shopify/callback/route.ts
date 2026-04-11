import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import {
  decodeState,
  exchangeCodeForToken,
  registerOrderWebhook,
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
    await db.integration.upsert({
      where: { tenantId_platform: { tenantId, platform: "shopify" } },
      create: {
        tenantId,
        platform: "shopify",
        storeId: shop,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope
          ? JSON.stringify(tokenData.scope.split(","))
          : "[]",
        status: "active",
      },
      update: {
        storeId: shop,
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

  // Register webhook for orders/create (non-blocking)
  const webhookUrl = `${SHOPIFY_CALLBACK_URL.replace("/callback", "/webhooks/order")}`;
  registerOrderWebhook(shop, tokenData.access_token, webhookUrl).catch((err) =>
    console.error("Shopify: webhook registration error", err)
  );

  return NextResponse.redirect(
    new URL("/dashboard/integracao?shopify=connected", req.url)
  );
}
