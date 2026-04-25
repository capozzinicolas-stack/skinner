"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { DEFAULT_QUESTIONS, CORE_QUESTION_IDS, type DynamicQuestion } from "@/components/analysis/questionnaire";

const typeLabels: Record<string, string> = {
  single: "Selecao unica",
  multi: "Selecao multipla",
  text: "Texto livre",
};

export default function FormularioPage() {
  const utils = trpc.useUtils();
  const configQuery = trpc.admin.getQuestionnaireConfig.useQuery();
  const updateMutation = trpc.admin.updateQuestionnaireConfig.useMutation({
    onSuccess: () => {
      utils.admin.getQuestionnaireConfig.invalidate();
      setSaveStatus("salvo");
      setTimeout(() => setSaveStatus(null), 2000);
    },
    onError: (err) => {
      setSaveStatus(`erro: ${err.message}`);
    },
  });

  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    id: "",
    text: "",
    type: "single" as "single" | "multi" | "text",
    required: false,
    maxSelect: 3,
  });

  // Load questions from server or use defaults
  useEffect(() => {
    if (configQuery.data) {
      setQuestions(configQuery.data);
    } else if (configQuery.isSuccess && !configQuery.data) {
      setQuestions(DEFAULT_QUESTIONS);
    }
  }, [configQuery.data, configQuery.isSuccess]);

  function handleSave() {
    setSaveStatus("salvando...");
    updateMutation.mutate({ questions });
  }

  function moveQuestion(idx: number, direction: "up" | "down") {
    const newQuestions = [...questions];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newQuestions.length) return;
    [newQuestions[idx], newQuestions[targetIdx]] = [newQuestions[targetIdx], newQuestions[idx]];
    // Update order fields
    newQuestions.forEach((q, i) => { q.order = i; });
    setQuestions(newQuestions);
  }

  function toggleEnabled(idx: number) {
    const q = questions[idx];
    if (CORE_QUESTION_IDS.includes(q.id) && q.enabled) return; // Cannot disable core
    const updated = [...questions];
    updated[idx] = { ...q, enabled: !q.enabled };
    setQuestions(updated);
  }

  function toggleRequired(idx: number) {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], required: !updated[idx].required };
    setQuestions(updated);
  }

  function updateQuestionText(idx: number, text: string) {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], text };
    setQuestions(updated);
  }

  function updateMaxSelect(idx: number, maxSelect: number) {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], maxSelect };
    setQuestions(updated);
  }

  function addOption(idx: number) {
    const updated = [...questions];
    const q = updated[idx];
    const options = [...(q.options ?? []), { value: "", label: "" }];
    updated[idx] = { ...q, options };
    setQuestions(updated);
  }

  function updateOption(qIdx: number, optIdx: number, field: "value" | "label", val: string) {
    const updated = [...questions];
    const q = updated[qIdx];
    const options = [...(q.options ?? [])];
    options[optIdx] = { ...options[optIdx], [field]: val };
    updated[qIdx] = { ...q, options };
    setQuestions(updated);
  }

  function removeOption(qIdx: number, optIdx: number) {
    const updated = [...questions];
    const q = updated[qIdx];
    const options = (q.options ?? []).filter((_, i) => i !== optIdx);
    updated[qIdx] = { ...q, options };
    setQuestions(updated);
  }

  function updateShowCondition(idx: number, questionId: string, value: string) {
    const updated = [...questions];
    if (!questionId && !value) {
      updated[idx] = { ...updated[idx], showCondition: undefined };
    } else {
      updated[idx] = { ...updated[idx], showCondition: { questionId, value } };
    }
    setQuestions(updated);
  }

  function removeQuestion(idx: number) {
    const q = questions[idx];
    if (CORE_QUESTION_IDS.includes(q.id)) return; // Cannot remove core
    setQuestions(questions.filter((_, i) => i !== idx));
    if (editingId === q.id) setEditingId(null);
  }

  function handleAddQuestion() {
    if (!newQuestion.id || !newQuestion.text) return;
    // Check ID uniqueness
    if (questions.some((q) => q.id === newQuestion.id)) {
      alert("Esse ID ja existe. Escolha outro.");
      return;
    }
    const q: DynamicQuestion = {
      id: newQuestion.id.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      text: newQuestion.text,
      type: newQuestion.type,
      required: newQuestion.required,
      enabled: true,
      order: questions.length,
      maxSelect: newQuestion.type === "multi" ? newQuestion.maxSelect : undefined,
      options: newQuestion.type !== "text" ? [{ value: "", label: "" }] : undefined,
    };
    setQuestions([...questions, q]);
    setNewQuestion({ id: "", text: "", type: "single", required: false, maxSelect: 3 });
    setShowAddForm(false);
    setEditingId(q.id);
  }

  const isCore = (id: string) => CORE_QUESTION_IDS.includes(id);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between border-b border-sable/20 pb-6 mb-8">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Formulario de Analise</h1>
          <p className="text-sm text-pierre font-light mt-1">
            Gerencie as perguntas do questionario do paciente. Alteracoes se refletem em todos os tenants.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-xs text-pierre font-light">{saveStatus}</span>
          )}
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-5 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors disabled:opacity-30"
          >
            Salvar alteracoes
          </button>
        </div>
      </div>

      {configQuery.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const editing = editingId === q.id;
          return (
            <div
              key={q.id}
              className={`bg-white border ${q.enabled ? "border-sable/20" : "border-sable/10 opacity-60"}`}
            >
              {/* Question header */}
              <div className="flex items-center gap-3 px-5 py-4">
                {/* Order arrows */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveQuestion(idx, "up")}
                    disabled={idx === 0}
                    className="text-[10px] text-pierre hover:text-carbone disabled:opacity-20 leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveQuestion(idx, "down")}
                    disabled={idx === questions.length - 1}
                    className="text-[10px] text-pierre hover:text-carbone disabled:opacity-20 leading-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Question info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-carbone">{q.text}</span>
                    {isCore(q.id) && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-carbone text-blanc-casse uppercase tracking-wider font-light">
                        core
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      {typeLabels[q.type]}
                    </span>
                    <span className="text-[10px] text-pierre font-light">
                      ID: {q.id}
                    </span>
                    {q.options && (
                      <span className="text-[10px] text-pierre font-light">
                        {q.options.length} opcoes
                      </span>
                    )}
                    {q.showCondition && (
                      <span className="text-[10px] text-pierre font-light">
                        Condicional: {q.showCondition.questionId} = {q.showCondition.value}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRequired(idx)}
                    className={`text-[10px] px-2 py-1 uppercase tracking-wider font-light border ${
                      q.required
                        ? "border-carbone text-carbone"
                        : "border-sable/30 text-pierre"
                    }`}
                  >
                    {q.required ? "Obrigatoria" : "Opcional"}
                  </button>
                  <button
                    onClick={() => toggleEnabled(idx)}
                    disabled={isCore(q.id) && q.enabled}
                    className={`text-[10px] px-2 py-1 uppercase tracking-wider font-light border ${
                      q.enabled
                        ? "border-carbone text-carbone"
                        : "border-sable/30 text-pierre"
                    } disabled:cursor-not-allowed`}
                  >
                    {q.enabled ? "Ativa" : "Inativa"}
                  </button>
                  <button
                    onClick={() => setEditingId(editing ? null : q.id)}
                    className="text-[10px] text-pierre hover:text-carbone px-2 py-1 border border-sable/30"
                  >
                    {editing ? "Fechar" : "Editar"}
                  </button>
                  {!isCore(q.id) && (
                    <button
                      onClick={() => removeQuestion(idx)}
                      className="text-[10px] text-red-600 hover:underline px-2 py-1"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {editing && (
                <div className="border-t border-sable/20 px-5 py-4 space-y-4">
                  {/* Question text */}
                  <div>
                    <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      Texto da pergunta
                    </label>
                    <input
                      value={q.text}
                      onChange={(e) => updateQuestionText(idx, e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
                    />
                  </div>

                  {/* ID (read-only for core) */}
                  <div>
                    <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      ID {isCore(q.id) && "(nao editavel — usado pelo motor de analise)"}
                    </label>
                    <input
                      value={q.id}
                      readOnly={isCore(q.id)}
                      onChange={(e) => {
                        if (isCore(q.id)) return;
                        const updated = [...questions];
                        updated[idx] = { ...updated[idx], id: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") };
                        setQuestions(updated);
                      }}
                      className={`w-full mt-1 px-4 py-2.5 border border-sable/20 text-sm font-light font-mono ${
                        isCore(q.id)
                          ? "bg-ivoire text-pierre cursor-not-allowed"
                          : "bg-blanc-casse text-carbone focus:outline-none focus:border-terre"
                      }`}
                    />
                  </div>

                  {/* Max select (for multi) */}
                  {q.type === "multi" && (
                    <div>
                      <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                        Maximo de selecoes
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={q.maxSelect ?? 3}
                        onChange={(e) => updateMaxSelect(idx, parseInt(e.target.value) || 3)}
                        className="w-24 mt-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
                      />
                    </div>
                  )}

                  {/* Show condition */}
                  <div>
                    <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      Condicao de exibicao (opcional — mostrar apenas se outra pergunta tem um valor especifico)
                    </label>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={q.showCondition?.questionId ?? ""}
                        onChange={(e) =>
                          updateShowCondition(idx, e.target.value, q.showCondition?.value ?? "")
                        }
                        className="flex-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
                      >
                        <option value="">Sem condicao</option>
                        {questions
                          .filter((oq) => oq.id !== q.id && oq.options)
                          .map((oq) => (
                            <option key={oq.id} value={oq.id}>
                              {oq.text} ({oq.id})
                            </option>
                          ))}
                      </select>
                      {q.showCondition?.questionId && (
                        <select
                          value={q.showCondition?.value ?? ""}
                          onChange={(e) =>
                            updateShowCondition(idx, q.showCondition?.questionId ?? "", e.target.value)
                          }
                          className="flex-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
                        >
                          <option value="">Selecione o valor</option>
                          {questions
                            .find((oq) => oq.id === q.showCondition?.questionId)
                            ?.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.value})
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Options editor (for single/multi) */}
                  {(q.type === "single" || q.type === "multi") && (
                    <div>
                      <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                        Opcoes
                      </label>
                      <div className="space-y-2 mt-2">
                        {(q.options ?? []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <input
                              value={opt.value}
                              onChange={(e) => updateOption(idx, optIdx, "value", e.target.value)}
                              placeholder="valor (ex: oily)"
                              className="flex-1 px-3 py-2 border border-sable/20 bg-blanc-casse text-xs font-light font-mono text-carbone focus:outline-none focus:border-terre"
                            />
                            <input
                              value={opt.label}
                              onChange={(e) => updateOption(idx, optIdx, "label", e.target.value)}
                              placeholder="label (ex: Oleosa)"
                              className="flex-1 px-3 py-2 border border-sable/20 bg-blanc-casse text-xs font-light text-carbone focus:outline-none focus:border-terre"
                            />
                            <button
                              onClick={() => removeOption(idx, optIdx)}
                              className="text-[10px] text-red-600 hover:underline px-2"
                            >
                              x
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(idx)}
                          className="text-xs text-pierre hover:text-carbone font-light"
                        >
                          + Adicionar opcao
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add question */}
      <div className="mt-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 border border-sable/30 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
          >
            + Nova pergunta
          </button>
        ) : (
          <div className="bg-white border border-sable/20 p-5 space-y-4">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Nova pergunta</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  ID (slug unico, sem espacos)
                </label>
                <input
                  value={newQuestion.id}
                  onChange={(e) => setNewQuestion({ ...newQuestion, id: e.target.value })}
                  placeholder="ex: smoking_habits"
                  className="w-full mt-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light font-mono text-carbone focus:outline-none focus:border-terre"
                />
              </div>
              <div>
                <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  Tipo
                </label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as "single" | "multi" | "text" })}
                  className="w-full mt-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
                >
                  <option value="single">Selecao unica</option>
                  <option value="multi">Selecao multipla</option>
                  <option value="text">Texto livre</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Texto da pergunta
              </label>
              <input
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                placeholder="Ex: Voce fuma?"
                className="w-full mt-1 px-4 py-2.5 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-pierre font-light">
                <input
                  type="checkbox"
                  checked={newQuestion.required}
                  onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                />
                Obrigatoria
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddQuestion}
                disabled={!newQuestion.id || !newQuestion.text}
                className="px-5 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors disabled:opacity-30"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2 border border-sable/30 text-terre text-xs font-light hover:bg-ivoire transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
