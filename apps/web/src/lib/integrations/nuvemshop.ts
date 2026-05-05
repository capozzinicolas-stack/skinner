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

export async function registerOrderWebhook(
  storeId: string,
  accessToken: string,
  callbackUrl: string
) {
  const res = await fetch(
    `https://api.tiendanube.com/v1/${storeId}/webhooks`,
    {
      method: "POST",
      headers: {
        Authentication: `bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Skinner (nicolas.capozzi@useimpulse.co)",
      },
      body: JSON.stringify({
        event: "order/created",
        url: callbackUrl,
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("Webhook registration failed:", text);
  }
}

export { NUVEMSHOP_CALLBACK_URL };
