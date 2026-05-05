"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/cart-store";
import {
  buildCartCheckoutUrl,
  type DispatchContext,
} from "@/lib/cart/dispatch";
import type { CartItem } from "@/lib/cart/types";

/**
 * Sticky footer rendered on /analise/[slug] and /kit/[kitId] when the cart
 * is non-empty. Shows count + total + two CTAs:
 *   - "Adicionar rotina completa" (when there are recommended products not yet in cart)
 *   - "Finalizar →" (calls dispatcher and navigates to channel-specific checkout)
 *
 * Branded with primaryColor / secondaryColor passed from the parent page so
 * tenants with custom branding see consistent styling end-to-end.
 */
export function CartFloater({
  primaryColor,
  secondaryColor,
  routineCandidates,
  dispatchContext,
}: {
  primaryColor: string;
  secondaryColor: string;
  // Products tagged "recomendado" that COULD be added in bulk. Each candidate
  // already has all the fields the cart needs. Filtered (against current cart)
  // inside this component to keep the parent simple.
  routineCandidates: CartItem[];
  dispatchContext: DispatchContext;
}) {
  const { cart, addItem, totalBRL, clear } = useCart();
  const [warning, setWarning] = useState<string | null>(null);

  if (cart.items.length === 0) return null;

  const inCartIds = new Set(cart.items.map((i) => i.productId));
  const remainingRoutine = routineCandidates.filter(
    (p) =>
      !inCartIds.has(p.productId) &&
      p.recommendationTag === "recomendado" &&
      // Channel match — the resolver already set this. We only auto-add items
      // whose channel matches what's in the cart so we never trigger a
      // mismatch dialog from the bulk action.
      p.channel === cart.channel
  );

  function handleAddRoutine() {
    setWarning(null);
    let added = 0;
    let skipped = 0;
    for (const p of remainingRoutine) {
      const result = addItem(p);
      if (result.ok) added++;
      else skipped++;
    }
    if (skipped > 0) {
      setWarning(
        `${added} item(s) adicionado(s). ${skipped} foi(ram) ignorado(s) por nao serem compativeis com o canal atual.`
      );
    }
  }

  function handleCheckout() {
    setWarning(null);
    const result = buildCartCheckoutUrl(cart.items, dispatchContext);
    if (result.warning) setWarning(result.warning);
    if (result.url) {
      // Open in same tab — checkout is the terminal action of the analise.
      // Clear the cart AFTER navigation so a back-button refresh doesn't
      // re-open the same checkout in a stale state.
      clear();
      window.location.href = result.url;
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-sable shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-40"
      role="region"
      aria-label="Carrinho"
    >
      {warning && (
        <div className="bg-ivoire border-b border-sable/30 px-4 py-2 text-xs text-terre font-light text-center">
          {warning}
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="font-serif text-base text-carbone">
            {cart.items.length} {cart.items.length === 1 ? "item" : "itens"}
          </span>
          <span className="text-pierre/40 text-sm">·</span>
          <span className="text-sm text-carbone font-light">
            R${" "}
            {totalBRL.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {remainingRoutine.length > 0 && (
            <button
              type="button"
              onClick={handleAddRoutine}
              className="px-3 py-2 border border-sable/40 text-pierre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
            >
              + Adicionar rotina completa ({remainingRoutine.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = secondaryColor || primaryColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = primaryColor)
            }
            className="px-5 py-2 text-blanc-casse text-sm font-light tracking-wide transition-colors"
          >
            Finalizar →
          </button>
        </div>
      </div>
    </div>
  );
}
