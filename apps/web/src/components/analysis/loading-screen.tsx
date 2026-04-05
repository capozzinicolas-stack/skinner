"use client";

import { useState, useEffect } from "react";

const messages = [
  "Analisando o tipo da sua pele...",
  "Identificando condicoes e preocupacoes...",
  "Avaliando a barreira cutanea...",
  "Cruzando dados com nossa base dermatologica...",
  "Selecionando os melhores produtos para voce...",
  "Montando seu plano de acao personalizado...",
  "Quase pronto. Finalizando seu relatorio...",
];

const tips = [
  "A pele leva cerca de 28 dias para se renovar completamente.",
  "Protetor solar e o anti-aging mais eficaz que existe.",
  "Niacinamida e compativel com quase todos os tipos de pele.",
  "Hidratacao adequada melhora ate mesmo peles oleosas.",
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
      {/* Minimal animated indicator */}
      <div className="flex justify-center gap-3 mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-carbone animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <h2 className="font-serif text-xl text-carbone mb-2">
        Analisando sua pele
      </h2>
      <p className="text-sm text-pierre font-light min-h-[20px]">
        {messages[msgIdx]}
      </p>

      <div className="mt-8 w-full h-px bg-sable/30 overflow-hidden">
        <div className="h-full bg-carbone animate-pulse" style={{ width: "80%" }} />
      </div>

      <div className="mt-12 p-6 bg-ivoire border border-sable/20">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-2">
          Voce sabia
        </p>
        <p className="text-sm text-terre font-light italic">{tips[tipIdx]}</p>
      </div>
    </div>
  );
}
