"use client";

import { useState } from "react";

type ProjectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; week8: string; week12: string }
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
  products,
}: {
  photoBase64: string;
  conditions: SkinCondition[];
  primaryObjective: string;
  products?: ProjectionProduct[];
}) {
  const [state, setState] = useState<ProjectionState>({ status: "idle" });

  async function handleGenerate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoBase64, conditions, primaryObjective, products }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `Erro HTTP ${res.status}`
        );
      }

      const data = (await res.json()) as {
        week8: string;
        week12: string;
      };

      setState({
        status: "success",
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
            Veja como sua pele poderia responder ao tratamento recomendado ao longo de
            8 e 12 semanas. A simulacao e gerada por inteligencia artificial com base
            nas condicoes identificadas e nos produtos recomendados.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* Current photo */}
            <div className="bg-white border border-sable/20">
              <div
                className="relative w-full bg-ivoire overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={photoBase64}
                  alt="Atual"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="font-serif text-base text-carbone">Atual</h4>
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Estado inicial
                  </span>
                </div>
                <p className="text-xs text-pierre font-light leading-relaxed">
                  {conditions.length > 0
                    ? `Estado atual com ${conditions.map((c) => getConditionLabel(c.name).toLowerCase()).join(", ")}.`
                    : "Linha de base do diagnostico."}
                </p>
              </div>
            </div>

            {/* 8 weeks — 50% improvement */}
            <div className="bg-white border border-sable/20">
              <div
                className="relative w-full bg-ivoire overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={state.week8}
                  alt="8 semanas"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute top-3 right-3 px-2 py-1"
                  style={{
                    backgroundColor: "rgba(247, 243, 238, 0.92)",
                    color: "#1C1917",
                  }}
                >
                  <span className="text-xs font-light tracking-wide">-50%</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="font-serif text-base text-carbone">8 semanas</h4>
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Fase intermediaria
                  </span>
                </div>
                <p className="text-xs text-pierre font-light leading-relaxed">
                  Reducao visivel das condicoes identificadas. Pele com maior luminosidade,
                  textura mais refinada e tom mais uniforme.
                </p>
              </div>
            </div>

            {/* 12 weeks — 80% improvement */}
            <div className="bg-white border border-sable/20">
              <div
                className="relative w-full bg-ivoire overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={state.week12}
                  alt="12 semanas"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute top-3 right-3 px-2 py-1"
                  style={{
                    backgroundColor: "rgba(247, 243, 238, 0.92)",
                    color: "#1C1917",
                  }}
                >
                  <span className="text-xs font-light tracking-wide">-80%</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="font-serif text-base text-carbone">12 semanas</h4>
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Resultado consolidado
                  </span>
                </div>
                <p className="text-xs text-pierre font-light leading-relaxed">
                  Transformacao significativa com tratamento consistente. Pele equilibrada,
                  saudavel e visivelmente rejuvenescida.
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-ivoire border border-sable/30">
            <p className="text-[10px] text-terre uppercase tracking-wider font-light mb-1">
              Aviso importante
            </p>
            <p className="text-xs text-terre font-light leading-relaxed">
              Estas imagens sao simulacoes geradas por inteligencia artificial com
              base nas condicoes identificadas e nos produtos recomendados. Nao representam uma
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
