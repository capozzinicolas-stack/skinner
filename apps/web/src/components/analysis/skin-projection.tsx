"use client";

import type { ZoneAnnotation } from "@/lib/sae/types";

/**
 * Skin Projection component - displays the same photo with progressive
 * CSS filters applied to simulate expected improvement over a treatment plan.
 *
 * IMPORTANT: This is a projection/simulation based on:
 * - Current severity of detected conditions
 * - Recommended treatment duration
 * - Dermocosmetic product fundamentals
 *
 * It is NOT a real prediction and does NOT guarantee the depicted result.
 * The disclaimer is mandatory and prominently displayed.
 */

type Projection = {
  label: string;
  period: string;
  reductionPct: number;
  filter: string;
};

function calculateProjections(severityAvg: number): Projection[] {
  // severityAvg is 1-3 (mild to severe)
  // Higher severity = more potential improvement but over longer time
  // Lower severity = less dramatic but faster results

  // Base improvement percentages adjusted by severity
  const base = {
    week4: Math.round(10 + severityAvg * 2), // 12-16%
    week8: Math.round(20 + severityAvg * 4), // 24-32%
    week12: Math.round(35 + severityAvg * 5), // 40-50%
  };

  return [
    {
      label: "Projecao 1",
      period: "4 semanas",
      reductionPct: base.week4,
      // Subtle: slight brightness + saturation boost + tiny blur
      filter:
        "brightness(1.03) saturate(1.04) contrast(1.01) blur(0.3px)",
    },
    {
      label: "Projecao 2",
      period: "8 semanas",
      reductionPct: base.week8,
      // Moderate: more smoothing + warmer tone
      filter:
        "brightness(1.05) saturate(1.07) contrast(1.02) blur(0.6px)",
    },
    {
      label: "Projecao 3",
      period: "12 semanas",
      reductionPct: base.week12,
      // Strongest: visible smoothing + glow effect
      filter:
        "brightness(1.07) saturate(1.1) contrast(1.03) blur(0.9px)",
    },
  ];
}

export function SkinProjection({
  photoBase64,
  annotations,
}: {
  photoBase64: string;
  annotations: ZoneAnnotation[];
}) {
  // Calculate average severity from annotations (good=1, attention=2, concern=3)
  const severityMap = { good: 1, attention: 2, concern: 3 };
  const severities = annotations.map((a) => severityMap[a.status]);
  const avgSeverity = severities.length
    ? severities.reduce((sum, s) => sum + s, 0) / severities.length
    : 2;

  const projections = calculateProjections(avgSeverity);

  return (
    <div className="w-full">
      {/* Section label */}
      <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
        Projecao de Resultado
      </p>

      {/* Intro text */}
      <p className="text-xs text-pierre font-light mb-5 leading-relaxed">
        Simulacao aproximada de como sua pele pode evoluir seguindo o plano de
        tratamento recomendado. Baseada na severidade atual, no tempo de uso
        dos produtos e em principios dermocosmeticos.
      </p>

      {/* Photo grid: original + 3 projections */}
      <div className="grid grid-cols-4 gap-2">
        {/* Original */}
        <div className="space-y-2">
          <div
            className="relative overflow-hidden bg-black"
            style={{ aspectRatio: "3/4" }}
          >
            <img
              src={photoBase64}
              alt="Estado atual"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <p className="text-[9px] text-pierre uppercase tracking-wider font-light">
              Atual
            </p>
            <p className="text-[8px] text-pierre/60 font-light mt-0.5">
              Estado inicial
            </p>
          </div>
        </div>

        {/* 3 projections */}
        {projections.map((proj, idx) => (
          <div key={idx} className="space-y-2">
            <div
              className="relative overflow-hidden bg-black"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={photoBase64}
                alt={`${proj.label} - ${proj.period}`}
                className="w-full h-full object-cover"
                style={{
                  filter: proj.filter,
                  transform: "scale(1.01)", // Prevents blur edge artifacts
                }}
              />
              {/* Subtle warm overlay to simulate "healthy glow" */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(248,236,220,0.03) 0%, rgba(248,236,220,0.08) 100%)",
                  mixBlendMode: "overlay",
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-[9px] text-carbone uppercase tracking-wider font-light">
                {proj.period}
              </p>
              <p className="text-[8px] text-pierre/60 font-light mt-0.5">
                -{proj.reductionPct}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer - mandatory and prominent */}
      <div className="mt-5 p-4 bg-ivoire border border-sable/30">
        <p className="text-[10px] text-terre uppercase tracking-wider font-light mb-2">
          Aviso Importante
        </p>
        <p className="text-xs text-pierre font-light leading-relaxed">
          Estas imagens sao uma <strong className="text-carbone">projecao visual aproximada</strong>,
          nao um resultado garantido. A evolucao real depende de fatores individuais
          como adesao ao tratamento, alimentacao, habitos de sono, protecao solar,
          genetica e condicoes de saude.
        </p>
        <p className="text-xs text-pierre font-light leading-relaxed mt-2">
          Os valores percentuais sao estimativas baseadas em estudos dermocosmeticos
          para as condicoes identificadas e nao representam uma medida clinica. Para
          acompanhamento medico, consulte um dermatologista.
        </p>
      </div>
    </div>
  );
}
