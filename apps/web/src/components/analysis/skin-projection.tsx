"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { conditionLabelsLocalized, tr } from "@/lib/sae/labels";

type ProjectionStage = {
  weeks: number;
  label: string;
  phase: string;
  improvementPct: number;
};

type ProjectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; week8: string; week12: string; stages?: [ProjectionStage, ProjectionStage] }
  | { status: "error"; message: string };

type SkinCondition = {
  name: string;
  severity: number;
};

type ProjectionProduct = {
  name: string;
  activeIngredients: string[];
  stepRoutine: string | null;
};

export type ProjectionProcedure = {
  name: string;
  concernTags: string[];
  onsetWeeks: number | null;
  peakWeeks: number | null;
  improvementPct: number | null;
};

const GENERIC_ERROR = "Não foi possível gerar a projeção agora. Tente novamente em alguns instantes.";

export function SkinProjection({
  photoBase64,
  conditions,
  primaryObjective,
  products,
  mode = "dermo",
  procedures,
}: {
  photoBase64: string;
  conditions: SkinCondition[];
  primaryObjective: string;
  products?: ProjectionProduct[];
  // "clinic" (segment aesthetic_clinic): the projection follows the result
  // curve of each recommended procedure instead of the fixed 8/12 weeks.
  mode?: "dermo" | "clinic";
  procedures?: ProjectionProcedure[];
}) {
  const { locale } = useI18n();
  const [state, setState] = useState<ProjectionState>({ status: "idle" });
  const isClinic = mode === "clinic";

  function conditionLabel(name: string): string {
    return tr(conditionLabelsLocalized, name, locale);
  }
  const conditionNames = conditions.map((c) => conditionLabel(c.name));

  async function handleGenerate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoBase64,
          conditions,
          primaryObjective,
          products,
          ...(isClinic ? { mode: "clinic", procedures: (procedures ?? []).slice(0, 10) } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? GENERIC_ERROR);
      }

      const data = (await res.json()) as {
        week8: string;
        week12: string;
        stages?: [ProjectionStage, ProjectionStage];
      };

      setState({
        status: "success",
        week8: data.week8,
        week12: data.week12,
        stages: data.stages,
      });
    } catch (err) {
      // Network failures surface browser messages in English ("Failed to
      // fetch"); only server-provided messages (already pt-BR) are shown.
      const message =
        err instanceof Error && err.message && !/fetch|network|load failed/i.test(err.message)
          ? err.message
          : GENERIC_ERROR;
      setState({ status: "error", message });
    }
  }

  // Copy for the two projected images. Clinic mode uses the stage timing
  // returned by the API; dermo mode keeps the original 8/12-week framing.
  const stageCards =
    state.status === "success" && state.stages
      ? [
          {
            title: state.stages[0].label,
            phase: state.stages[0].phase,
            // No percentage for procedures: published indices are mostly
            // responder rates, not % of improvement, and a number on the
            // image reads as a promised result (CFM / CONAR / CDC).
            badge: null,
            text: "Primeiros resultados dos procedimentos indicados. Os injetáveis já mostram efeito nesta fase; as tecnologias e os bioestimuladores começam a agir.",
          },
          {
            title: state.stages[1].label,
            phase: state.stages[1].phase,
            badge: null,
            text: "Resultado consolidado ao final do protocolo, com o colágeno formado e a pele mais firme, uniforme e descansada.",
          },
        ]
      : [
          {
            title: "8 semanas",
            phase: "Fase intermediária",
            badge: "-50%",
            text: "Redução visível das condições identificadas. Pele com mais luminosidade, textura mais refinada e tom mais uniforme.",
          },
          {
            title: "12 semanas",
            phase: "Resultado consolidado",
            badge: "-80%",
            text: "Transformação significativa com tratamento consistente. Pele equilibrada, saudável e visivelmente rejuvenescida.",
          },
        ];

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="mb-4">
        <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
          Projeção de resultado
        </p>
        <div className="h-px bg-sable/20" />
      </div>

      {state.status === "idle" && (
        <div className="p-5 bg-white border border-sable/20">
          <h3 className="font-serif text-lg text-carbone mb-2">
            Simule a evolução da sua pele
          </h3>
          <p className="text-sm text-pierre font-light leading-relaxed mb-1">
            {isClinic
              ? "Veja como sua pele pode responder aos procedimentos indicados, no tempo de resposta de cada um. A simulação é gerada por inteligência artificial com base nas condições identificadas e nos procedimentos recomendados."
              : "Veja como sua pele poderia responder ao tratamento recomendado ao longo de 8 e 12 semanas. A simulação é gerada por inteligência artificial com base nas condições identificadas e nos produtos recomendados."}
          </p>
          {conditions.length > 0 && (
            <p className="text-xs text-pierre/70 font-light mb-5">
              Condições consideradas: {conditionNames.join(", ")}
            </p>
          )}
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Gerar projeção de resultado
          </button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="p-5 bg-white border border-sable/20 text-center py-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
            Gerando projeção
          </p>
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-sable"
                style={{
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-sm text-pierre font-light">
            Gerando projeção...
          </p>
          <p className="text-xs text-pierre/60 font-light mt-1">
            Isso pode levar alguns instantes
          </p>
          <style>{`
            @keyframes pulse {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {state.status === "error" && (
        <div className="p-5 bg-white border border-sable/20">
          <p className="text-sm text-terre font-light mb-4">{state.message}</p>
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 border border-sable/40 text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {state.status === "success" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-5">
            {/* Current photo */}
            <div className="bg-white border border-sable/20">
              <div
                className="relative w-full bg-ivoire overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={photoBase64}
                  alt="Foto atual"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 lg:p-5">
                <div className="flex items-baseline justify-between mb-2 gap-2">
                  <h4 className="font-serif text-base lg:text-lg text-carbone">Atual</h4>
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light whitespace-nowrap">
                    Estado inicial
                  </span>
                </div>
                <p className="text-xs lg:text-sm text-pierre font-light leading-relaxed">
                  {conditions.length > 0
                    ? `Estado atual com ${conditionNames.join(", ")}.`
                    : "Ponto de partida da análise."}
                </p>
              </div>
            </div>

            {[state.week8, state.week12].map((img, i) => {
              const card = stageCards[i];
              return (
                <div key={i} className="bg-white border border-sable/20">
                  <div
                    className="relative w-full bg-ivoire overflow-hidden"
                    style={{ aspectRatio: "1/1" }}
                  >
                    <img
                      src={img}
                      alt={`Projeção em ${card.title}`}
                      className="w-full h-full object-cover"
                    />
                    {card.badge && (
                      <div
                        className="absolute top-3 right-3 px-2 py-1"
                        style={{
                          backgroundColor: "rgba(247, 243, 238, 0.92)",
                          color: "#1C1917",
                        }}
                      >
                        <span className="text-xs font-light tracking-wide">{card.badge}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 lg:p-5">
                    <div className="flex items-baseline justify-between mb-2 gap-2">
                      <h4 className="font-serif text-base lg:text-lg text-carbone">{card.title}</h4>
                      <span className="text-[10px] text-pierre uppercase tracking-wider font-light whitespace-nowrap">
                        {card.phase}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-pierre font-light leading-relaxed">
                      {card.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-ivoire border border-sable/30">
            <p className="text-[10px] text-terre uppercase tracking-wider font-light mb-1">
              Aviso importante
            </p>
            <p className="text-xs text-terre font-light leading-relaxed">
              {isClinic
                ? "Estas imagens são simulações ilustrativas geradas por inteligência artificial com base nas condições identificadas e no tempo de resposta descrito na literatura para os procedimentos recomendados. Não representam garantia nem promessa de resultado. Resultados reais variam conforme avaliação profissional, número de sessões, genética, estilo de vida e outros fatores individuais."
                : "Estas imagens são simulações geradas por inteligência artificial com base nas condições identificadas e nos produtos recomendados. Não representam garantia de resultado. Resultados reais variam conforme adesão ao tratamento, genética, estilo de vida e outros fatores individuais. Consulte um dermatologista para orientação clínica personalizada."}
            </p>
          </div>

          {/* Regenerate button */}
          <div className="mt-4 text-center">
            <button
              onClick={handleGenerate}
              className="text-xs text-pierre font-light underline hover:text-carbone"
            >
              Gerar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
