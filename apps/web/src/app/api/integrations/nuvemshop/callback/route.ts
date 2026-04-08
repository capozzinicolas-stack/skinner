import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import {
  exchangeCodeForToken,
  registerOrderWebhook,
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

  try {
    await db.integration.upsert({
      where: { tenantId_platform: { tenantId, platform: "nuvemshop" } },
      create: {
        tenantId,
        platform: "nuvemshop",
        storeId,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope ? JSON.stringify(tokenData.scope.split(" ")) : "[]",
        status: "active",
      },
      update: {
        storeId,
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

  // Register order/created webhook — non-blocking, failures are logged
  const webhookUrl = `${NUVEMSHOP_CALLBACK_URL.replace("/callback", "/webhooks/order")}`;
  registerOrderWebhook(storeId, tokenData.access_token, webhookUrl).catch((err) =>
    console.error("Nuvemshop: webhook registration error", err)
  );

  return NextResponse.redirect(
    new URL("/dashboard/integracao?nuvemshop=connected", req.url)
  );
}
