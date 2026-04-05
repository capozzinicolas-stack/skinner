"use client";

import { useState, useEffect } from "react";

const messages = [
  "Analisando o tipo da sua pele...",
  "Identificando condições e preocupações...",
  "Avaliando a barreira cutânea...",
  "Cruzando dados com nossa base dermatológica...",
  "Selecionando os melhores produtos para você...",
  "Montando seu plano de ação personalizado...",
  "Quase pronto! Finalizando seu relatório...",
];

const tips = [
  "A pele leva cerca de 28 dias para se renovar completamente.",
  "Protetor solar é o anti-aging mais eficaz que existe.",
  "Niacinamida é compatível com quase todos os tipos de pele.",
  "Hidratação adequada melhora até mesmo peles oleosas.",
  "Ingredientes ativos devem ser introduzidos gradualmente.",
];

export function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * tips.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto px-4 text-center">
      {/* Animated dots */}
      <div className="flex justify-center gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Analisando sua pele
      </h2>
      <p className="text-sm text-brand-600 font-medium min-h-[20px] transition-opacity">
        {messages[msgIdx]}
      </p>

      <div className="mt-8 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full animate-pulse" style={{ width: "80%" }} />
      </div>

      <div className="mt-12 p-4 bg-brand-50 rounded-xl">
        <p className="text-xs text-gray-500 uppercase font-medium mb-1">
          Você sabia?
        </p>
        <p className="text-sm text-brand-700">{tips[tipIdx]}</p>
      </div>
    </div>
  );
}
