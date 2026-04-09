"use client";

import { useState } from "react";

type ProjectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; week4: string; week8: string; week12: string }
  | { status: "error"; message: string };

type SkinCondition = {
  name: string;
  severity: number;
};

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

function getConditionLabel(name: string): string {
  return conditionLabels[name] ?? name;
}

export function SkinProjection({
  photoBase64,
  conditions,
  primaryObjective,
}: {
  photoBase64: string;
  conditions: SkinCondition[];
  primaryObjective: string;
}) {
  const [state, setState] = useState<ProjectionState>({ status: "idle" });

  async function handleGenerate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoBase64, conditions, primaryObjective }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `Erro HTTP ${res.status}`
        );
      }

      const data = (await res.json()) as {
        week4: string;
        week8: string;
        week12: string;
      };

      setState({
        status: "success",
        week4: data.week4,
        week8: data.week8,
        week12: data.week12,
      });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Nao foi possivel gerar a projecao",
      });
    }
  }

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="mb-4">
        <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
          Projecao de Resultado
        </p>
        <div className="h-px bg-sable/20" />
      </div>

      {state.status === "idle" && (
        <div className="p-5 bg-white border border-sable/20">
          <h3 className="font-serif text-lg text-carbone mb-2">
            Simule a evolucao da sua pele
          </h3>
          <p className="text-sm text-pierre font-light leading-relaxed mb-1">
            Veja como sua pele poderia responder ao tratamento ao longo de 4, 8 e
            12 semanas. A simulacao e gerada por inteligencia artificial com base
            nas condicoes identificadas.
          </p>
          {conditions.length > 0 && (
            <p className="text-xs text-pierre/70 font-light mb-5">
              Condicoes consideradas:{" "}
              {conditions.map((c) => getConditionLabel(c.name)).join(", ")}
            </p>
          )}
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Gerar projecao de resultado
          </button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="p-5 bg-white border border-sable/20 text-center py-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
            Gerando projecao
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
            Gerando projecao...
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
          {/* 2x2 grid with larger images and improvement details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {[
              {
                label: "Atual",
                period: "Estado inicial",
                src: photoBase64,
                improvements: conditions.length > 0
                  ? `Estado atual com ${conditions.map((c) => getConditionLabel(c.name).toLowerCase()).join(", ")}.`
                  : "Linha de base do diagnostico.",
                reduction: null,
              },
              {
                label: "4 semanas",
                period: "Fase inicial",
                src: state.week4,
                improvements: "Melhora inicial na textura e hidratacao. Reducao leve dos sinais de oleosidade e primeiros indicios de uniformizacao do tom.",
                reduction: "-15%",
              },
              {
                label: "8 semanas",
                period: "Fase intermediaria",
                src: state.week8,
                improvements: "Reducao visivel das condicoes identificadas. Pele com maior luminosidade, poros menos aparentes e textura mais refinada.",
                reduction: "-30%",
              },
              {
                label: "12 semanas",
                period: "Fase de consolidacao",
                src: state.week12,
                improvements: "Resultados consolidados do tratamento. Pele equilibrada, com tom uniforme, textura suave e aspecto saudavel.",
                reduction: "-50%",
              },
            ].map(({ label, period, src, improvements, reduction }) => (
              <div key={label} className="bg-white border border-sable/20">
                <div
                  className="relative w-full bg-ivoire overflow-hidden"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={src}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                  {reduction && (
                    <div
                      className="absolute top-3 right-3 px-2 py-1"
                      style={{
                        backgroundColor: "rgba(247, 243, 238, 0.92)",
                        color: "#1C1917",
                      }}
                    >
                      <span className="text-xs font-light tracking-wide">
                        {reduction}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="font-serif text-base text-carbone">{label}</h4>
                    <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      {period}
                    </span>
                  </div>
                  <p className="text-xs text-pierre font-light leading-relaxed">
                    {improvements}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-ivoire border border-sable/30">
            <p className="text-[10px] text-terre uppercase tracking-wider font-light mb-1">
              Aviso importante
            </p>
            <p className="text-xs text-terre font-light leading-relaxed">
              Estas imagens sao simulacoes geradas por inteligencia artificial com
              base nas condicoes identificadas na analise. Nao representam uma
              garantia de resultado. Resultados reais variam conforme adesao ao
              tratamento, genetica, estilo de vida e outros fatores individuais.
              Consulte um dermatologista para orientacao clinica personalizada.
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
