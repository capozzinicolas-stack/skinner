// Questionnaire definitions shared by the patient flow (client) and the
// tRPC routers (server). Plain module on purpose: constants imported from a
// "use client" file become client references on the server, so the defaults
// live here and components/analysis/questionnaire.tsx re-exports them.

export type DynamicQuestion = {
  id: string;
  text: string;
  type: "single" | "multi" | "text";
  required: boolean;
  enabled: boolean;
  maxSelect?: number;
  options?: { value: string; label: string }[];
  order: number;
  showCondition?: { questionId: string; value: string };
};

// Core question IDs that must always exist for the analysis pipeline
export const CORE_QUESTION_IDS = ["sex", "skin_type", "concerns", "primary_objective"];

// Default hardcoded questions — used as fallback when PlatformConfig has no data
export const DEFAULT_QUESTIONS: DynamicQuestion[] = [
  {
    id: "sex",
    text: "Qual e o seu sexo biologico?",
    type: "single",
    required: true,
    enabled: true,
    order: 0,
    options: [
      { value: "female", label: "Feminino" },
      { value: "male", label: "Masculino" },
    ],
  },
  {
    id: "skin_type",
    text: "Como voce descreveria sua pele geralmente?",
    type: "single",
    required: true,
    enabled: true,
    order: 1,
    options: [
      { value: "oily", label: "Oleosa" },
      { value: "dry", label: "Seca" },
      { value: "combination", label: "Mista" },
      { value: "normal", label: "Normal" },
      { value: "sensitive", label: "Sensivel" },
    ],
  },
  {
    id: "concerns",
    text: "Quais sao suas principais preocupacoes?",
    type: "multi",
    required: true,
    enabled: true,
    order: 2,
    maxSelect: 3,
    options: [
      { value: "acne", label: "Acne e espinhas" },
      { value: "hyperpigmentation", label: "Manchas e hiperpigmentacao" },
      { value: "aging", label: "Rugas e linhas finas" },
      { value: "dehydration", label: "Desidratacao e ressecamento" },
      { value: "sensitivity", label: "Vermelhidao e sensibilidade" },
      { value: "rosacea", label: "Rosacea" },
      { value: "pores", label: "Poros dilatados" },
      { value: "dullness", label: "Pele opaca e sem brilho" },
      { value: "dark_circles", label: "Olheiras" },
      { value: "oiliness", label: "Oleosidade excessiva" },
    ],
  },
  {
    id: "primary_objective",
    text: "Qual e seu principal objetivo com o tratamento?",
    type: "single",
    required: true,
    enabled: true,
    order: 3,
    options: [
      { value: "anti-aging", label: "Anti-envelhecimento" },
      { value: "anti-acne", label: "Controle de acne" },
      { value: "radiance", label: "Luminosidade e brilho" },
      { value: "hydration", label: "Hidratacao profunda" },
      { value: "sensitivity", label: "Acalmar a pele" },
      { value: "even-tone", label: "Uniformizar o tom" },
    ],
  },
  {
    id: "allergies",
    text: "Voce tem alguma alergia ou sensibilidade conhecida?",
    type: "text",
    required: false,
    enabled: true,
    order: 4,
  },
  {
    id: "age_range",
    text: "Qual e a sua faixa etaria?",
    type: "single",
    required: true,
    enabled: true,
    order: 5,
    options: [
      { value: "18-24", label: "18 a 24 anos" },
      { value: "25-34", label: "25 a 34 anos" },
      { value: "35-44", label: "35 a 44 anos" },
      { value: "45-54", label: "45 a 54 anos" },
      { value: "55+", label: "55 anos ou mais" },
    ],
  },
  {
    id: "sunscreen_frequency",
    text: "Com que frequencia voce usa protetor solar?",
    type: "single",
    required: false,
    enabled: true,
    order: 6,
    options: [
      { value: "daily", label: "Todos os dias" },
      { value: "sometimes", label: "As vezes" },
      { value: "rarely", label: "Raramente" },
      { value: "never", label: "Nunca" },
    ],
  },
  {
    id: "pregnant_or_nursing",
    text: "Esta gravida ou amamentando?",
    type: "single",
    required: false,
    enabled: true,
    order: 7,
    showCondition: { questionId: "sex", value: "female" },
    options: [
      { value: "no", label: "Nao" },
      { value: "pregnant", label: "Sim, estou gravida" },
      { value: "nursing", label: "Sim, estou amamentando" },
    ],
  },
];

// Questionnaire for segment "aesthetic_clinic" (Oct-2026). Order follows the
// clinic review: (1) perceived appearance, (2) top-3 bothering
// characteristics, (3) skin behavior. Core IDs are kept (primary_objective,
// concerns, skin_type, sex) so the analysis pipeline, matcher and Claude
// prompt keep working unchanged. Option values reuse the objective/condition
// IDs the matcher understands. Admin can override via /admin/formulario
// (PlatformConfig.questionnaireConfigClinic).
export const CLINIC_DEFAULT_QUESTIONS: DynamicQuestion[] = [
  {
    id: "primary_objective",
    text: "Como você percebe hoje a aparência da sua pele?",
    type: "single",
    required: true,
    enabled: true,
    order: 0,
    options: [
      { value: "anti-aging", label: "Com linhas e sinais de envelhecimento" },
      { value: "even-tone", label: "Com manchas ou tom irregular" },
      { value: "sagging", label: "Com perda de firmeza ou flacidez" },
      { value: "texture", label: "Com textura irregular ou marcas" },
      { value: "radiance", label: "Com aparência cansada, opaca ou sem viço" },
      { value: "anti-acne", label: "Com acne ou marcas de acne" },
      { value: "prevention", label: "Gosto da minha pele, mas quero prevenir o envelhecimento" },
    ],
  },
  {
    id: "concerns",
    text: "Quais são hoje as 3 características da sua pele que mais incomodam você?",
    type: "multi",
    required: true,
    enabled: true,
    order: 1,
    maxSelect: 3,
    options: [
      { value: "aging", label: "Rugas e linhas de expressão" },
      { value: "hyperpigmentation", label: "Manchas e tom irregular" },
      { value: "sagging", label: "Flacidez e perda de firmeza" },
      { value: "texture", label: "Textura irregular e poros aparentes" },
      { value: "acne_scars", label: "Cicatrizes ou marcas de acne" },
      { value: "acne", label: "Acne ou imperfeições recorrentes" },
      { value: "dark_circles", label: "Olheiras e aparência cansada" },
      { value: "dullness", label: "Pele opaca ou sem viço" },
      { value: "sensitivity", label: "Vermelhidão ou sensibilidade aparente" },
      { value: "prevention", label: "Quero prevenir os sinais de envelhecimento" },
    ],
  },
  {
    id: "skin_type",
    text: "E quanto ao comportamento da sua pele?",
    type: "single",
    required: true,
    enabled: true,
    order: 2,
    options: [
      { value: "oily", label: "Oleosa" },
      { value: "dry", label: "Seca" },
      { value: "combination", label: "Mista" },
      { value: "normal", label: "Normal" },
      { value: "sensitive", label: "Sensível" },
    ],
  },
  {
    id: "sex",
    text: "Qual é o seu sexo biológico?",
    type: "single",
    required: true,
    enabled: true,
    order: 3,
    options: [
      { value: "female", label: "Feminino" },
      { value: "male", label: "Masculino" },
    ],
  },
  {
    id: "age_range",
    text: "Qual é a sua faixa etária?",
    type: "single",
    required: true,
    enabled: true,
    order: 4,
    options: [
      { value: "18-24", label: "18 a 24 anos" },
      { value: "25-34", label: "25 a 34 anos" },
      { value: "35-44", label: "35 a 44 anos" },
      { value: "45-54", label: "45 a 54 anos" },
      { value: "55+", label: "55 anos ou mais" },
    ],
  },
  {
    id: "allergies",
    text: "Você tem alguma alergia ou sensibilidade conhecida?",
    type: "text",
    required: false,
    enabled: true,
    order: 5,
  },
  {
    id: "pregnant_or_nursing",
    text: "Está grávida ou amamentando?",
    type: "single",
    required: false,
    enabled: true,
    order: 6,
    showCondition: { questionId: "sex", value: "female" },
    options: [
      { value: "no", label: "Não" },
      { value: "pregnant", label: "Sim, estou grávida" },
      { value: "nursing", label: "Sim, estou amamentando" },
    ],
  },
];
