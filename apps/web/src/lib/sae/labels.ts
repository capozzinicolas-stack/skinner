/**
 * Centralized pt-BR labels for the patient-facing analysis output.
 *
 * Used by:
 * - matcher.ts → builds reasons in human language instead of raw IDs
 * - results-screen.tsx → renders condition names, skin types, etc.
 * - PDF report templates → same translations
 *
 * Adding a new entry here is enough to make it appear translated everywhere.
 * Falls back to the raw key when a translation is missing.
 */

export const skinTypeLabels: Record<string, string> = {
  oily: "oleosa",
  dry: "seca",
  combination: "mista",
  normal: "normal",
  sensitive: "sensível",
};

export const conditionLabels: Record<string, string> = {
  // Simple questionnaire IDs
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

  // Clinical KB names — softened for patient-facing context
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

export const objectiveLabels: Record<string, string> = {
  "anti-aging": "anti-envelhecimento",
  "anti-acne": "controle de acne",
  radiance: "luminosidade",
  hydration: "hidratação",
  sensitivity: "acalmar a pele",
  "even-tone": "uniformizar o tom",
  firming: "firmeza",
  sagging: "firmeza e lifting",
};

export const stepRoutineLabels: Record<string, string> = {
  cleanser: "limpeza",
  toner: "tônico",
  serum: "sérum",
  moisturizer: "hidratante",
  SPF: "protetor solar",
  treatment: "tratamento",
};

export const useTimeLabels: Record<string, string> = {
  am: "manhã",
  pm: "noite",
  both: "manhã e noite",
};

export const barrierStatusLabels: Record<
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

/**
 * Translate a single value with fallback to the raw input.
 * Use this in templates instead of inline lookups so missing keys don't break UI.
 */
export function tr(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "";
  return map[key] ?? key;
}

/**
 * Translate a list of condition/objective IDs to a human-friendly comma-separated string.
 */
export function trList(map: Record<string, string>, keys: string[]): string {
  return keys.map((k) => tr(map, k)).join(", ");
}
