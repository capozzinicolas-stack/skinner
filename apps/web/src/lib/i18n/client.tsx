"use client";

// Client-side locale context + switcher hook. The provider is hydrated by
// the server with the resolved locale so there's no flash of pt-BR before
// the cookie is read.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { LOCALE_COOKIE } from "./types";
import type { Locale } from "./types";
import { getDictionary, type Dictionary } from "./dictionaries";

type Ctx = {
  locale: Locale;
  t: Dictionary;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = useMemo(() => getDictionary(locale), [locale]);
  const setLocale = useCallback((l: Locale) => {
    // 1-year cookie, root path, lax samesite. No `secure` flag because dev
    // runs on http://localhost; prod gets it implicitly via HSTS at the
    // edge. NOT httpOnly because we need to read it in client React for the
    // language switcher.
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(l)}; path=/; max-age=31536000; samesite=lax`;
    // Hard reload — server components re-render with the new cookie.
    window.location.reload();
  }, []);
  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside an <I18nProvider>");
  }
  return ctx;
}
