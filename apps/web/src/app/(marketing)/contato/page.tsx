"use client";

import { useState } from "react";

export default function ContatoPage() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          segment: data.get("segment"),
          message: data.get("message"),
          source: "website",
        }),
      });
    } catch { /* silent */ }
    setSent(true);
  }

  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Contato</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            <i className="text-terre">Vamos</i> conversar.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            Demo de 25 min com o time de produto. A gente entende seu modelo de negocio e desenha um piloto sob medida.
          </p>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20">
          {/* Left info */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">O que esperar</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              Em <i className="text-terre">25 min</i>, a gente cobre:
            </h2>
            <ul className="flex flex-col gap-3">
              {[
                "Tour pelo produto (10 min)",
                "Casos parecidos com o seu (5 min)",
                "Analise rapida do seu funil atual (5 min)",
                "Plano de piloto desenhado ao vivo (5 min)",
              ].map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-4">
              <div className="flex gap-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre w-24">comercial</span>
                <span className="text-sm text-carbone">vendas@skinner.lat</span>
              </div>
              <div className="flex gap-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre w-24">whatsapp</span>
                <span className="text-sm text-carbone">+55 11 9 8888-0000</span>
              </div>
              <div className="flex gap-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre w-24">endereco</span>
                <span className="text-sm text-carbone">Sao Paulo, SP</span>
              </div>
            </div>
          </div>

          {/* Form */}
          {sent ? (
            <div className="p-12 border border-sable/30 bg-white flex flex-col justify-center">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-2">Recebido</p>
              <h3 className="font-serif text-[28px] text-carbone">
                Obrigado.<br />Falamos <i className="text-terre">em ate 1 dia util</i>.
              </h3>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 border border-sable/30 bg-white space-y-5">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre">Preencha pra agendar</p>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">Nome</span>
                <input name="name" type="text" required placeholder="Seu nome completo" className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">Email corporativo</span>
                <input name="email" type="email" required placeholder="voce@empresa.com.br" className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">Empresa</span>
                <input name="company" type="text" placeholder="Razao social ou nome fantasia" className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">Segmento</span>
                <select name="segment" className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre">
                  <option>Clinica</option>
                  <option>Laboratorio</option>
                  <option>Farmacia</option>
                  <option>Outro</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">Mensagem</span>
                <textarea name="message" rows={3} placeholder="Conta um pouco do que voce procura." className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <button type="submit" className="w-full py-4 bg-carbone text-blanc-casse text-sm tracking-[0.02em] hover:bg-terre transition-all">
                Solicitar demo →
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
