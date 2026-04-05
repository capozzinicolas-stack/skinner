"use client";

import { useState } from "react";
import type { FullAnalysisResult } from "@/lib/sae/types";

const skinTypeLabels: Record<string, string> = {
  oily: "Oleosa",
  dry: "Seca",
  combination: "Mista",
  normal: "Normal",
  sensitive: "Sensível",
};

const conditionLabels: Record<string, string> = {
  acne: "Acne",
  hyperpigmentation: "Hiperpigmentação",
  aging: "Envelhecimento",
  dehydration: "Desidratação",
  sensitivity: "Sensibilidade",
  rosacea: "Rosácea",
  pores: "Poros dilatados",
  dullness: "Opacidade",
  dark_circles: "Olheiras",
  oiliness: "Oleosidade",
};

const barrierLabels: Record<string, { label: string; color: string }> = {
  healthy: { label: "Saudável", color: "bg-green-100 text-green-700" },
  compromised: { label: "Comprometida", color: "bg-red-100 text-red-700" },
  needs_attention: { label: "Atenção necessária", color: "bg-yellow-100 text-yellow-700" },
};

const severityLabels = ["", "Leve", "Moderado", "Severo"];
const severityColors = ["", "text-green-600", "text-yellow-600", "text-red-600"];

const stepLabels: Record<string, string> = {
  cleanser: "Limpeza",
  toner: "Tônico",
  serum: "Sérum",
  moisturizer: "Hidratante",
  SPF: "Protetor Solar",
  treatment: "Tratamento",
};

export function ResultsScreen({
  result,
  tenantName,
  disclaimer,
  primaryColor,
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

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-block px-4 py-1 rounded-full text-xs font-medium text-white mb-4"
          style={{ backgroundColor: primaryColor }}
        >
          Resultado da Análise
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Sua pele é{" "}
          <span style={{ color: primaryColor }}>
            {skinTypeLabels[analysis.skin_type] ?? analysis.skin_type}
          </span>
        </h2>
        <p className="text-sm text-gray-500 mt-2">{analysis.summary}</p>
      </div>

      {/* Barrier status */}
      <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Barreira cutânea</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${barrier.color}`}>
            {barrier.label}
          </span>
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Condições identificadas
        </h3>
        <div className="space-y-3">
          {analysis.conditions.map((condition) => (
            <div
              key={condition.name}
              className="p-4 bg-white rounded-xl border shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">
                  {conditionLabels[condition.name] ?? condition.name}
                </span>
                <span className={`text-xs font-medium ${severityColors[condition.severity]}`}>
                  {severityLabels[condition.severity]}
                </span>
              </div>
              <p className="text-sm text-gray-500">{condition.description}</p>
              {/* Severity bar */}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full ${
                      level <= condition.severity
                        ? level === 1
                          ? "bg-green-400"
                          : level === 2
                          ? "bg-yellow-400"
                          : "bg-red-400"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action plan */}
      <div className="mb-6">
        <button
          onClick={() => setShowPlan(!showPlan)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-900">
            Plano de Ação
          </span>
          <span className="text-gray-400">{showPlan ? "\u25B2" : "\u25BC"}</span>
        </button>
        {showPlan && (
          <div className="mt-3 space-y-3">
            {[
              { phase: "Fase 1", period: "Semanas 1-2", text: analysis.action_plan.phase1 },
              { phase: "Fase 2", period: "Semanas 3-8", text: analysis.action_plan.phase2 },
              { phase: "Fase 3", period: "Mês 3+", text: analysis.action_plan.phase3 },
            ].map(({ phase, period, text }) => (
              <div key={phase} className="p-4 bg-white rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                    {phase}
                  </span>
                  <span className="text-xs text-gray-400">{period}</span>
                </div>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended products */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Produtos Recomendados
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.productId}
                className="p-4 bg-white rounded-xl border shadow-sm"
              >
                <div className="flex gap-3">
                  {rec.imageUrl ? (
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-gray-400">#{idx + 1}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {rec.name}
                        </h4>
                        {rec.stepRoutine && (
                          <span className="text-xs text-gray-400">
                            {stepLabels[rec.stepRoutine] ?? rec.stepRoutine}
                          </span>
                        )}
                      </div>
                      {rec.price && (
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          R$ {rec.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                    <p className="text-xs text-gray-400 mt-1 italic">{rec.howToUse}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${rec.matchScore * 100}%`,
                            backgroundColor: primaryColor,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {Math.round(rec.matchScore * 100)}%
                      </span>
                    </div>
                    {rec.ecommerceLink && (
                      <a
                        href={`${rec.ecommerceLink}?skr_ref=${rec.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Comprar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert signs */}
      {analysis.alert_signs.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            Sinais de Alerta
          </h4>
          <ul className="space-y-1">
            {analysis.alert_signs.map((sign, i) => (
              <li key={i} className="text-xs text-red-600">
                - {sign}
              </li>
            ))}
          </ul>
          <p className="text-xs text-red-500 mt-2 font-medium">
            Se apresentar qualquer um destes sinais, consulte um dermatologista.
          </p>
        </div>
      )}

      {/* Email capture */}
      {!emailSent && (
        <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Receba o relatório completo
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => {
                if (email) setEmailSent(true);
              }}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
      {emailSent && (
        <div className="mb-6 p-3 bg-green-50 rounded-xl border border-green-200 text-center">
          <p className="text-sm text-green-700">
            Relatório enviado para {email}!
          </p>
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <p className="text-xs text-gray-400 text-center italic">{disclaimer}</p>
      )}
      <p className="text-xs text-gray-300 text-center mt-2">
        Powered by Skinner
      </p>
    </div>
  );
}
