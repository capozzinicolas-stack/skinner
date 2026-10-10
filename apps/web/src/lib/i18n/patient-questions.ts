// Runtime translation of admin-controlled questionnaire texts. Same posture as
// lib/i18n/plan-features.ts: avoid a DB schema migration (no JSONB-per-locale,
// no Question.textEs, etc.) by mapping the pt-BR strings the admin types into
// /admin/formulario to their ES/EN equivalents at render time.
//
// When the admin adds a new question that isn't covered here, ES/EN visitors
// see the original pt-BR text. Acceptable because:
//   1. The default questionnaire is small (~8 questions, ~40 options)
//   2. Admin = Nicolas. New questions in /admin/formulario require a code
//      update anyway to keep the patient experience polished.
//   3. Fall-through to pt-BR means worst case is a single line untranslated,
//      never a broken page.
//
// Migration to real localized DB columns when LATAM/US demand justifies:
//   - PlatformConfig.questionnaireConfig stays the pt-BR source of truth
//   - Add a parallel questionnaireConfigEs / En column OR a JSON map
//   - This helper becomes a fallback for un-translated rows

import type { Locale } from "./types";

// Whole-string lookup. Keys are lowercase + whitespace-normalized pt-BR.
// Includes both the default question texts and the option labels — same map
// because match is by full string, not by category.
const DIRECT: Record<string, { es: string; en: string }> = {
  // Question texts (DEFAULT_QUESTIONS in components/analysis/questionnaire.tsx)
  "qual e o seu sexo biologico?": {
    es: "¿Cual es tu sexo biologico?",
    en: "What is your biological sex?",
  },
  "qual é o seu sexo biologico?": {
    es: "¿Cual es tu sexo biologico?",
    en: "What is your biological sex?",
  },
  "qual é o seu sexo biológico?": {
    es: "¿Cual es tu sexo biologico?",
    en: "What is your biological sex?",
  },
  "como voce descreveria sua pele geralmente?": {
    es: "¿Como describirias tu piel en general?",
    en: "How would you describe your skin in general?",
  },
  "como você descreveria sua pele geralmente?": {
    es: "¿Como describirias tu piel en general?",
    en: "How would you describe your skin in general?",
  },
  "quais sao suas principais preocupacoes?": {
    es: "¿Cuales son tus principales preocupaciones?",
    en: "What are your main concerns?",
  },
  "quais são suas principais preocupações?": {
    es: "¿Cuales son tus principales preocupaciones?",
    en: "What are your main concerns?",
  },
  "qual e seu principal objetivo com o tratamento?": {
    es: "¿Cual es tu principal objetivo con el tratamiento?",
    en: "What is your main goal with the treatment?",
  },
  "qual é seu principal objetivo com o tratamento?": {
    es: "¿Cual es tu principal objetivo con el tratamiento?",
    en: "What is your main goal with the treatment?",
  },
  "voce tem alguma alergia ou sensibilidade conhecida?": {
    es: "¿Tienes alguna alergia o sensibilidad conocida?",
    en: "Do you have any known allergies or sensitivities?",
  },
  "você tem alguma alergia ou sensibilidade conhecida?": {
    es: "¿Tienes alguna alergia o sensibilidad conocida?",
    en: "Do you have any known allergies or sensitivities?",
  },
  "qual e a sua faixa etaria?": {
    es: "¿Cual es tu rango de edad?",
    en: "What is your age range?",
  },
  "qual é a sua faixa etária?": {
    es: "¿Cual es tu rango de edad?",
    en: "What is your age range?",
  },
  "com que frequencia voce usa protetor solar?": {
    es: "¿Con que frecuencia usas protector solar?",
    en: "How often do you use sunscreen?",
  },
  "com que frequência você usa protetor solar?": {
    es: "¿Con que frecuencia usas protector solar?",
    en: "How often do you use sunscreen?",
  },
  "esta gravida ou amamentando?": {
    es: "¿Estas embarazada o amamantando?",
    en: "Are you pregnant or nursing?",
  },
  "está grávida ou amamentando?": {
    es: "¿Estas embarazada o amamantando?",
    en: "Are you pregnant or nursing?",
  },

  // Option labels
  feminino: { es: "Femenino", en: "Female" },
  masculino: { es: "Masculino", en: "Male" },
  oleosa: { es: "Grasa", en: "Oily" },
  seca: { es: "Seca", en: "Dry" },
  mista: { es: "Mixta", en: "Combination" },
  normal: { es: "Normal", en: "Normal" },
  sensivel: { es: "Sensible", en: "Sensitive" },
  sensível: { es: "Sensible", en: "Sensitive" },
  "acne e espinhas": { es: "Acne y granos", en: "Acne and pimples" },
  "manchas e hiperpigmentacao": {
    es: "Manchas e hiperpigmentacion",
    en: "Spots and hyperpigmentation",
  },
  "manchas e hiperpigmentação": {
    es: "Manchas e hiperpigmentacion",
    en: "Spots and hyperpigmentation",
  },
  "rugas e linhas finas": {
    es: "Arrugas y lineas finas",
    en: "Wrinkles and fine lines",
  },
  "desidratacao e ressecamento": {
    es: "Deshidratacion y resequedad",
    en: "Dehydration and dryness",
  },
  "desidratação e ressecamento": {
    es: "Deshidratacion y resequedad",
    en: "Dehydration and dryness",
  },
  "vermelhidao e sensibilidade": {
    es: "Rojeces y sensibilidad",
    en: "Redness and sensitivity",
  },
  "vermelhidão e sensibilidade": {
    es: "Rojeces y sensibilidad",
    en: "Redness and sensitivity",
  },
  rosacea: { es: "Rosacea", en: "Rosacea" },
  rosácea: { es: "Rosacea", en: "Rosacea" },
  "poros dilatados": { es: "Poros dilatados", en: "Enlarged pores" },
  "pele opaca e sem brilho": {
    es: "Piel opaca y sin brillo",
    en: "Dull skin",
  },
  olheiras: { es: "Ojeras", en: "Dark circles" },
  "oleosidade excessiva": { es: "Exceso de grasa", en: "Excess oiliness" },
  flacidez: { es: "Flacidez", en: "Sagging" },
  "anti-envelhecimento": { es: "Anti-edad", en: "Anti-aging" },
  "controle de acne": { es: "Control de acne", en: "Acne control" },
  "luminosidade e brilho": { es: "Luminosidad y brillo", en: "Radiance" },
  "hidratacao profunda": { es: "Hidratacion profunda", en: "Deep hydration" },
  "hidratação profunda": { es: "Hidratacion profunda", en: "Deep hydration" },
  "acalmar a pele": { es: "Calmar la piel", en: "Soothe the skin" },
  "uniformizar o tom": { es: "Uniformar el tono", en: "Even out skin tone" },
  "18 a 24 anos": { es: "18 a 24 anos", en: "18 to 24 years" },
  "25 a 34 anos": { es: "25 a 34 anos", en: "25 to 34 years" },
  "35 a 44 anos": { es: "35 a 44 anos", en: "35 to 44 years" },
  "45 a 54 anos": { es: "45 a 54 anos", en: "45 to 54 years" },
  "55 anos ou mais": { es: "55 anos o mas", en: "55 years or more" },
  "todos os dias": { es: "Todos los dias", en: "Every day" },
  "as vezes": { es: "A veces", en: "Sometimes" },
  "às vezes": { es: "A veces", en: "Sometimes" },
  raramente: { es: "Raramente", en: "Rarely" },
  nunca: { es: "Nunca", en: "Never" },
  nao: { es: "No", en: "No" },
  não: { es: "No", en: "No" },
  "sim, estou gravida": { es: "Si, estoy embarazada", en: "Yes, pregnant" },
  "sim, estou grávida": { es: "Si, estoy embarazada", en: "Yes, pregnant" },
  "sim, estou amamentando": { es: "Si, estoy amamantando", en: "Yes, nursing" },

  // Procedure-clinic questionnaire (CLINIC_DEFAULT_QUESTIONS, Oct-2026)
  "como você percebe hoje a aparência da sua pele?": {
    es: "¿Cómo percibes hoy la apariencia de tu piel?",
    en: "How do you perceive your skin's appearance today?",
  },
  "com linhas e sinais de envelhecimento": { es: "Con líneas y signos de envejecimiento", en: "With lines and signs of aging" },
  "com manchas ou tom irregular": { es: "Con manchas o tono irregular", en: "With spots or uneven tone" },
  "com perda de firmeza ou flacidez": { es: "Con pérdida de firmeza o flacidez", en: "With loss of firmness or sagging" },
  "com textura irregular ou marcas": { es: "Con textura irregular o marcas", en: "With uneven texture or marks" },
  "com aparência cansada, opaca ou sem viço": { es: "Con aspecto cansado, opaco o sin brillo", en: "Tired, dull or lacking glow" },
  "com acne ou marcas de acne": { es: "Con acné o marcas de acné", en: "With acne or acne marks" },
  "gosto da minha pele, mas quero prevenir o envelhecimento": {
    es: "Me gusta mi piel, pero quiero prevenir el envejecimiento",
    en: "I like my skin, but I want to prevent aging",
  },
  "quais são hoje as 3 características da sua pele que mais incomodam você?": {
    es: "¿Cuáles son hoy las 3 características de tu piel que más te molestan?",
    en: "Which 3 characteristics of your skin bother you the most today?",
  },
  "rugas e linhas de expressão": { es: "Arrugas y líneas de expresión", en: "Wrinkles and expression lines" },
  "manchas e tom irregular": { es: "Manchas y tono irregular", en: "Spots and uneven tone" },
  "flacidez e perda de firmeza": { es: "Flacidez y pérdida de firmeza", en: "Sagging and loss of firmness" },
  "textura irregular e poros aparentes": { es: "Textura irregular y poros visibles", en: "Uneven texture and visible pores" },
  "cicatrizes ou marcas de acne": { es: "Cicatrices o marcas de acné", en: "Acne scars or marks" },
  "acne ou imperfeições recorrentes": { es: "Acné o imperfecciones recurrentes", en: "Recurring acne or blemishes" },
  "olheiras e aparência cansada": { es: "Ojeras y aspecto cansado", en: "Dark circles and tired look" },
  "pele opaca ou sem viço": { es: "Piel opaca o sin brillo", en: "Dull skin lacking glow" },
  "vermelhidão ou sensibilidade aparente": { es: "Enrojecimiento o sensibilidad visible", en: "Visible redness or sensitivity" },
  "quero prevenir os sinais de envelhecimento": { es: "Quiero prevenir los signos de envejecimiento", en: "I want to prevent signs of aging" },
  "e quanto ao comportamento da sua pele?": { es: "¿Y cómo se comporta tu piel?", en: "And how does your skin behave?" },
};

/**
 * Translate an admin-controlled questionnaire string (question text OR option
 * label) into the patient's locale. Falls back to the original pt-BR text when
 * no translation is found, so the flow never breaks for new admin-added
 * questions.
 */
export function translateQuestionText(text: string, locale: Locale): string {
  if (locale === "pt-BR") return text;
  const normalized = text.trim().toLowerCase();
  const m = DIRECT[normalized];
  if (m) return m[locale];
  return text;
}
