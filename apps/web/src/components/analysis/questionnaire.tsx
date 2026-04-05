"use client";

import { useState } from "react";

export type QuestionnaireAnswers = {
  skin_type: string;
  concerns: string[];
  primary_objective: string;
  allergies: string;
  age_range: string;
  sunscreen_frequency: string;
  pregnant_or_nursing: string;
};

type Question = {
  id: keyof QuestionnaireAnswers;
  text: string;
  type: "single" | "multi" | "text";
  required: boolean;
  options?: { value: string; label: string }[];
  maxSelect?: number;
  showIf?: (answers: Partial<QuestionnaireAnswers>) => boolean;
};

const questions: Question[] = [
  {
    id: "skin_type",
    text: "Como você descreveria sua pele geralmente?",
    type: "single",
    required: true,
    options: [
      { value: "oily", label: "Oleosa" },
      { value: "dry", label: "Seca" },
      { value: "combination", label: "Mista" },
      { value: "normal", label: "Normal" },
      { value: "sensitive", label: "Sensível" },
    ],
  },
  {
    id: "concerns",
    text: "Quais são suas principais preocupações?",
    type: "multi",
    required: true,
    maxSelect: 3,
    options: [
      { value: "acne", label: "Acne e espinhas" },
      { value: "hyperpigmentation", label: "Manchas e hiperpigmentação" },
      { value: "aging", label: "Rugas e linhas finas" },
      { value: "dehydration", label: "Desidratação e ressecamento" },
      { value: "sensitivity", label: "Vermelhidão e sensibilidade" },
      { value: "rosacea", label: "Rosácea" },
      { value: "pores", label: "Poros dilatados" },
      { value: "dullness", label: "Pele opaca e sem brilho" },
      { value: "dark_circles", label: "Olheiras" },
      { value: "oiliness", label: "Oleosidade excessiva" },
    ],
  },
  {
    id: "primary_objective",
    text: "Qual é seu principal objetivo com o tratamento?",
    type: "single",
    required: true,
    options: [
      { value: "anti-aging", label: "Anti-envelhecimento" },
      { value: "anti-acne", label: "Controle de acne" },
      { value: "radiance", label: "Luminosidade e brilho" },
      { value: "hydration", label: "Hidratação profunda" },
      { value: "sensitivity", label: "Acalmar a pele" },
      { value: "even-tone", label: "Uniformizar o tom" },
    ],
  },
  {
    id: "allergies",
    text: "Você tem alguma alergia ou sensibilidade conhecida?",
    type: "text",
    required: false,
  },
  {
    id: "age_range",
    text: "Qual é a sua faixa etária?",
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
    text: "Com que frequência você usa protetor solar?",
    type: "single",
    required: false,
    options: [
      { value: "daily", label: "Todos os dias" },
      { value: "sometimes", label: "Às vezes" },
      { value: "rarely", label: "Raramente" },
      { value: "never", label: "Nunca" },
    ],
  },
  {
    id: "pregnant_or_nursing",
    text: "Está grávida ou amamentando?",
    type: "single",
    required: false,
    showIf: () => true,
    options: [
      { value: "no", label: "Não" },
      { value: "pregnant", label: "Sim, estou grávida" },
      { value: "nursing", label: "Sim, estou amamentando" },
    ],
  },
];

export function Questionnaire({
  onComplete,
}: {
  onComplete: (answers: QuestionnaireAnswers) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});

  const visibleQuestions = questions.filter(
    (q) => !q.showIf || q.showIf(answers)
  );
  const question = visibleQuestions[currentIdx];
  const isLast = currentIdx === visibleQuestions.length - 1;
  const progress = ((currentIdx + 1) / visibleQuestions.length) * 100;

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
      setAnswers((a) => ({
        ...a,
        [question.id]: current.filter((v) => v !== value),
      }));
    } else if (current.length < maxSelect) {
      setAnswers((a) => ({ ...a, [question.id]: [...current, value] }));
    }
  }

  function handleNext() {
    if (isLast) {
      onComplete(answers as QuestionnaireAnswers);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  if (!question) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Pergunta {currentIdx + 1} de {visibleQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {question.text}
      </h2>

      {/* Options */}
      {question.type === "single" && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectSingle(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                currentAnswer === opt.value
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === "multi" && question.options && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-3">
            Selecione até {question.maxSelect ?? 3} opções
          </p>
          {question.options.map((opt) => {
            const selected = ((currentAnswer as string[]) ?? []).includes(
              opt.value
            );
            return (
              <button
                key={opt.value}
                onClick={() => toggleMulti(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <div>
          <textarea
            value={(currentAnswer as string) ?? ""}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, [question.id]: e.target.value }))
            }
            rows={3}
            placeholder="Digite aqui (opcional)..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {currentIdx > 0 && (
          <button
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed && question.required}
          className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLast ? "Ver resultados" : question.required ? "Próxima" : "Pular"}
        </button>
      </div>
    </div>
  );
}
