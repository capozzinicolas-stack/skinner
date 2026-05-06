/**
 * Centralized labels for the patient-facing analysis output.
 *
 * Used by:
 * - matcher.ts → builds reasons in human language instead of raw IDs
 * - results-screen.tsx → renders condition names, skin types, etc.
 * - PDF report templates → same translations
 *
 * Multi-locale (May-2026): each label group has both:
 *   1. Backwards-compatible default export (Record<string, string>) returning
 *      the pt-BR map. All existing callers (~10 files) keep working.
 *   2. A `*Localized` export (LocalizedMap) keyed by locale → key. Used by
 *      tr/trList helpers when a non-pt-BR locale needs to render.
 *
 * REVIEW_TRANSLATION_HUMAN: medical/dermatological terminology in es/en
 * was AI-translated. Validate with native dermatology vocabulary before
 * exposing to clients in those locales.
 */

import type { Locale } from "@/lib/i18n/types";

type LocalizedMap = Record<Locale, Record<string, string>>;

// ── pt-BR (source of truth) ─────────────────────────────────────────
const skinTypePtBR: Record<string, string> = {
  oily: "oleosa",
  dry: "seca",
  combination: "mista",
  normal: "normal",
  sensitive: "sensível",
};

const conditionPtBR: Record<string, string> = {
  acne: "acne",
  hyperpigmentation: "manchas",
  aging: "envelhecimento",
  dehydration: "desidratação",
  sensitivity: "sensibilidade",
  rosacea: "rosácea",
  pores: "poros dilatados",
  dullness: "opacidade",
  dark_circles: "olheiras",
  oiliness: "oleosidade",
  sagging: "flacidez",
  acne_vulgaris: "acne",
  melasma: "melasma",
  hiperpigmentacao_pos_inflamatoria: "marcas escuras pós-acne",
  eritema_pos_inflamatorio: "marcas vermelhas pós-acne",
  envelhecimento_cronologico: "envelhecimento natural",
  envelhecimento_fotoinducido: "envelhecimento causado pelo sol",
  dermatite_atopica: "eczema atópico",
  dermatite_seborreica: "dermatite seborreica",
  dermatite_contato: "dermatite de contato",
  dermatite_perioral: "dermatite ao redor da boca",
  desidratacao_cutanea: "desidratação",
  barreira_comprometida: "pele enfraquecida",
  pele_sensivel: "pele sensível",
  poros_dilatados: "poros dilatados",
  oleosidade_excessiva: "oleosidade excessiva",
  olheiras: "olheiras",
  opacidade_textura_irregular: "opacidade e textura irregular",
  keratosis_pilaris: "ceratose pilar",
  milia: "mília",
};

const objectivePtBR: Record<string, string> = {
  "anti-aging": "anti-envelhecimento",
  "anti-acne": "controle de acne",
  radiance: "luminosidade",
  hydration: "hidratação",
  sensitivity: "acalmar a pele",
  "even-tone": "uniformizar o tom",
  firming: "firmeza",
  sagging: "firmeza e lifting",
};

const stepRoutinePtBR: Record<string, string> = {
  cleanser: "limpeza",
  toner: "tônico",
  serum: "sérum",
  moisturizer: "hidratante",
  SPF: "protetor solar",
  treatment: "tratamento",
};

const useTimePtBR: Record<string, string> = {
  am: "manhã",
  pm: "noite",
  both: "manhã e noite",
};

const barrierStatusPtBR: Record<
  string,
  { short: string; explanation: string }
> = {
  healthy: {
    short: "Saudável",
    explanation: "Sua pele está com boa proteção natural.",
  },
  needs_attention: {
    short: "Precisa de atenção",
    explanation:
      "Sua pele está mais reativa que o normal. Vale reforçar a hidratação e evitar produtos agressivos.",
  },
  compromised: {
    short: "Enfraquecida",
    explanation:
      "Sua pele está perdendo água com facilidade e fica mais sensível. Precisa de cuidado para se recuperar.",
  },
};

// ── es ──────────────────────────────────────────────────────────────
const skinTypeEs: Record<string, string> = {
  oily: "grasa",
  dry: "seca",
  combination: "mixta",
  normal: "normal",
  sensitive: "sensible",
};

const conditionEs: Record<string, string> = {
  acne: "acné",
  hyperpigmentation: "manchas",
  aging: "envejecimiento",
  dehydration: "deshidratación",
  sensitivity: "sensibilidad",
  rosacea: "rosácea",
  pores: "poros dilatados",
  dullness: "opacidad",
  dark_circles: "ojeras",
  oiliness: "oleosidad",
  sagging: "flacidez",
  acne_vulgaris: "acné",
  melasma: "melasma",
  hiperpigmentacao_pos_inflamatoria: "marcas oscuras post-acné",
  eritema_pos_inflamatorio: "marcas rojas post-acné",
  envelhecimento_cronologico: "envejecimiento natural",
  envelhecimento_fotoinducido: "envejecimiento por sol",
  dermatite_atopica: "eccema atópico",
  dermatite_seborreica: "dermatitis seborreica",
  dermatite_contato: "dermatitis de contacto",
  dermatite_perioral: "dermatitis perioral",
  desidratacao_cutanea: "deshidratación",
  barreira_comprometida: "barrera debilitada",
  pele_sensivel: "piel sensible",
  poros_dilatados: "poros dilatados",
  oleosidade_excessiva: "exceso de oleosidad",
  olheiras: "ojeras",
  opacidade_textura_irregular: "opacidad y textura irregular",
  keratosis_pilaris: "queratosis pilar",
  milia: "milia",
};

const objectiveEs: Record<string, string> = {
  "anti-aging": "anti-envejecimiento",
  "anti-acne": "control del acné",
  radiance: "luminosidad",
  hydration: "hidratación",
  sensitivity: "calmar la piel",
  "even-tone": "uniformar el tono",
  firming: "firmeza",
  sagging: "firmeza y lifting",
};

const stepRoutineEs: Record<string, string> = {
  cleanser: "limpieza",
  toner: "tónico",
  serum: "serum",
  moisturizer: "hidratante",
  SPF: "protector solar",
  treatment: "tratamiento",
};

const useTimeEs: Record<string, string> = {
  am: "mañana",
  pm: "noche",
  both: "mañana y noche",
};

const barrierStatusEs: Record<
  string,
  { short: string; explanation: string }
> = {
  healthy: {
    short: "Saludable",
    explanation: "Tu piel tiene buena protección natural.",
  },
  needs_attention: {
    short: "Necesita atención",
    explanation:
      "Tu piel está más reactiva de lo normal. Conviene reforzar la hidratación y evitar productos agresivos.",
  },
  compromised: {
    short: "Debilitada",
    explanation:
      "Tu piel está perdiendo agua con facilidad y se vuelve más sensible. Necesita cuidados para recuperarse.",
  },
};

// ── en ──────────────────────────────────────────────────────────────
const skinTypeEn: Record<string, string> = {
  oily: "oily",
  dry: "dry",
  combination: "combination",
  normal: "normal",
  sensitive: "sensitive",
};

const conditionEn: Record<string, string> = {
  acne: "acne",
  hyperpigmentation: "dark spots",
  aging: "aging",
  dehydration: "dehydration",
  sensitivity: "sensitivity",
  rosacea: "rosacea",
  pores: "enlarged pores",
  dullness: "dullness",
  dark_circles: "dark circles",
  oiliness: "oiliness",
  sagging: "sagging",
  acne_vulgaris: "acne",
  melasma: "melasma",
  hiperpigmentacao_pos_inflamatoria: "post-acne dark marks",
  eritema_pos_inflamatorio: "post-acne red marks",
  envelhecimento_cronologico: "chronological aging",
  envelhecimento_fotoinducido: "photo-induced aging",
  dermatite_atopica: "atopic eczema",
  dermatite_seborreica: "seborrheic dermatitis",
  dermatite_contato: "contact dermatitis",
  dermatite_perioral: "perioral dermatitis",
  desidratacao_cutanea: "dehydration",
  barreira_comprometida: "compromised barrier",
  pele_sensivel: "sensitive skin",
  poros_dilatados: "enlarged pores",
  oleosidade_excessiva: "excess oiliness",
  olheiras: "dark circles",
  opacidade_textura_irregular: "dullness and uneven texture",
  keratosis_pilaris: "keratosis pilaris",
  milia: "milia",
};

const objectiveEn: Record<string, string> = {
  "anti-aging": "anti-aging",
  "anti-acne": "acne control",
  radiance: "radiance",
  hydration: "hydration",
  sensitivity: "calm skin",
  "even-tone": "even tone",
  firming: "firmness",
  sagging: "firmness and lifting",
};

const stepRoutineEn: Record<string, string> = {
  cleanser: "cleanser",
  toner: "toner",
  serum: "serum",
  moisturizer: "moisturizer",
  SPF: "sunscreen",
  treatment: "treatment",
};

const useTimeEn: Record<string, string> = {
  am: "morning",
  pm: "night",
  both: "morning and night",
};

const barrierStatusEn: Record<
  string,
  { short: string; explanation: string }
> = {
  healthy: {
    short: "Healthy",
    explanation: "Your skin barrier is well-protected.",
  },
  needs_attention: {
    short: "Needs attention",
    explanation:
      "Your skin is more reactive than usual. Reinforce hydration and avoid aggressive products.",
  },
  compromised: {
    short: "Compromised",
    explanation:
      "Your skin is losing water easily and becoming more sensitive. It needs care to recover.",
  },
};

// ── Backwards-compatible flat exports (pt-BR) ───────────────────────
// All ~10 callers that did `skinTypeLabels[key]` keep working unchanged.
// New code that needs locale-aware lookup uses the *Localized variants
// below + the tr/trList/barrierLabel helpers.
export const skinTypeLabels = skinTypePtBR;
export const conditionLabels = conditionPtBR;
export const objectiveLabels = objectivePtBR;
export const stepRoutineLabels = stepRoutinePtBR;
export const useTimeLabels = useTimePtBR;
export const barrierStatusLabels = barrierStatusPtBR;

// ── Locale-aware exports ────────────────────────────────────────────
export const skinTypeLabelsLocalized: LocalizedMap = {
  "pt-BR": skinTypePtBR,
  es: skinTypeEs,
  en: skinTypeEn,
};

export const conditionLabelsLocalized: LocalizedMap = {
  "pt-BR": conditionPtBR,
  es: conditionEs,
  en: conditionEn,
};

export const objectiveLabelsLocalized: LocalizedMap = {
  "pt-BR": objectivePtBR,
  es: objectiveEs,
  en: objectiveEn,
};

export const stepRoutineLabelsLocalized: LocalizedMap = {
  "pt-BR": stepRoutinePtBR,
  es: stepRoutineEs,
  en: stepRoutineEn,
};

export const useTimeLabelsLocalized: LocalizedMap = {
  "pt-BR": useTimePtBR,
  es: useTimeEs,
  en: useTimeEn,
};

export const barrierStatusLabelsLocalized: Record<
  Locale,
  Record<string, { short: string; explanation: string }>
> = {
  "pt-BR": barrierStatusPtBR,
  es: barrierStatusEs,
  en: barrierStatusEn,
};

const DEFAULT_LOCALE_FALLBACK: Locale = "pt-BR";

/**
 * Translate a single value with locale fallback chain:
 *   requested locale → pt-BR → raw key.
 *
 * Backwards-compat: when called with a flat Record<string,string> map
 * (the legacy signature), the locale param is ignored and the map is
 * looked up directly. All pre-May-2026 callers worked this way and keep
 * working without changes.
 *
 * New code should pass a LocalizedMap + locale.
 */
export function tr(
  map: Record<string, string> | LocalizedMap,
  key: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE_FALLBACK
): string {
  if (!key) return "";
  // Detect LocalizedMap shape — has at least one Locale key with a sub-object.
  const maybeLocalized = map as LocalizedMap;
  if (maybeLocalized["pt-BR"] && typeof maybeLocalized["pt-BR"] === "object") {
    return (
      maybeLocalized[locale]?.[key] ??
      maybeLocalized[DEFAULT_LOCALE_FALLBACK]?.[key] ??
      key
    );
  }
  // Flat map — legacy path.
  const flat = map as Record<string, string>;
  return flat[key] ?? key;
}

/**
 * Translate a list of condition/objective IDs to a comma-separated string.
 */
export function trList(
  map: Record<string, string> | LocalizedMap,
  keys: string[],
  locale: Locale = DEFAULT_LOCALE_FALLBACK
): string {
  return keys.map((k) => tr(map, k, locale)).join(", ");
}

/**
 * Lookup a barrier-status label for a given locale, falling back to pt-BR
 * then to null. Returns the {short, explanation} pair.
 */
export function barrierLabel(
  status: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE_FALLBACK
): { short: string; explanation: string } | null {
  if (!status) return null;
  return (
    barrierStatusLabelsLocalized[locale]?.[status] ??
    barrierStatusLabelsLocalized[DEFAULT_LOCALE_FALLBACK]?.[status] ??
    null
  );
}
