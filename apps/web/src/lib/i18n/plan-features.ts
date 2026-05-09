// Runtime translation of admin-controlled plan strings (features list +
// CTA text + features-cell CTAs) for the marketing /planos page.
//
// Why runtime: Plan.features and Plan.ctaText are stored in the DB as
// pt-BR strings (admin-controlled via /admin/planos). To avoid a schema
// migration just to add localized columns, we translate at display time
// using pattern matching (handles "Até N análises" with variable N) and
// direct map lookup (handles fixed strings).
//
// Trade-off: when the admin adds a new feature line in /admin/planos
// that isn't covered here, ES/EN visitors see the original pt-BR string.
// Acceptable because:
//   1. Skinner has 3 plans + 6-8 features each — small surface
//   2. Admin = Nicolas. New features require a code update anyway to
//      keep the marketing site polished
//   3. Fall-through to pt-BR (instead of empty string or error) means
//      worst case is a slight inconsistency, never a broken page
//
// Migration to real localized DB columns when LATAM/US demand justifies:
//   - Add Plan.featuresEs, Plan.featuresEn, Plan.nameEs, Plan.nameEn,
//     Plan.ctaTextEs, Plan.ctaTextEn (or single JSON column with all locales)
//   - Admin /planos UI: tabs per locale on the features field
//   - This helper becomes a fallback for un-translated rows

import type { Locale } from "./types";

// Direct (whole-string) map. Keys are pt-BR with normalized whitespace.
// Match is case-insensitive after lowercasing both sides.
const DIRECT_FEATURES: Record<string, { es: string; en: string }> = {
  "1 usuario admin": { es: "1 usuario admin", en: "1 admin user" },
  "5 usuarios": { es: "5 usuarios", en: "5 users" },
  "10 usuarios": { es: "10 usuarios", en: "10 users" },
  "relatorio pdf": { es: "Reporte PDF", en: "PDF report" },
  "marca branca basica": { es: "Marca blanca básica", en: "Basic white-label" },
  "marca branca básica": { es: "Marca blanca básica", en: "Basic white-label" },
  "marca branca completa": { es: "Marca blanca completa", en: "Full white-label" },
  "suporte por email": { es: "Soporte por email", en: "Email support" },
  "suporte via e-mail e whatsapp": { es: "Soporte vía email y WhatsApp", en: "Email and WhatsApp support" },
  "suporte via csm": { es: "Soporte vía CSM", en: "CSM support" },
  "painel de atribuição": { es: "Panel de atribución", en: "Attribution dashboard" },
  "painel de atribuicao": { es: "Panel de atribución", en: "Attribution dashboard" },
  "módulo de integração ativo": { es: "Módulo de integración activo", en: "Active integration module" },
  "modulo de integracao ativo": { es: "Módulo de integración activo", en: "Active integration module" },
  "api rest + webhooks": { es: "API REST + Webhooks", en: "REST API + Webhooks" },
  "integração com erp/crm": { es: "Integración con ERP/CRM", en: "ERP/CRM integration" },
  "integracao com erp/crm": { es: "Integración con ERP/CRM", en: "ERP/CRM integration" },
};

// Pattern-based features (variable numbers). Order matters — first match wins.
type Pattern = {
  re: RegExp;
  es: (m: RegExpMatchArray) => string;
  en: (m: RegExpMatchArray) => string;
};

const PATTERN_FEATURES: Pattern[] = [
  {
    // "Até 200 análises/mês" / "Ate 200 analises/mes"
    re: /^at[eé]\s+([\d.]+)\s+an[aá]lises\s*\/\s*m[eê]s$/i,
    es: (m) => `Hasta ${m[1]} análisis/mes`,
    en: (m) => `Up to ${m[1]} analyses/mo`,
  },
  {
    // "Comissão 5% sobre venda atribuída" / variants without accents
    re: /^comiss(?:ão|ao)\s+([\d.,]+%)\s+sobre\s+venda\s+atribu[ií]da$/i,
    es: (m) => `Comisión ${m[1]} sobre venta atribuida`,
    en: (m) => `${m[1]} commission on attributed sales`,
  },
  {
    // "N usuário/usuários" — fallback if not in direct map
    re: /^(\d+)\s+usu[aá]rios?(?:\s+admin)?$/i,
    es: (m) => `${m[1]} ${parseInt(m[1], 10) === 1 ? "usuario" : "usuarios"}`,
    en: (m) => `${m[1]} ${parseInt(m[1], 10) === 1 ? "user" : "users"}`,
  },
];

/**
 * Translate a single plan feature string. Falls back to the original
 * pt-BR text when no translation is found, so the page never breaks
 * for new admin-added features.
 */
export function translatePlanFeature(text: string, locale: Locale): string {
  if (locale === "pt-BR") return text;

  const normalized = text.trim().toLowerCase();

  // Direct lookup first.
  const direct = DIRECT_FEATURES[normalized];
  if (direct) return direct[locale];

  // Pattern fallback.
  for (const p of PATTERN_FEATURES) {
    const m = text.trim().match(p.re);
    if (m) return locale === "es" ? p.es(m) : p.en(m);
  }

  // Unknown → return original (visitor sees pt-BR for that one line).
  return text;
}

// CTA text from Plan.ctaText. Common values plus typo-tolerant entries
// for "Increver-se" (a real typo we've seen in the DB).
const CTA_MAP: Record<string, { es: string; en: string }> = {
  "inscrever-se": { es: "Suscribirse", en: "Subscribe" },
  "increver-se": { es: "Suscribirse", en: "Subscribe" },
  "inscrever": { es: "Suscribirse", en: "Subscribe" },
  "falar com vendas": { es: "Hablar con ventas", en: "Talk to sales" },
  "fale com vendas": { es: "Hablar con ventas", en: "Talk to sales" },
  "contato": { es: "Contacto", en: "Contact" },
};

export function translatePlanCta(text: string, locale: Locale): string {
  if (locale === "pt-BR") return text;
  const normalized = text.trim().toLowerCase();
  const m = CTA_MAP[normalized];
  if (m) return m[locale];
  return text;
}
