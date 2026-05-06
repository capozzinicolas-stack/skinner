// Single source of truth for supported locales. Adding a new one:
// 1. Add the literal here.
// 2. Create the corresponding dictionary file in lib/i18n/dictionaries/.
// 3. Register it in lib/i18n/dictionaries/index.ts.
// 4. Update DB enums in tenant.updateOrganization, user.updateLocale.
export const LOCALES = ["pt-BR", "es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Portugues",
  es: "Espanol",
  en: "English",
};

// Cookie name we set when the user picks a language in the marketing header
// switcher. Read by the server-side helper to render the right dictionary on
// the next request. NOT httpOnly because the client switcher needs to write it.
export const LOCALE_COOKIE = "skr_locale";
