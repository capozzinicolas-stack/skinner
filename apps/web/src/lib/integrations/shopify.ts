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

// Fetch a single product by id. Used by products/update webhook to refresh
// just one row without re-syncing the whole catalog. Returns null on 404.
export async function fetchProduct(
  shop: string,
  accessToken: string,
  productId: string | number
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify product fetch failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return (data?.product as Record<string, unknown>) ?? null;
}

async function registerWebhook(
  shop: string,
  accessToken: string,
  topic: string,
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
        webhook: { topic, address: callbackUrl, format: "json" },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    // 422 with "address has already been taken" — Shopify returns this when
    // the (topic, address) pair is already registered. Idempotent re-OAuth
    // safe to swallow.
    console.error(`Shopify webhook ${topic} registration:`, res.status, text);
  }
}

export async function registerOrderWebhook(
  shop: string,
  accessToken: string,
  callbackUrl: string
): Promise<void> {
  await registerWebhook(shop, accessToken, "orders/create", callbackUrl);
}

// Real-time catalog sync. Shopify fires products/create when a new product
// is added and products/update when fields change (price, stock, name,
// images, status). We re-fetch and upsert by SKU so /loja and /analise see
// fresh data without waiting for the daily cron.
export async function registerProductWebhooks(
  shop: string,
  accessToken: string,
  callbackUrl: string
): Promise<void> {
  await registerWebhook(shop, accessToken, "products/create", callbackUrl);
  await registerWebhook(shop, accessToken, "products/update", callbackUrl);
  await registerWebhook(shop, accessToken, "products/delete", callbackUrl);
}

// Fired when the merchant uninstalls our app from the Shopify admin. We
// flip Integration.status="disconnected" + clear accessToken so the
// dispatcher stops trying to deep-link to a store we can no longer write to.
export async function registerUninstallWebhook(
  shop: string,
  accessToken: string,
  callbackUrl: string
): Promise<void> {
  await registerWebhook(shop, accessToken, "app/uninstalled", callbackUrl);
}

// Verify HMAC signature on incoming Shopify webhooks. Shopify signs every
// webhook with HMAC-SHA256 using the app's API secret (SHOPIFY_CLIENT_SECRET).
// The signature lives in `X-Shopify-Hmac-SHA256` header (base64). We MUST
// compute the HMAC over the RAW request body (not parsed JSON) — any
// re-serialization breaks the comparison.
//
// Returns true when valid, false when invalid OR when SHOPIFY_CLIENT_SECRET
// is missing in dev (so local testing without a real secret still works).
// In production, missing secret means caller should reject the request.
export async function verifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null
): Promise<boolean> {
  if (!hmacHeader) return false;
  if (!SHOPIFY_CLIENT_SECRET) {
    // Dev fallback — explicitly insecure, only OK when no secret configured.
    return process.env.NODE_ENV !== "production";
  }
  const { createHmac, timingSafeEqual } = await import("crypto");
  const computed = createHmac("sha256", SHOPIFY_CLIENT_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  // timingSafeEqual requires equal-length buffers; otherwise return false.
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Shared mapper Shopify → Skinner Product upsert input. Keeps the product
// webhook handler and the daily resync cron in sync — adding a new field
// (e.g. stock count) only touches this function. The pre-existing manual
// sync route + integration.syncShopifyProducts mutation still inline their
// own loop for backwards compat; new code should call this directly.
export function mapShopifyProduct(p: Record<string, unknown>): {
  sku: string;
  name: string;
  description: string | undefined;
  imageUrl: string | undefined;
  price: number | undefined;
  ecommerceLink: string | undefined;
} | null {
  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  }

  const name = typeof p.title === "string" ? p.title : "";
  if (!name) return null;

  const variants = Array.isArray(p.variants)
    ? (p.variants as Array<Record<string, unknown>>)
    : [];
  const variant = variants[0] ?? {};
  const sku =
    typeof variant.sku === "string" && variant.sku
      ? variant.sku
      : String(p.id ?? "");
  if (!sku) return null;

  const priceRaw = variant.price;
  const price =
    typeof priceRaw === "string"
      ? parseFloat(priceRaw)
      : typeof priceRaw === "number"
        ? priceRaw
        : undefined;

  // B1 (image strategy, same as Nuvemshop): reference Shopify CDN URL
  // directly. Cheaper than copying to our bucket; risk is the merchant
  // deleting the image, but uncommon in practice.
  const images = Array.isArray(p.images)
    ? (p.images as Array<Record<string, unknown>>)
    : [];
  const imageUrl =
    images[0] && typeof images[0].src === "string"
      ? (images[0].src as string)
      : undefined;

  // Build storefront product URL from handle. We pass storeId (=shop domain)
  // separately because the mapper doesn't know it; the caller who has the
  // Integration row builds the full URL — see callers.
  const handle = typeof p.handle === "string" ? p.handle : "";

  const rawDesc = typeof p.body_html === "string" ? p.body_html : "";
  const description = rawDesc ? stripHtml(rawDesc) : undefined;

  return {
    sku,
    name,
    description,
    imageUrl,
    price,
    // Caller injects the shop domain — see usages.
    ecommerceLink: handle ? `__SHOPIFY_HANDLE__${handle}` : undefined,
  };
}

// Helper to finalize ecommerceLink for a given shop. mapShopifyProduct
// returns a placeholder because it doesn't know the shop domain; callers
// pass the result through this to swap in the real URL.
export function resolveShopifyEcommerceLink(
  shop: string,
  ecommerceLink: string | undefined
): string | undefined {
  if (!ecommerceLink) return undefined;
  const marker = "__SHOPIFY_HANDLE__";
  if (ecommerceLink.startsWith(marker)) {
    const handle = ecommerceLink.slice(marker.length);
    return `https://${shop}/products/${handle}`;
  }
  return ecommerceLink;
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
