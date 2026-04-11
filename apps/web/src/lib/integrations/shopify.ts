const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";
const SHOPIFY_CALLBACK_URL =
  process.env.SHOPIFY_CALLBACK_URL ??
  "https://skinner.lat/api/integrations/shopify/callback";

const SHOPIFY_SCOPES = "read_products,read_orders,read_product_listings";
const SHOPIFY_API_VERSION = "2026-04";

/**
 * Build the Shopify OAuth authorization URL.
 * shop must be the full myshopify domain, e.g. "my-store.myshopify.com".
 */
export function getAuthUrl(tenantId: string, shop: string): string {
  const state = Buffer.from(JSON.stringify({ tenantId, shop })).toString(
    "base64"
  );
  const params = new URLSearchParams({
    client_id: SHOPIFY_CLIENT_ID,
    scope: SHOPIFY_SCOPES,
    redirect_uri: SHOPIFY_CALLBACK_URL,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchProducts(shop: string, accessToken: string) {
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify products fetch failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.products ?? [];
}

export async function registerOrderWebhook(
  shop: string,
  accessToken: string,
  callbackUrl: string
): Promise<void> {
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic: "orders/create",
          address: callbackUrl,
          format: "json",
        },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("Shopify webhook registration failed:", text);
  }
}

/**
 * Verify the state parameter matches the expected format and return tenantId + shop.
 */
export function decodeState(
  stateRaw: string
): { tenantId: string; shop: string } | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(decodeURIComponent(stateRaw), "base64").toString("utf-8")
    );
    if (!decoded.tenantId || !decoded.shop) return null;
    return { tenantId: decoded.tenantId, shop: decoded.shop };
  } catch {
    return null;
  }
}

export { SHOPIFY_CALLBACK_URL };
