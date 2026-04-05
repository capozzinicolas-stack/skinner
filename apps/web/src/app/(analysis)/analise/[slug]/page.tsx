"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Questionnaire, type QuestionnaireAnswers } from "@/components/analysis/questionnaire";
import { PhotoCapture } from "@/components/analysis/photo-capture";
import { LoadingScreen } from "@/components/analysis/loading-screen";
import { ResultsScreen } from "@/components/analysis/results-screen";
import type { FullAnalysisResult } from "@/lib/sae/types";

type Step = "welcome" | "consent" | "questionnaire" | "photo" | "loading" | "result" | "error";

export default function AnalysisPage({
  params,
}: {
  params: { slug: string };
}) {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const tenant = trpc.tenant.getBySlug.useQuery({ slug: params.slug });
  const analysisMutation = trpc.analysis.run.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setStep("error");
    },
  });

  const brandColor = tenant.data?.primaryColor ?? "#0ea5e9";
  const tenantName = tenant.data?.name ?? "Skinner";

  function handleQuestionnaireDone(data: QuestionnaireAnswers) {
    setAnswers(data);
    setStep("photo");
  }

  function handlePhotoCaptured(base64: string) {
    if (!answers) return;
    setStep("loading");
    analysisMutation.mutate({
      tenantSlug: params.slug,
      photoBase64: base64,
      questionnaire: answers,
    });
  }

  // Tenant not found
  if (tenant.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </main>
    );
  }
  if (!tenant.data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Não encontrado</h1>
          <p className="text-gray-500 mt-2">Este link de análise não é válido.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Top bar with tenant branding */}
      <header className="py-4 px-6 border-b flex items-center justify-center">
        {tenant.data.logoUrl ? (
          <img src={tenant.data.logoUrl} alt={tenantName} className="h-8 object-contain" />
        ) : (
          <span className="text-lg font-bold" style={{ color: brandColor }}>
            {tenantName}
          </span>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center py-8">
        {/* Welcome */}
        {step === "welcome" && (
          <div className="w-full max-w-lg mx-auto px-4 text-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Análise de Pele
            </h1>
            <p className="text-gray-500 max-w-md mx-auto">
              Descubra o tipo da sua pele e receba recomendações personalizadas
              de tratamento em menos de 3 minutos.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => setStep("consent")}
                className="px-8 py-3 text-white rounded-xl font-medium text-lg transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                Iniciar Análise
              </button>
              <p className="text-xs text-gray-400">Gratuito e sem cadastro</p>
            </div>
          </div>
        )}

        {/* Consent (LGPD) */}
        {step === "consent" && (
          <div className="w-full max-w-lg mx-auto px-4 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Consentimento
            </h2>
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-3">
              <p>
                Para realizar a análise, precisaremos de uma foto do seu rosto.
                Essa foto será processada por inteligência artificial para
                identificar características da sua pele.
              </p>
              <p>
                <strong>Seus dados são protegidos:</strong>
              </p>
              <ul className="space-y-1 ml-4">
                <li>- A foto é processada e descartada imediatamente</li>
                <li>- Não armazenamos imagens faciais</li>
                <li>- A análise é anônima por padrão</li>
                <li>- Você pode fornecer e-mail opcionalmente para receber o relatório</li>
              </ul>
              <p className="text-xs text-gray-400">
                Em conformidade com a LGPD (Lei 13.709/2018).
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep("questionnaire")}
                className="flex-1 px-4 py-3 text-white rounded-xl text-sm font-medium"
                style={{ backgroundColor: brandColor }}
              >
                Concordo e continuar
              </button>
            </div>
          </div>
        )}

        {/* Questionnaire */}
        {step === "questionnaire" && (
          <Questionnaire onComplete={handleQuestionnaireDone} />
        )}

        {/* Photo */}
        {step === "photo" && (
          <PhotoCapture onCapture={handlePhotoCaptured} />
        )}

        {/* Loading */}
        {step === "loading" && <LoadingScreen />}

        {/* Results */}
        {step === "result" && result && (
          <ResultsScreen
            result={result}
            tenantName={tenantName}
            disclaimer={tenant.data.disclaimer ?? undefined}
            primaryColor={brandColor}
          />
        )}

        {/* Error */}
        {step === "error" && (
          <div className="w-full max-w-lg mx-auto px-4 text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-700">
              Erro na análise
            </h2>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <button
              onClick={() => setStep("photo")}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
