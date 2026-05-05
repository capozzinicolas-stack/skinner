const NUVEMSHOP_APP_ID = process.env.NUVEMSHOP_APP_ID || "29381";
const NUVEMSHOP_CLIENT_SECRET =
  process.env.NUVEMSHOP_CLIENT_SECRET ||
  "7ec8d105bebf99880f10c89fe5241b4315902349950529a2";
const NUVEMSHOP_CALLBACK_URL =
  process.env.NUVEMSHOP_CALLBACK_URL ||
  "https://skinner.lat/api/integrations/nuvemshop/callback";

export function getAuthUrl(tenantId: string): string {
  const state = Buffer.from(JSON.stringify({ tenantId })).toString("base64");
  return `https://www.tiendanube.com/apps/${NUVEMSHOP_APP_ID}/authorize?state=${encodeURIComponent(state)}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
  user_id: number;
}> {
  const res = await fetch("https://www.tiendanube.com/apps/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: NUVEMSHOP_APP_ID,
      client_secret: NUVEMSHOP_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
    }),
  });
  if (!res.ok) throw new Error(`Nuvemshop token exchange failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch the store's public info (name, URL, country). Used right after the
 * OAuth callback to persist Integration.storeUrl, which the cart deep-link
 * dispatcher needs to redirect the patient to the right storefront. Returns
 * null on any error so the caller can degrade gracefully (the lazy backfill
 * in integration.publicByTenantSlug will retry later).
 */
export async function fetchStoreInfo(
  storeId: string,
  accessToken: string
): Promise<{ url: string | null; name: string | null; country: string | null } | null> {
  try {
    const res = await fetch(
      `https://api.tiendanube.com/v1/${storeId}/store`,
      {
        headers: {
          Authentication: `bearer ${accessToken}`,
          "User-Agent": "Skinner (nicolas.capozzi@useimpulse.co)",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Nuvemshop API returns name as a localized object; pick pt or first key.
    const nameObj = data?.name;
    const name =
      typeof nameObj === "string"
        ? nameObj
        : nameObj?.pt ?? nameObj?.es ?? Object.values(nameObj ?? {})[0] ?? null;
    return {
      url: typeof data?.url === "string" ? data.url : null,
      name: typeof name === "string" ? name : null,
      country: typeof data?.country === "string" ? data.country : null,
    };
  } catch (err) {
    console.error("[nuvemshop] fetchStoreInfo failed:", err);
    return null;
  }
}

export async function fetchProducts(storeId: string, accessToken: string) {
  const res = await fetch(
    `https://api.tiendanube.com/v1/${storeId}/products?per_page=200`,
    {
      headers: {
        Authentication: `bearer ${accessToken}`,
        "User-Agent": "Skinner (nicolas.capozzi@useimpulse.co)",
      },
    }
  );
  if (!res.ok)
    throw new Error(`Nuvemshop products fetch failed: ${res.status}`);
  return res.json();
}

// Fetch a single product by id. Used by the product/updated webhook handler
// to refresh just one row rather than re-syncing the whole catalog. Returns
// null on 404 (product was deleted between webhook fire and our fetch) so the
// caller can soft-disable the row instead of crashing.
export async function fetchProduct(
  storeId: string,
  accessToken: string,
  productId: string | number
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `https://api.tiendanube.com/v1/${storeId}/products/${productId}`,
    {
      headers: {
        Authentication: `bearer ${accessToken}`,
        "User-Agent": "Skinner (nicolas.capozzi@useimpulse.co)",
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`Nuvemshop product fetch failed: ${res.status}`);
  return res.json();
}

async function registerWebhook(
  storeId: string,
  accessToken: string,
  event: string,
  callbackUrl: string
): Promise<void> {
  const res = await fetch(
    `https://api.tiendanube.com/v1/${storeId}/webhooks`,
    {
      method: "POST",
      headers: {
        Authentication: `bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Skinner (nicolas.capozzi@useimpulse.co)",
      },
      body: JSON.stringify({ event, url: callbackUrl }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    // 422 typically means "already registered" — Nuvemshop is idempotent at
    // (event, url) so re-registering on every OAuth is a no-op the API rejects.
    // We swallow it because the practical effect is identical to success.
    console.error(`[nuvemshop] webhook ${event} registration:`, res.status, text);
  }
}

export async function registerOrderWebhook(
  storeId: string,
  accessToken: string,
  callbackUrl: string
) {
  await registerWebhook(storeId, accessToken, "order/created", callbackUrl);
}

// Real-time catalog sync. Nuvemshop fires product/updated when the merchant
// edits price, stock, name, images, etc. We re-fetch that single product and
// upsert by SKU so /loja and /analise see fresh data without waiting for the
// daily resync cron.
export async function registerProductWebhooks(
  storeId: string,
  accessToken: string,
  callbackUrl: string
) {
  await registerWebhook(storeId, accessToken, "product/created", callbackUrl);
  await registerWebhook(storeId, accessToken, "product/updated", callbackUrl);
}

// Fired when the merchant uninstalls our app from the Nuvemshop admin. We
// flip Integration.status to "disconnected" so the dispatcher stops trying
// to deep-link to a store we can no longer write to.
export async function registerUninstallWebhook(
  storeId: string,
  accessToken: string,
  callbackUrl: string
) {
  await registerWebhook(storeId, accessToken, "app/uninstalled", callbackUrl);
}

// Shared upsert logic so the manual sync route, the syncProducts mutation, the
// product webhook and the daily resync cron all write the same shape into
// Skinner's Product table. Pulled into a helper to avoid drift — adding a new
// field (e.g. stock) only touches this function.
//
// Note: the existing sync route + syncProducts mutation still inline their own
// loop for backwards compatibility (those paths predate this helper). New code
// should call this directly.
export function mapNuvemshopProduct(p: Record<string, unknown>): {
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
  function ptBr(field: unknown): string {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (typeof field === "object") {
      const obj = field as Record<string, string>;
      return obj["pt"] ?? obj["pt-BR"] ?? Object.values(obj)[0] ?? "";
    }
    return "";
  }

  const name = ptBr(p.name);
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

  // B1 (image strategy): reference the Nuvemshop CDN URL directly. Cheaper
  // than copying to our bucket; risk is the lojista deleting the image and
  // breaking the link, but Nuvemshop merchants rarely do that without
  // replacing first.
  const images = Array.isArray(p.images)
    ? (p.images as Array<Record<string, unknown>>)
    : [];
  const imageUrl =
    images[0] && typeof images[0].src === "string"
      ? (images[0].src as string)
      : undefined;

  const ecommerceLink =
    typeof p.permalink === "string" ? p.permalink : undefined;

  const rawDesc = ptBr(p.description);
  const description = rawDesc ? stripHtml(rawDesc) : undefined;

  return { sku, name, description, imageUrl, price, ecommerceLink };
}

export { NUVEMSHOP_CALLBACK_URL };
