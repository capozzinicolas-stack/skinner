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

  if (tenant.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blanc-casse">
        <p className="text-pierre font-light">Carregando...</p>
      </main>
    );
  }
  if (!tenant.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blanc-casse">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-carbone">Nao encontrado</h1>
          <p className="text-pierre mt-2 font-light">Este link de analise nao e valido.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blanc-casse flex flex-col">
      {/* Top bar */}
      <header className="py-4 px-6 border-b border-sable/20 flex items-center justify-center bg-white">
        {tenant.data.logoUrl ? (
          <img src={tenant.data.logoUrl} alt={tenantName} className="h-8 object-contain" />
        ) : (
          <img src="/brand/logo-primary.png" alt="Skinner" className="h-10 object-contain" />
        )}
      </header>

      <div className="flex-1 flex items-center justify-center py-8">
        {/* Welcome */}
        {step === "welcome" && (
          <div className="w-full max-w-lg mx-auto px-4 text-center space-y-8">
            <div>
              <h1 className="font-serif text-3xl text-carbone italic">
                Analise de Pele
              </h1>
              <div className="w-16 h-px bg-sable mx-auto mt-4" />
            </div>
            <p className="text-pierre max-w-sm mx-auto text-sm font-light leading-relaxed">
              Descubra o tipo da sua pele e receba recomendacoes personalizadas
              de tratamento em menos de 3 minutos.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => setStep("consent")}
                className="px-10 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
              >
                Iniciar Analise
              </button>
              <p className="text-xs text-pierre font-light">Gratuito e sem cadastro</p>
            </div>
          </div>
        )}

        {/* Consent */}
        {step === "consent" && (
          <div className="w-full max-w-lg mx-auto px-4 space-y-6">
            <h2 className="font-serif text-xl text-carbone">Consentimento</h2>
            <div className="p-6 bg-ivoire border border-sable/20 text-sm text-terre space-y-3 font-light">
              <p>
                Para realizar a analise, precisaremos de uma foto do seu rosto.
                Essa foto sera processada por inteligencia artificial para
                identificar caracteristicas da sua pele.
              </p>
              <p className="font-normal text-carbone">Seus dados sao protegidos:</p>
              <ul className="space-y-1 ml-4 text-pierre">
                <li>A foto e processada e descartada imediatamente</li>
                <li>Nao armazenamos imagens faciais</li>
                <li>A analise e anonima por padrao</li>
                <li>Voce pode fornecer e-mail opcionalmente para receber o relatorio</li>
              </ul>
              <p className="text-xs text-pierre mt-4">
                Em conformidade com a LGPD (Lei 13.709/2018).
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 px-4 py-3 border border-sable/40 text-sm font-light text-terre hover:bg-ivoire transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep("questionnaire")}
                className="flex-1 px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
              >
                Concordo e continuar
              </button>
            </div>
          </div>
        )}

        {step === "questionnaire" && (
          <Questionnaire onComplete={handleQuestionnaireDone} />
        )}

        {step === "photo" && (
          <PhotoCapture onCapture={handlePhotoCaptured} />
        )}

        {step === "loading" && <LoadingScreen />}

        {step === "result" && result && (
          <ResultsScreen
            result={result}
            tenantName={tenantName}
            disclaimer={tenant.data.disclaimer ?? undefined}
            primaryColor="#1C1917"
          />
        )}

        {step === "error" && (
          <div className="w-full max-w-lg mx-auto px-4 text-center space-y-4">
            <h2 className="font-serif text-xl text-terre">Erro na analise</h2>
            <p className="text-sm text-pierre font-light">{errorMsg}</p>
            <button
              onClick={() => setStep("photo")}
              className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
