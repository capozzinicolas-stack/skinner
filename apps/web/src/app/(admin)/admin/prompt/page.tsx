"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const conditionLabels: Record<string, string> = {
  acne: "Acne",
  hyperpigmentation: "Hiperpigmentacao",
  aging: "Envelhecimento",
  dehydration: "Desidratacao",
  sensitivity: "Sensibilidade",
  rosacea: "Rosacea",
  pores: "Poros dilatados",
  dullness: "Opacidade",
  dark_circles: "Olheiras",
  oiliness: "Oleosidade",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeParseConditions(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as Array<{ name: string; severity: number }>;
    return arr.map((c) => `${conditionLabels[c.name] ?? c.name} (${c.severity})`);
  } catch {
    return [];
  }
}

export default function PromptConfigPage() {
  const utils = trpc.useUtils();
  const preview = trpc.admin.getPromptPreview.useQuery();
  const config = trpc.admin.getPromptConfig.useQuery();
  const recentAnalyses = trpc.admin.recentAnalysesDetailed.useQuery({ limit: 10 });

  const updateMutation = trpc.admin.updatePromptConfig.useMutation({
    onSuccess: () => {
      utils.admin.getPromptConfig.invalidate();
      utils.admin.getPromptPreview.invalidate();
      setSaveStatus("salvo");
      setTimeout(() => setSaveStatus(null), 2000);
    },
  });

  const [globalRules, setGlobalRules] = useState<string | null>(null);
  const [restrictedConditions, setRestrictedConditions] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"prompt" | "kb" | "log">("prompt");
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  // Initialize form values from server data
  const rulesValue = globalRules ?? config.data?.analysisGlobalRules ?? "";
  const restrictedValue = restrictedConditions ?? config.data?.analysisRestrictedConditions ?? "";

  function handleSave() {
    setSaveStatus("salvando...");
    updateMutation.mutate({
      analysisGlobalRules: rulesValue || null,
      analysisRestrictedConditions: restrictedValue || null,
    });
  }

  return (
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-2xl text-carbone">Configuracao do Prompt</h1>
        <p className="text-sm text-pierre font-light mt-1">
          Visualize e edite o prompt de analise dermatologica enviado ao Claude.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sable/20 mb-8">
        {(["prompt", "kb", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-light border-b-2 transition-colors ${
              activeTab === tab
                ? "border-carbone text-carbone"
                : "border-transparent text-pierre hover:text-carbone"
            }`}
          >
            {tab === "prompt" && "Prompt e Regras"}
            {tab === "kb" && `Base de Conhecimento (${(preview.data?.conditionsCount ?? 0) + (preview.data?.ingredientsCount ?? 0)})`}
            {tab === "log" && "Log de Analises"}
          </button>
        ))}
      </div>

      {/* ─── Tab: Prompt e Regras ─────────────────────────────────────────── */}
      {activeTab === "prompt" && (
        <div className="space-y-8">
          {/* Base prompt (read-only) */}
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
              Prompt base (somente leitura)
            </p>
            <div className="bg-white border border-sable/20 p-5">
              <pre className="text-xs text-pierre font-light whitespace-pre-wrap leading-relaxed font-sans">
                {preview.data?.basePrompt ?? "Carregando..."}
              </pre>
            </div>
          </div>

          {/* Rules (read-only) */}
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
              Regras fixas (somente leitura)
            </p>
            <div className="bg-white border border-sable/20 p-5">
              <pre className="text-xs text-pierre font-light whitespace-pre-wrap leading-relaxed font-sans">
                {preview.data?.rules ?? "Carregando..."}
              </pre>
            </div>
          </div>

          {/* Editable global rules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  Regras globais customizadas
                </p>
                <p className="text-xs text-pierre font-light mt-1">
                  Estas regras sao adicionadas ao prompt de TODAS as analises, em todos os tenants.
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
                  Salvar
                </button>
              </div>
            </div>
            <textarea
              value={rulesValue}
              onChange={(e) => setGlobalRules(e.target.value)}
              rows={8}
              placeholder="Exemplos de regras que voce pode adicionar:&#10;- Sempre recomendar protetor solar como primeiro passo&#10;- Nunca recomendar retinol para menores de 25 anos&#10;- Priorizar ingredientes naturais quando possivel&#10;- Ser mais conservador na severidade para pele negra (Fitzpatrick V-VI)"
              className="w-full px-5 py-4 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre leading-relaxed"
            />
          </div>

          {/* Restricted conditions */}
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Condicoes restritas globalmente
            </p>
            <p className="text-xs text-pierre font-light mb-3">
              Claude nao mencionara estas condicoes na analise. Separar por virgula.
            </p>
            <input
              value={restrictedValue}
              onChange={(e) => setRestrictedConditions(e.target.value)}
              placeholder="Ex: rosacea, melasma"
              className="w-full px-5 py-3 border border-sable/20 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
            />
          </div>

          {/* Full prompt preview */}
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
              Preview do prompt completo (como sera enviado ao Claude)
            </p>
            <div className="bg-ivoire border border-sable/20 p-5 max-h-96 overflow-y-auto">
              <pre className="text-xs text-terre font-light whitespace-pre-wrap leading-relaxed font-sans">
{preview.data?.basePrompt ?? ""}

BASE DE CONHECIMENTO DERMATOLOGICO:

CONDICOES CONHECIDAS:
{preview.data?.conditionsKB || "(nenhuma cadastrada)"}

INGREDIENTES ATIVOS CONHECIDOS:
{preview.data?.ingredientsKB || "(nenhum cadastrado)"}

{preview.data?.rules ?? ""}
{rulesValue ? `\nREGRAS GLOBAIS DA PLATAFORMA:\n${rulesValue}` : ""}
{restrictedValue ? `\nCONDICOES RESTRITAS GLOBALMENTE (NAO MENCIONAR): ${restrictedValue}` : ""}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Base de Conhecimento ────────────────────────────────────── */}
      {activeTab === "kb" && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  Condicoes ({preview.data?.conditionsCount ?? 0})
                </p>
                <p className="text-xs text-pierre font-light mt-1">
                  Estas condicoes sao injetadas no prompt como base de conhecimento.
                </p>
              </div>
              <a
                href="/admin/dermatologia"
                className="px-4 py-2 border border-sable/30 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
              >
                Gerenciar
              </a>
            </div>
            <div className="bg-white border border-sable/20 p-5 max-h-80 overflow-y-auto">
              <pre className="text-xs text-pierre font-light whitespace-pre-wrap leading-relaxed font-sans">
                {preview.data?.conditionsKB || "Nenhuma condicao cadastrada."}
              </pre>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  Ingredientes ({preview.data?.ingredientsCount ?? 0})
                </p>
                <p className="text-xs text-pierre font-light mt-1">
                  Estes ingredientes sao injetados no prompt e usados no scoring de produtos.
                </p>
              </div>
              <a
                href="/admin/dermatologia"
                className="px-4 py-2 border border-sable/30 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
              >
                Gerenciar
              </a>
            </div>
            <div className="bg-white border border-sable/20 p-5 max-h-80 overflow-y-auto">
              <pre className="text-xs text-pierre font-light whitespace-pre-wrap leading-relaxed font-sans">
                {preview.data?.ingredientsKB || "Nenhum ingrediente cadastrado."}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Log de Analises ─────────────────────────────────────────── */}
      {activeTab === "log" && (
        <div>
          <p className="text-xs text-pierre font-light mb-4">
            Ultimas analises realizadas. Clique em uma para ver a resposta completa do Claude.
          </p>

          {recentAnalyses.isLoading && (
            <p className="text-sm text-pierre font-light">Carregando...</p>
          )}

          {recentAnalyses.data && recentAnalyses.data.length === 0 && (
            <div className="bg-white border border-sable/20 p-6">
              <p className="text-sm text-pierre font-light">Nenhuma analise realizada ainda.</p>
            </div>
          )}

          {recentAnalyses.data && recentAnalyses.data.length > 0 && (
            <div className="space-y-2">
              {recentAnalyses.data.map((a) => {
                const isExpanded = expandedAnalysis === a.id;
                const conditions = safeParseConditions(a.conditions);
                let questionnaireStr: string | null = null;
                try {
                  questionnaireStr = a.questionnaireData ? JSON.stringify(JSON.parse(a.questionnaireData), null, 2) : null;
                } catch { /* ignore */ }
                let rawResponseStr: string | null = null;
                try {
                  rawResponseStr = a.rawResponse ? JSON.stringify(JSON.parse(a.rawResponse), null, 2) : null;
                } catch { /* ignore */ }

                return (
                  <div key={a.id} className="bg-white border border-sable/20">
                    <button
                      onClick={() => setExpandedAnalysis(isExpanded ? null : a.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-ivoire/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-pierre font-light whitespace-nowrap">
                          {formatDate(a.createdAt)}
                        </span>
                        <span className="text-xs text-carbone font-light">
                          {a.tenant?.name ?? "—"}
                        </span>
                        <span className="text-xs text-pierre font-light">
                          {a.skinType ?? "—"}
                        </span>
                        {conditions.length > 0 && (
                          <span className="text-xs text-pierre font-light truncate max-w-[200px]">
                            {conditions.join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {a.latencyMs && (
                          <span className="text-[10px] text-pierre font-light">
                            {a.latencyMs}ms
                          </span>
                        )}
                        <span className="text-xs text-pierre">{isExpanded ? "fechar" : "abrir"}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-sable/20 px-5 py-4 space-y-4">
                        {/* Questionnaire input */}
                        {questionnaireStr && (
                          <div>
                            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                              Questionario enviado
                            </p>
                            <pre className="text-xs text-pierre font-light bg-ivoire/50 p-3 overflow-x-auto whitespace-pre-wrap font-sans">
                              {questionnaireStr}
                            </pre>
                          </div>
                        )}

                        {/* Claude raw response */}
                        {rawResponseStr && (
                          <div>
                            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                              Resposta completa do Claude
                            </p>
                            <pre className="text-xs text-pierre font-light bg-ivoire/50 p-3 overflow-x-auto whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                              {rawResponseStr}
                            </pre>
                          </div>
                        )}

                        {!rawResponseStr && (
                          <p className="text-xs text-pierre font-light italic">
                            Resposta raw nao disponivel (analise mock ou dados antigos).
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
