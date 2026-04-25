"use client";

import { useEffect, useState } from "react";

export type QuestionnaireAnswers = Record<string, string | string[]>;

export type QuestionnaireConfig = {
  questionAllergiesEnabled?: boolean;
  questionSunscreenEnabled?: boolean;
  questionPregnantEnabled?: boolean;
  photoOnlyMode?: boolean;
};

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

function computeDefaults(questions: DynamicQuestion[]): QuestionnaireAnswers {
  const defaults: QuestionnaireAnswers = {};
  for (const q of questions) {
    if (q.type === "multi") {
      defaults[q.id] = [];
    } else if (q.type === "single" && q.options && q.options.length > 0) {
      defaults[q.id] = "";
    } else {
      defaults[q.id] = "";
    }
  }
  return defaults;
}

// Safety bypass: if Questionnaire is rendered with photoOnlyMode, call onComplete
// immediately with defaults.
function PhotoOnlyBypass({
  onComplete,
  questions,
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
  questions: DynamicQuestion[];
}) {
  useEffect(() => {
    const defaults = computeDefaults(questions);
    // Set sensible defaults for core fields
    if (!defaults.sex) defaults.sex = "female";
    if (!defaults.skin_type) defaults.skin_type = "normal";
    if (!defaults.primary_objective) defaults.primary_objective = "hydration";
    if (!defaults.age_range) defaults.age_range = "25-34";
    if (!defaults.sunscreen_frequency) defaults.sunscreen_frequency = "sometimes";
    if (!defaults.pregnant_or_nursing) defaults.pregnant_or_nursing = "no";
    onComplete(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto px-4 text-center py-12">
      <p className="text-pierre font-light text-sm">Preparando analise...</p>
    </div>
  );
}

export function Questionnaire({
  onComplete,
  config,
  questions: externalQuestions,
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
  config?: QuestionnaireConfig;
  questions?: DynamicQuestion[];
}) {
  const allQuestions = externalQuestions ?? DEFAULT_QUESTIONS;

  if (config?.photoOnlyMode) {
    return <PhotoOnlyBypass onComplete={onComplete} questions={allQuestions} />;
  }

  return <QuestionnaireInner onComplete={onComplete} config={config} allQuestions={allQuestions} />;
}

function QuestionnaireInner({
  onComplete,
  config,
  allQuestions,
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
  config?: QuestionnaireConfig;
  allQuestions: DynamicQuestion[];
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});

  // Filter and sort questions
  const questions = allQuestions
    .filter((q) => {
      if (!q.enabled) return false;
      // Legacy tenant config toggles
      if (q.id === "allergies" && config?.questionAllergiesEnabled === false) return false;
      if (q.id === "sunscreen_frequency" && config?.questionSunscreenEnabled === false) return false;
      if (q.id === "pregnant_or_nursing" && config?.questionPregnantEnabled === false) return false;
      // Generic showCondition
      if (q.showCondition) {
        const condValue = answers[q.showCondition.questionId];
        if (condValue !== q.showCondition.value) return false;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const question = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const currentAnswer = question ? answers[question.id] : undefined;
  const canProceed = question?.required
    ? question.type === "multi"
      ? (currentAnswer as string[] | undefined)?.length
      : !!currentAnswer
    : true;

  function selectSingle(value: string) {
    setAnswers((a) => ({ ...a, [question.id]: value }));
  }

  function toggleMulti(value: string) {
    const current = (answers[question.id] as string[] | undefined) ?? [];
    const maxSelect = question.maxSelect ?? 99;
    if (current.includes(value)) {
      setAnswers((a) => ({ ...a, [question.id]: current.filter((v) => v !== value) }));
    } else if (current.length < maxSelect) {
      setAnswers((a) => ({ ...a, [question.id]: [...current, value] }));
    }
  }

  function handleNext() {
    if (isLast) {
      // Merge answers with defaults for disabled/skipped questions
      const defaults = computeDefaults(allQuestions);
      const merged: QuestionnaireAnswers = { ...defaults, ...answers };
      onComplete(merged);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  if (!question) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-pierre font-light mb-2">
          <span>Pergunta {currentIdx + 1} de {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-0.5 bg-sable/30 overflow-hidden">
          <div
            className="h-full bg-carbone transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="font-serif text-xl text-carbone mb-6">{question.text}</h2>

      {/* Options */}
      {question.type === "single" && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectSingle(opt.value)}
              className={`w-full text-left px-5 py-3.5 border text-sm font-light transition-all ${
                currentAnswer === opt.value
                  ? "border-carbone bg-ivoire text-carbone"
                  : "border-sable/30 text-pierre hover:border-sable hover:text-carbone"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === "multi" && question.options && (
        <div className="space-y-2">
          <p className="text-xs text-pierre font-light mb-3">
            Selecione ate {question.maxSelect ?? 3} opcoes
          </p>
          {question.options.map((opt) => {
            const selected = ((currentAnswer as string[]) ?? []).includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleMulti(opt.value)}
                className={`w-full text-left px-5 py-3.5 border text-sm font-light transition-all ${
                  selected
                    ? "border-carbone bg-ivoire text-carbone"
                    : "border-sable/30 text-pierre hover:border-sable hover:text-carbone"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          value={(currentAnswer as string) ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
          rows={3}
          placeholder="Digite aqui (opcional)..."
          className="w-full px-5 py-3.5 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {currentIdx > 0 && (
          <button
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="px-6 py-3 border border-sable/40 text-sm font-light text-terre hover:bg-ivoire transition-colors"
          >
            Voltar
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed && question.required}
          className="flex-1 px-6 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isLast ? "Ver resultados" : question.required ? "Proxima" : "Pular"}
        </button>
      </div>
    </div>
  );
}
