// Server-side locale resolution. Use in Server Components and route handlers.
//
// Resolution priority (first non-empty wins):
//   1. The `skr_locale` cookie (set by the in-page language switcher).
//   2. `Accept-Language` header (browser preference, first matching locale).
//   3. DEFAULT_LOCALE (pt-BR).
//
// We deliberately ignore IP geolocation — it's noisy (VPN, travel, browser
// language mismatch) and produces worse UX than a sticky cookie + browser hint.

import { cookies, headers } from "next/headers";
import { LOCALES, LOCALE_COOKIE, DEFAULT_LOCALE } from "./types";
import type { Locale } from "./types";
import { getDictionary } from "./dictionaries";

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  // Split on commas, strip q-values, normalize, take first match.
  const candidates = header
    .split(",")
    .map((s) => s.split(";")[0]?.trim().toLowerCase() ?? "")
    .filter(Boolean);
  for (const c of candidates) {
    if (c.startsWith("pt")) return "pt-BR";
    if (c.startsWith("es")) return "es";
    if (c.startsWith("en")) return "en";
  }
  return null;
}

export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }
  const headersList = await headers();
  const fromBrowser = parseAcceptLanguage(headersList.get("accept-language"));
  if (fromBrowser) return fromBrowser;
  return DEFAULT_LOCALE;
}

export async function getServerDictionary() {
  const locale = await resolveLocale();
  return { locale, t: getDictionary(locale) };
}
