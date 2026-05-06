"use client";

import { useI18n } from "@/lib/i18n/client";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/types";

// Compact dropdown switcher. Used in the marketing header. On change writes
// the cookie and hard-reloads so server components re-render.
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <select
      aria-label="Idioma / Language"
      value={locale}
      onChange={(e) => setLocale(e.target.value as typeof LOCALES[number])}
      className="text-[12px] text-terre bg-transparent border border-sable/40 px-2 py-1 hover:border-carbone focus:outline-none focus:border-carbone cursor-pointer"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
