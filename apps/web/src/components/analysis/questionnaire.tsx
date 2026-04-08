"use client";

import { useEffect, useState } from "react";

export type QuestionnaireAnswers = {
  skin_type: string;
  concerns: string[];
  primary_objective: string;
  allergies: string;
  age_range: string;
  sunscreen_frequency: string;
  pregnant_or_nursing: string;
};

export type QuestionnaireConfig = {
  questionAllergiesEnabled?: boolean;
  questionSunscreenEnabled?: boolean;
  questionPregnantEnabled?: boolean;
  photoOnlyMode?: boolean;
};

type Question = {
  id: keyof QuestionnaireAnswers;
  text: string;
  type: "single" | "multi" | "text";
  required: boolean;
  options?: { value: string; label: string }[];
  maxSelect?: number;
};

const ALL_QUESTIONS: Question[] = [
  {
    id: "skin_type",
    text: "Como voce descreveria sua pele geralmente?",
    type: "single",
    required: true,
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
  },
  {
    id: "age_range",
    text: "Qual e a sua faixa etaria?",
    type: "single",
    required: true,
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
    options: [
      { value: "no", label: "Nao" },
      { value: "pregnant", label: "Sim, estou gravida" },
      { value: "nursing", label: "Sim, estou amamentando" },
    ],
  },
];

// Default answers used when photoOnlyMode bypasses the questionnaire
const DEFAULT_ANSWERS: QuestionnaireAnswers = {
  skin_type: "normal",
  concerns: [],
  primary_objective: "hydration",
  allergies: "",
  age_range: "25-34",
  sunscreen_frequency: "sometimes",
  pregnant_or_nursing: "no",
};

// Safety bypass: if Questionnaire is rendered with photoOnlyMode, call onComplete
// immediately with defaults (the B2C page normally avoids this step entirely, but
// this ensures robustness if the component is used directly).
function PhotoOnlyBypass({
  onComplete,
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
}) {
  useEffect(() => {
    onComplete(DEFAULT_ANSWERS);
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
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
  config?: QuestionnaireConfig;
}) {
  // photoOnlyMode: skip questionnaire entirely
  if (config?.photoOnlyMode) {
    return <PhotoOnlyBypass onComplete={onComplete} />;
  }

  return <QuestionnaireInner onComplete={onComplete} config={config} />;
}

function QuestionnaireInner({
  onComplete,
  config,
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
  config?: QuestionnaireConfig;
}) {
  // Filter questions based on config toggles
  const questions = ALL_QUESTIONS.filter((q) => {
    if (q.id === "allergies" && config?.questionAllergiesEnabled === false) return false;
    if (q.id === "sunscreen_frequency" && config?.questionSunscreenEnabled === false) return false;
    if (q.id === "pregnant_or_nursing" && config?.questionPregnantEnabled === false) return false;
    return true;
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});

  const question = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const progress = ((currentIdx + 1) / questions.length) * 100;

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
      // Merge answers with defaults for any questions that were disabled/skipped
      const merged: QuestionnaireAnswers = {
        ...DEFAULT_ANSWERS,
        ...(answers as QuestionnaireAnswers),
      };
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
