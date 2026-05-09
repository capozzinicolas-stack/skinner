// Display-only currency conversion for the marketing /planos page.
//
// Plans are stored and CHARGED in BRL (Tenant.customMonthlyPriceBRL,
// Plan.monthlyPriceBRL, Stripe Prices in BRL). This helper converts
// the display value to the visitor's locale currency so a Mexican or
// US visitor sees an approximation in their currency before clicking
// checkout.
//
// IMPORTANT: this is NOT a real multi-currency system. Stripe always
// charges BRL. The visitor's bank handles the conversion at THEIR FX
// rate (usually with a small spread). The disclaimer field below makes
// this transparent so we don't show a price one currency and charge
// another silently.
//
// When we move to real multi-currency Stripe Prices (Plan B in the
// May-2026 sprint discussion), this helper extends to take a `currency`
// param instead of always converting from BRL — the display contract
// stays the same so JSX doesn't change.
//
// Rates last updated: 2026-05-08. Conservative side (slightly higher
// MXN/USD per BRL) so the visitor isn't surprised when the actual
// charge clears their card. Update when off by >5% from market.

import type { Locale } from "./types";

type CurrencyConfig = {
  code: string;       // ISO 4217 (e.g. "USD")
  symbol: string;     // Display symbol (e.g. "MX$")
  rate: number;       // 1 BRL × rate = amount in target currency
  fmtLocale: string;  // Intl.NumberFormat locale (e.g. "es-MX")
};

const FX_FROM_BRL: Record<Locale, CurrencyConfig | null> = {
  "pt-BR": null, // Native — no conversion, show R$ as-is.
  es: { code: "MXN", symbol: "MX$", rate: 3.3, fmtLocale: "es-MX" },
  en: { code: "USD", symbol: "$", rate: 0.18, fmtLocale: "en-US" },
};

export type FormattedPrice = {
  // Primary string shown in the visitor's locale currency
  // (e.g. "R$ 1.490", "MX$ 4.917", "$ 268").
  primary: string;
  // Secondary disclaimer line — only present when locale differs from
  // BRL. Tells the visitor the actual charge currency.
  // (e.g. "Cobrado em R$ 1.490 · Sua fatura pode variar pelo câmbio do banco")
  // Returns null for pt-BR so the JSX skips the disclaimer line.
  disclaimer: string | null;
};

/**
 * Format a BRL amount for display in the given locale.
 *
 * pt-BR: returns plain "R$ 1.490" without disclaimer.
 * es:    converts to MXN, returns "MX$ 4.917" + "Cobrado en R$ 1.490 ..."
 * en:    converts to USD, returns "$ 268" + "Billed in R$ 1,490 ..."
 *
 * When the amount is 0 or negative, returns "—" (used for "no setup fee").
 */
export function formatPrice(amountBRL: number, locale: Locale): FormattedPrice {
  if (amountBRL <= 0) {
    return { primary: "—", disclaimer: null };
  }

  // pt-BR — native, no conversion.
  if (locale === "pt-BR") {
    return {
      primary: `R$ ${amountBRL.toLocaleString("pt-BR")}`,
      disclaimer: null,
    };
  }

  const cfg = FX_FROM_BRL[locale];
  if (!cfg) {
    // Fallback to BRL if config missing (shouldn't happen with current locales).
    return {
      primary: `R$ ${amountBRL.toLocaleString("pt-BR")}`,
      disclaimer: null,
    };
  }

  const converted = Math.round(amountBRL * cfg.rate);
  const primaryFormatted = new Intl.NumberFormat(cfg.fmtLocale, {
    maximumFractionDigits: 0,
  }).format(converted);
  const brlFormatted = amountBRL.toLocaleString("pt-BR");

  // Disclaimer copy per locale. Plain string concatenation rather than
  // string keys in the dictionary — currency is a localization concern
  // tightly coupled to this helper, not to general copy translation.
  const disclaimer =
    locale === "es"
      ? `Cobrado en R$ ${brlFormatted} · El monto en MXN puede variar por el cambio de tu banco`
      : `Billed in R$ ${brlFormatted} · USD amount may vary with your bank's exchange rate`;

  return {
    primary: `${cfg.symbol} ${primaryFormatted}`,
    disclaimer,
  };
}
