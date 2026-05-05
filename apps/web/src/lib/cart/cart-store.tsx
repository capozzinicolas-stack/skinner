"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartChannel, CartItem, CartState } from "./types";

/**
 * Cart context. Lives entirely in the browser — no server state, no DB. The
 * cart is keyed by analysisId so multiple parallel analyses (e.g. tabs) don't
 * stomp on each other. Persisted to localStorage with a 24h TTL so a refresh
 * doesn't lose the patient's selections; falls back to in-memory when storage
 * is unavailable (Safari private mode, etc.).
 *
 * Single-channel enforcement: addItem refuses to mix channels. Caller must
 * either confirm replacement (replaceCart) or skip the add. UX-wise this is
 * surfaced as a confirm dialog at the call site.
 */
type CartContextValue = {
  cart: CartState;
  addItem: (item: CartItem) => { ok: true } | { ok: false; reason: "channel-mismatch"; existingChannel: CartChannel };
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  replaceCart: (item: CartItem) => void;
  clear: () => void;
  totalBRL: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const TTL_MS = 24 * 60 * 60 * 1000;

function storageKey(analysisId: string): string {
  return `skinner_cart_${analysisId}`;
}

function loadFromStorage(analysisId: string): CartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(analysisId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; state: CartState };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(storageKey(analysisId));
      return null;
    }
    return parsed.state;
  } catch {
    return null;
  }
}

function saveToStorage(analysisId: string, state: CartState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(analysisId),
      JSON.stringify({ savedAt: Date.now(), state })
    );
  } catch {
    // Quota exceeded or storage disabled — degrade silently to in-memory.
  }
}

export function CartProvider({
  analysisId,
  children,
}: {
  analysisId: string;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartState>({ items: [], channel: null });

  // Hydrate from storage AFTER mount so SSR + client agree on initial render.
  useEffect(() => {
    const restored = loadFromStorage(analysisId);
    if (restored && restored.items.length > 0) setCart(restored);
  }, [analysisId]);

  // Persist on every change.
  useEffect(() => {
    saveToStorage(analysisId, cart);
  }, [analysisId, cart]);

  const addItem = useCallback<CartContextValue["addItem"]>((item) => {
    let result: ReturnType<CartContextValue["addItem"]> = { ok: true };
    setCart((prev) => {
      // Already in cart → no-op (UI uses hasItem to render "no carrinho")
      if (prev.items.some((i) => i.productId === item.productId)) {
        return prev;
      }
      // Channel-mismatch → bail. Caller must confirm + call replaceCart.
      if (prev.channel && prev.channel !== item.channel) {
        result = {
          ok: false,
          reason: "channel-mismatch",
          existingChannel: prev.channel,
        };
        return prev;
      }
      return {
        items: [...prev.items, item],
        channel: prev.channel ?? item.channel,
      };
    });
    return result;
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.productId !== productId);
      return {
        items,
        channel: items.length === 0 ? null : prev.channel,
      };
    });
  }, []);

  const hasItem = useCallback(
    (productId: string) => cart.items.some((i) => i.productId === productId),
    [cart.items]
  );

  const replaceCart = useCallback((item: CartItem) => {
    setCart({ items: [item], channel: item.channel });
  }, []);

  const clear = useCallback(() => {
    setCart({ items: [], channel: null });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey(analysisId));
      } catch {
        // ignore
      }
    }
  }, [analysisId]);

  const totalBRL = useMemo(
    () => cart.items.reduce((sum, i) => sum + (i.price || 0), 0),
    [cart.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({ cart, addItem, removeItem, hasItem, replaceCart, clear, totalBRL }),
    [cart, addItem, removeItem, hasItem, replaceCart, clear, totalBRL]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/**
 * Variant that returns null instead of throwing when called outside a
 * provider. Used by leaf components that may be embedded both inside and
 * outside a cart context (e.g. the ProductCard, which renders the new cart
 * button when wrapped in CartProvider and falls back to legacy CTAs when not).
 */
export function useCartSafe(): CartContextValue | null {
  return useContext(CartContext);
}
