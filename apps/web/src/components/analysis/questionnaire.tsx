"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { translateQuestionText } from "@/lib/i18n/patient-questions";

export type QuestionnaireAnswers = Record<string, string | string[]>;

export type QuestionnaireConfig = {
  questionAllergiesEnabled?: boolean;
  questionSunscreenEnabled?: boolean;
  questionPregnantEnabled?: boolean;
  photoOnlyMode?: boolean;
};

export {
  CORE_QUESTION_IDS,
  DEFAULT_QUESTIONS,
  CLINIC_DEFAULT_QUESTIONS,
  type DynamicQuestion,
} from "@/lib/questionnaire/defaults";
import { DEFAULT_QUESTIONS, type DynamicQuestion } from "@/lib/questionnaire/defaults";

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
  const { t } = useI18n();
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
      <p className="text-pierre font-light text-sm">{t.patient.loading_preparing}</p>
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
  const { t, locale } = useI18n();
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
          <span>
            {t.patient.quest_progress
              .replace("{current}", String(currentIdx + 1))
              .replace("{total}", String(questions.length))}
          </span>
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
      <h2 className="font-serif text-xl text-carbone mb-6">
        {translateQuestionText(question.text, locale)}
      </h2>

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
              {translateQuestionText(opt.label, locale)}
            </button>
          ))}
        </div>
      )}

      {question.type === "multi" && question.options && (
        <div className="space-y-2">
          <p className="text-xs text-pierre font-light mb-3">
            {t.patient.quest_multi_hint.replace(
              "{max}",
              String(question.maxSelect ?? 3),
            )}
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
                {translateQuestionText(opt.label, locale)}
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
          placeholder={t.patient.quest_text_placeholder}
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
            {t.patient.quest_back}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed && question.required}
          className="flex-1 px-6 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isLast
            ? t.patient.quest_see_results
            : question.required
              ? t.patient.quest_next
              : t.patient.quest_skip}
        </button>
      </div>
    </div>
  );
}
