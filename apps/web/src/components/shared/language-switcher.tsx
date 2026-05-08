"use client";

import { useI18n } from "@/lib/i18n/client";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from "@/lib/i18n/types";

/**
 * Inline flag-buttons switcher used in the marketing header. Three flag
 * buttons — Brazil, Mexico, USA — directly clickable. The active locale is
 * outlined; the others are subtle. On click, writes the cookie and reloads
 * so server components re-render with the new dictionary.
 *
 * Replaces the prior <select> dropdown per the May-2026 marketing redesign:
 * flags are more recognizable in a glance and the switcher takes less
 * visual weight in the header.
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Idioma">
      {LOCALES.map((l) => {
        const isActive = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-label={LOCALE_LABELS[l]}
            aria-pressed={isActive}
            title={LOCALE_LABELS[l]}
            className={`text-[18px] leading-none px-1.5 py-1 transition-opacity ${
              isActive ? "opacity-100" : "opacity-40 hover:opacity-80"
            }`}
          >
            {LOCALE_FLAGS[l]}
          </button>
        );
      })}
    </div>
  );
}
