import type { CartChannel } from "./types";

/**
 * Inputs needed to decide which channel a single product should checkout
 * through. Kept loose so callers (results-screen, kit pages) can pass
 * whatever shape they have — the function never crashes on missing fields,
 * it just falls through to the next rule.
 */
export type ChannelInputs = {
  product: {
    type?: string | null;
    ecommerceLink?: string | null;
    bookingLink?: string | null;
    sku?: string | null;
  };
  tenantConfig?: {
    storefrontEnabled?: boolean | null;
    storefrontCtaMode?: string | null;
    whatsappNumber?: string | null;
    mercadoPagoEnabled?: boolean | null;
    mercadoPagoEmail?: string | null;
  } | null;
  // Active integrations on the tenant (typically passed from the page-level
  // query). When undefined we assume no integrations and fall back to
  // ecommerceLink-based heuristics.
  integrations?: Array<{ platform: string; status: string; storeId?: string | null }>;
};

/**
 * Heuristic to determine the checkout channel for a product. The order of
 * the if-statements IS the priority order — first match wins. When the
 * /admin/canais refactor lands (future sprint with explicit per-tenant
 * channel priority stack), this entire function gets replaced by a lookup
 * against the tenant's preference table; consumers do NOT need to change.
 */
export function resolveProductChannel(inputs: ChannelInputs): CartChannel {
  const { product, tenantConfig, integrations = [] } = inputs;

  const isService = product.type === "service";

  // Services with a booking link almost always go through external
  // (booking platform) — fallback to whatsapp if the tenant runs ops there.
  if (isService) {
    if (product.bookingLink) return "external";
    if (tenantConfig?.whatsappNumber && tenantConfig.storefrontEnabled) {
      return "whatsapp";
    }
    return "external";
  }

  // Active Nuvemshop integration + product link looks like a Nuvemshop
  // permalink → Nuvemshop cart wins.
  const hasNuvemshop = integrations.some(
    (i) => i.platform === "nuvemshop" && i.status === "active"
  );
  if (hasNuvemshop && product.ecommerceLink && /lojavirtualnuvem|tiendanube/.test(product.ecommerceLink)) {
    return "nuvemshop";
  }

  // Active Shopify integration + product link looks like a Shopify permalink.
  const hasShopify = integrations.some(
    (i) => i.platform === "shopify" && i.status === "active"
  );
  if (hasShopify && product.ecommerceLink && /myshopify\.com/.test(product.ecommerceLink)) {
    return "shopify";
  }

  // Tenant has MercadoPago configured + this product has no external e-commerce
  // link → use MP. (Today MP is just a mailto fallback; sprint MP-real swaps
  // the dispatcher to call the API.)
  if (
    tenantConfig?.mercadoPagoEnabled &&
    tenantConfig.mercadoPagoEmail &&
    !product.ecommerceLink
  ) {
    return "mercadopago";
  }

  // Whatsapp opt-in covers anything else when the tenant prefers manual ops.
  if (
    tenantConfig?.storefrontEnabled &&
    (tenantConfig.storefrontCtaMode === "whatsapp" ||
      tenantConfig.storefrontCtaMode === "both") &&
    tenantConfig.whatsappNumber
  ) {
    return "whatsapp";
  }

  // Default: whatever ecommerceLink points to (CSV-imported catalog,
  // direct URL on the tenant's external site, etc.)
  return "external";
}

/**
 * Build the channel-specific destination string used by the dispatcher.
 * Decoupled from the resolver so a single channel decision can render
 * different destinations depending on context (single product CTA vs cart
 * checkout). The dispatcher consumes this directly.
 */
export function buildChannelRef(
  channel: CartChannel,
  product: ChannelInputs["product"],
  trackingRef: string
): string {
  const ref = trackingRef ? `?skr_ref=${encodeURIComponent(trackingRef)}` : "";
  switch (channel) {
    case "nuvemshop":
      // For nuvemshop carts we need the SKU (or product id) — the dispatcher
      // will assemble the cart URL with all SKUs from the cart at checkout
      // time. Here we just pass the SKU so the cart can hold it.
      return product.sku || product.ecommerceLink || "";
    case "shopify":
      return product.sku || product.ecommerceLink || "";
    case "external":
      return product.ecommerceLink ? `${product.ecommerceLink}${ref}` : "";
    case "whatsapp":
      // No URL here — dispatcher builds the WhatsApp message at checkout.
      return product.sku || "";
    case "mercadopago":
      // Today MP uses mailto fallback — dispatcher builds the mailto URL.
      return product.sku || "";
  }
}
