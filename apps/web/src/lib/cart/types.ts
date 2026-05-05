/**
 * Channel = which checkout backend handles the purchase of an item.
 * Today's resolver supports 4 channels — see resolve-channel.ts. Single-channel
 * cart enforcement: a cart can only contain items from one channel at a time
 * (Opcao A from the multi-channel discussion). Mixed checkouts are deferred
 * to a future sprint that introduces per-channel sub-carts.
 */
export type CartChannel = "nuvemshop" | "shopify" | "external" | "whatsapp" | "mercadopago";

export type CartItem = {
  productId: string;
  name: string;
  price: number; // BRL, can be 0 for "preço sob consulta"
  imageUrl?: string | null;
  channel: CartChannel;
  // External destination URL or identifier (e.g. Nuvemshop sku, MP ad-hoc
  // reference). The dispatcher reads this when "Finalizar" is clicked.
  channelRef: string;
  trackingRef: string; // skr_ref for attribution back to the analysis
  recommendationTag: "recomendado" | "alternativa";
};

export type CartState = {
  items: CartItem[];
  channel: CartChannel | null;
};
