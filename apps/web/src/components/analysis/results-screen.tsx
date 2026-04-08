"use client";

import { useState } from "react";
import type { FullAnalysisResult, MatchedProduct } from "@/lib/sae/types";

const skinTypeLabels: Record<string, string> = {
  oily: "Oleosa",
  dry: "Seca",
  combination: "Mista",
  normal: "Normal",
  sensitive: "Sensivel",
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

const barrierLabels: Record<string, { label: string; color: string }> = {
  healthy: { label: "Saudavel", color: "bg-ivoire text-terre" },
  compromised: { label: "Comprometida", color: "bg-ivoire text-terre border-sable" },
  needs_attention: { label: "Atencao necessaria", color: "bg-ivoire text-terre border-sable" },
};

const severityLabels = ["", "Leve", "Moderado", "Severo"];

const stepLabels: Record<string, string> = {
  cleanser: "Limpeza",
  toner: "Tonico",
  serum: "Serum",
  moisturizer: "Hidratante",
  SPF: "Protetor Solar",
  treatment: "Tratamento",
};

const sessionFrequencyLabels: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

// Extended MatchedProduct to include optional service fields
type MatchedProductExtended = MatchedProduct & {
  type?: string | null;
  bookingLink?: string | null;
  sessionCount?: number | null;
  sessionFrequency?: string | null;
  durationMinutes?: number | null;
};

function ProductCard({
  rec,
  idx,
}: {
  rec: MatchedProductExtended;
  idx: number;
}) {
  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex gap-4">
        {rec.imageUrl ? (
          <img src={rec.imageUrl} alt={rec.name} className="w-16 h-16 object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-pierre font-light">#{idx + 1}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm text-carbone">{rec.name}</h4>
              {rec.stepRoutine && (
                <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  {stepLabels[rec.stepRoutine] ?? rec.stepRoutine}
                </span>
              )}
            </div>
            {rec.price && (
              <span className="text-sm text-carbone flex-shrink-0">
                R$ {rec.price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs text-pierre font-light mt-1">{rec.reason}</p>
          <p className="text-xs text-pierre/60 font-light mt-1 italic">{rec.howToUse}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-sable/30">
              <div className="h-full bg-carbone" style={{ width: `${rec.matchScore * 100}%` }} />
            </div>
            <span className="text-[10px] text-pierre font-light">
              {Math.round(rec.matchScore * 100)}%
            </span>
          </div>
          {rec.ecommerceLink && (
            <a
              href={`${rec.ecommerceLink}?skr_ref=${rec.productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
            >
              Comprar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  rec,
  idx,
}: {
  rec: MatchedProductExtended;
  idx: number;
}) {
  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex gap-4">
        {rec.imageUrl ? (
          <img src={rec.imageUrl} alt={rec.name} className="w-16 h-16 object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-pierre font-light">#{idx + 1}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm text-carbone">{rec.name}</h4>
              {/* Session info row */}
              <div className="flex flex-wrap gap-2 mt-1">
                {rec.sessionCount && (
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    {rec.sessionCount} {rec.sessionCount === 1 ? "sessão" : "sessões"}
                  </span>
                )}
                {rec.sessionCount && (rec.sessionFrequency || rec.durationMinutes) && (
                  <span className="text-[10px] text-pierre/40 font-light">·</span>
                )}
                {rec.sessionFrequency && (
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    {sessionFrequencyLabels[rec.sessionFrequency] ?? rec.sessionFrequency}
                  </span>
                )}
                {rec.sessionFrequency && rec.durationMinutes && (
                  <span className="text-[10px] text-pierre/40 font-light">·</span>
                )}
                {rec.durationMinutes && (
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    {rec.durationMinutes} min
                  </span>
                )}
              </div>
            </div>
            {rec.price && (
              <span className="text-sm text-carbone flex-shrink-0">
                R$ {rec.price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs text-pierre font-light mt-1">{rec.reason}</p>
          <p className="text-xs text-pierre/60 font-light mt-1 italic">{rec.howToUse}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-sable/30">
              <div className="h-full bg-carbone" style={{ width: `${rec.matchScore * 100}%` }} />
            </div>
            <span className="text-[10px] text-pierre font-light">
              {Math.round(rec.matchScore * 100)}%
            </span>
          </div>
          {rec.bookingLink && (
            <a
              href={`${rec.bookingLink}?skr_ref=${rec.productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
            >
              Agendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResultsScreen({
  result,
  tenantName,
  disclaimer,
}: {
  result: FullAnalysisResult;
  tenantName: string;
  disclaimer?: string;
  primaryColor: string;
}) {
  const { analysis, recommendations } = result;
  const barrier = barrierLabels[analysis.barrier_status] ?? barrierLabels.healthy;
  const [showPlan, setShowPlan] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Split recommendations into products and services
  const extendedRecs = recommendations as MatchedProductExtended[];
  const productRecs = extendedRecs.filter((r) => !r.type || r.type === "product");
  const serviceRecs = extendedRecs.filter((r) => r.type === "service");

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-12">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
          Resultado da Analise
        </p>
        <h2 className="font-serif text-2xl text-carbone italic">
          Sua pele e{" "}
          {skinTypeLabels[analysis.skin_type] ?? analysis.skin_type}
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-4 mb-4" />
        <p className="text-sm text-pierre font-light leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Barrier status */}
      <div className="mb-6 p-5 bg-white border border-sable/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-pierre uppercase tracking-wider font-light">Barreira cutanea</span>
          <span className={`text-xs px-3 py-1 ${barrier.color}`}>
            {barrier.label}
          </span>
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-8">
        <h3 className="font-serif text-lg text-carbone mb-4">
          Condicoes identificadas
        </h3>
        <div className="space-y-3">
          {analysis.conditions.map((condition) => (
            <div key={condition.name} className="p-5 bg-white border border-sable/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-carbone">
                  {conditionLabels[condition.name] ?? condition.name}
                </span>
                <span className="text-xs text-pierre font-light">
                  {severityLabels[condition.severity]}
                </span>
              </div>
              <p className="text-xs text-pierre font-light leading-relaxed">{condition.description}</p>
              <div className="flex gap-1 mt-3">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-0.5 flex-1 ${
                      level <= condition.severity ? "bg-carbone" : "bg-sable/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action plan */}
      <div className="mb-8">
        <button
          onClick={() => setShowPlan(!showPlan)}
          className="w-full flex items-center justify-between p-5 bg-white border border-sable/20 hover:bg-ivoire transition-colors"
        >
          <span className="font-serif text-lg text-carbone">Plano de Acao</span>
          <span className="text-pierre text-xs">{showPlan ? "fechar" : "abrir"}</span>
        </button>
        {showPlan && (
          <div className="mt-px space-y-px">
            {[
              { phase: "Fase 1", period: "Semanas 1-2", text: analysis.action_plan.phase1 },
              { phase: "Fase 2", period: "Semanas 3-8", text: analysis.action_plan.phase2 },
              { phase: "Fase 3", period: "Mes 3+", text: analysis.action_plan.phase3 },
            ].map(({ phase, period, text }) => (
              <div key={phase} className="p-5 bg-white border border-sable/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-carbone uppercase tracking-wider">{phase}</span>
                  <span className="text-xs text-pierre font-light">{period}</span>
                </div>
                <p className="text-sm text-pierre font-light leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended products */}
      {productRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-carbone mb-4">
            Produtos Recomendados
          </h3>
          <div className="space-y-3">
            {productRecs.map((rec, idx) => (
              <ProductCard key={rec.productId} rec={rec} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended services/treatments */}
      {serviceRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-carbone mb-4">
            Tratamentos Recomendados
          </h3>
          <div className="space-y-3">
            {serviceRecs.map((rec, idx) => (
              <ServiceCard key={rec.productId} rec={rec} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Alert signs */}
      {analysis.alert_signs.length > 0 && (
        <div className="mb-8 p-5 bg-ivoire border border-sable/30">
          <h4 className="text-xs text-terre uppercase tracking-wider mb-3">
            Sinais de Alerta
          </h4>
          <ul className="space-y-1">
            {analysis.alert_signs.map((sign, i) => (
              <li key={i} className="text-xs text-terre font-light">{sign}</li>
            ))}
          </ul>
          <p className="text-xs text-pierre font-light mt-3">
            Se apresentar qualquer um destes sinais, consulte um dermatologista.
          </p>
        </div>
      )}

      {/* Email capture */}
      {!emailSent && (
        <div className="mb-8 p-5 bg-white border border-sable/20">
          <h4 className="text-xs text-carbone uppercase tracking-wider mb-3">
            Receba o relatorio completo
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 px-4 py-2.5 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
            />
            <button
              onClick={() => { if (email) setEmailSent(true); }}
              className="px-5 py-2.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
      {emailSent && (
        <div className="mb-8 p-4 bg-ivoire border border-sable/20 text-center">
          <p className="text-sm text-terre font-light">Relatorio enviado para {email}</p>
        </div>
      )}

      {/* Download PDF */}
      <div className="mb-8 text-center">
        <a
          href={`/api/report/${result.analysisId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 border border-sable/40 text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors"
        >
          Baixar relatorio em PDF
        </a>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <p className="text-xs text-pierre text-center font-light italic">{disclaimer}</p>
      )}
      <p className="text-[10px] text-sable text-center mt-3 uppercase tracking-skinners font-light">
        Powered by Skinner
      </p>
    </div>
  );
}
