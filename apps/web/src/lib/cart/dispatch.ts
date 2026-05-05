import type { CartItem } from "./types";

/**
 * Dispatcher — converts the cart into a navigation URL based on the cart's
 * single channel. Single-channel enforcement happens at add time
 * (cart-store.tsx), so we never see mixed carts here.
 *
 * Returns the URL the browser should navigate to, or null if dispatch is
 * not possible for this channel (e.g. WhatsApp without configured number —
 * caller should surface the error).
 */
export type DispatchContext = {
  whatsappNumber?: string | null;
  whatsappTemplate?: string | null;
  mercadoPagoEmail?: string | null;
  // Nuvemshop store base URL (e.g. "https://lojateste.lojavirtualnuvem.com.br").
  // Today we don't persist this on the integration row — TODO sprint follow-up:
  // store base URL on Integration when registering OAuth callback.
  nuvemshopBaseUrl?: string | null;
  shopifyBaseUrl?: string | null;
  tenantName?: string | null;
  // Channel that originated this checkout. Propagated to the host store via
  // URL params + note attribute so /api/integrations/nuvemshop/webhooks/order
  // can persist conversion attribution at the channel level (Conversion.metadata).
  channelId?: string | null;
};

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildCartCheckoutUrl(
  items: CartItem[],
  ctx: DispatchContext
): { url: string | null; warning?: string } {
  if (items.length === 0) return { url: null };

  const channel = items[0].channel;

  switch (channel) {
    case "nuvemshop": {
      if (!ctx.nuvemshopBaseUrl) {
        return {
          url: null,
          warning:
            "Loja Nuvemshop nao esta configurada. Entre em contato com a clinica.",
        };
      }
      // Nuvemshop cart deep-link: /carrinho/adicionar?sku=A&qty=1&sku=B&qty=1
      // Skus and quantities come from items.channelRef. We also pass the
      // tracking ref TWICE: once as `skr_ref` for direct attribution and once
      // as `note=skr_ref%3D...` because Nuvemshop preserves the `note` field
      // through cart → checkout → order webhook (where the order handler at
      // /api/integrations/nuvemshop/webhooks/order scans body.note for
      // "skr_ref=" matches). Belt-and-suspenders for conversion attribution.
      const params = new URLSearchParams();
      for (const item of items) {
        if (!item.channelRef) continue;
        params.append("sku", item.channelRef);
        params.append("qty", "1");
      }
      const trackingRef = items[0].trackingRef;
      // The note string carries BOTH skr_ref (recommendation attribution) and
      // channel_id (channel attribution) so the order webhook can split
      // conversion stats by channel without needing additional queries. The
      // note is preserved through cart → checkout → order in Nuvemshop, while
      // the standalone query params (skr_ref, channel_id) are best-effort.
      const noteParts: string[] = [];
      if (trackingRef) {
        params.append("skr_ref", trackingRef);
        noteParts.push(`skr_ref=${trackingRef}`);
      }
      if (ctx.channelId) {
        params.append("channel_id", ctx.channelId);
        noteParts.push(`channel_id=${ctx.channelId}`);
      }
      if (noteParts.length > 0) {
        params.append("note", noteParts.join("&"));
      }
      const base = ctx.nuvemshopBaseUrl.replace(/\/+$/, "");
      return { url: `${base}/carrinho/adicionar?${params.toString()}` };
    }

    case "shopify": {
      if (!ctx.shopifyBaseUrl) {
        return {
          url: null,
          warning:
            "Loja Shopify nao esta configurada. Entre em contato com a clinica.",
        };
      }
      // Shopify cart permalink: /cart/{variantId}:1,{variantId}:1
      const variants = items
        .map((i) => i.channelRef)
        .filter((v) => v.length > 0)
        .map((v) => `${v}:1`)
        .join(",");
      const trackingRef = items[0].trackingRef;
      const refQuery = trackingRef ? `?skr_ref=${encodeURIComponent(trackingRef)}` : "";
      const base = ctx.shopifyBaseUrl.replace(/\/+$/, "");
      return { url: `${base}/cart/${variants}${refQuery}` };
    }

    case "external": {
      // External multi-product can't be consolidated. Open the first item's
      // URL and warn the user about the rest.
      const first = items[0];
      if (!first.channelRef) {
        return {
          url: null,
          warning: "Este produto nao tem link de compra configurado.",
        };
      }
      const warning =
        items.length > 1
          ? `Apenas o primeiro item sera aberto. Volte a esta pagina para finalizar os outros ${items.length - 1} item(s).`
          : undefined;
      return { url: first.channelRef, warning };
    }

    case "whatsapp": {
      if (!ctx.whatsappNumber) {
        return {
          url: null,
          warning:
            "WhatsApp da clinica nao esta configurado. Entre em contato diretamente.",
        };
      }
      const cleaned = ctx.whatsappNumber.replace(/\D/g, "");
      const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
      const list = items
        .map((i) => `- ${i.name}${i.price ? ` (R$ ${brl(i.price)})` : ""}`)
        .join("\n");
      const greeting = ctx.tenantName
        ? `Ola, vim pela analise Skinner da ${ctx.tenantName}.`
        : `Ola, vim pela analise Skinner.`;
      const body = `${greeting}\n\nGostaria de comprar:\n${list}\n\nTotal estimado: R$ ${brl(total)}\n\nReferencia: ${items[0].trackingRef}`;
      return {
        url: `https://wa.me/${cleaned}?text=${encodeURIComponent(body)}`,
      };
    }

    case "mercadopago": {
      // Today MP is just a mailto fallback. The real API integration is
      // a future sprint (lib/payment/mercadopago.ts will replace this branch).
      if (!ctx.mercadoPagoEmail) {
        return {
          url: null,
          warning:
            "Pagamento MercadoPago nao esta configurado. Entre em contato com a clinica.",
        };
      }
      const list = items.map((i) => `- ${i.name} (R$ ${brl(i.price || 0)})`).join("\n");
      const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
      const subject = `Pedido Skinner - R$ ${brl(total)}`;
      const body = `Itens:\n${list}\n\nTotal: R$ ${brl(total)}\n\nReferencia: ${items[0].trackingRef}`;
      return {
        url: `mailto:${ctx.mercadoPagoEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        warning:
          "Voce sera levado a enviar um e-mail para a clinica solicitar o pagamento. Em breve teremos checkout MercadoPago integrado.",
      };
    }
  }
}
