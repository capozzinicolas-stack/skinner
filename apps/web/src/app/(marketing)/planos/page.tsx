"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    id: "growth", name: "Growth", price: "R$ 890", setup: "R$ 1.500", commission: "3%",
    target: "Clinicas e farmacias independentes", popular: false,
    features: ["Ate 200 analises/mes", "1 usuario admin", "Relatorio PDF", "Marca branca basica", "Suporte por email", "Comissao 3% sobre venda atribuida"],
  },
  {
    id: "pro", name: "Pro", price: "R$ 2.490", setup: "R$ 3.000", commission: "2%",
    target: "Redes regionais e clinicas multi-unidade", popular: true,
    features: ["Ate 1.500 analises/mes", "5 usuarios · multi-unidade", "Marca branca completa", "Painel de atribuicao", "Integracao ERP/marketplace", "CSM dedicado", "Comissao 2% sobre venda atribuida"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "Sob consulta", setup: "—", commission: "1%",
    target: "Laboratorios, redes nacionais", popular: false,
    features: ["Analises ilimitadas", "Usuarios ilimitados", "API privada + webhooks", "SLA 99.9%", "Modelo de IA dedicado", "Co-marketing", "Comissao 1% sobre venda atribuida"],
  },
];

const faq = [
  ["Como funciona a comissao?", "Cobrada apenas sobre vendas confirmadas geradas pela recomendacao Skinner. Rastreamento via pixel ou API. Voce so paga quando a Skinner gera venda."],
  ["Tem fidelidade?", "Nao. Cancela quando quiser. Historico exportavel e dados ficam disponiveis por 30 dias apos o cancelamento."],
  ["LGPD?", "Foto descartada apos analise por padrao. DPO dedicado. Conforme ANPD. Termo de tratamento de dados disponivel para analise juridica."],
  ["Quanto tempo leva pra implementar?", "14 dias do contrato ao primeiro relatorio em producao. CSM acompanha as 50 primeiras analises."],
  ["Funciona com meu catalogo?", "Sim. Importacao por CSV, integracao com Bling, Tiny, Linx, VTEX, Shopify, ou API direta."],
  ["Precisa de hardware?", "Nao. Funciona em qualquer dispositivo com camera. Tablet recomendado pra PDV."],
];

export default function PlanosPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao criar sessao de pagamento");
        setLoading(null);
      }
    } catch {
      alert("Erro ao conectar com o sistema de pagamento");
      setLoading(null);
    }
  }

  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Planos · pt-BR · CNPJ ativo</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            <i className="text-terre">Planos</i> simples.<br />Sem letra miuda.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            Mensalidade fixa + comissao sobre venda atribuida. Sem fidelidade. Sem custo escondido.
          </p>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className={`relative p-8 border flex flex-col ${p.popular ? "border-carbone bg-blanc-casse" : "border-sable/40 bg-white"}`}>
                {p.popular && <span className="absolute -top-3 left-8 font-mono text-[10px] tracking-[0.12em] uppercase text-blanc-casse bg-carbone px-3 py-1">Mais escolhido</span>}
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre">{p.target}</p>
                <h2 className="font-serif text-4xl italic text-carbone mt-2">{p.name}</h2>
                <div className="mt-4 mb-1">
                  <b className="font-serif text-3xl text-carbone">{p.price}</b>
                  {p.price.startsWith("R$") && <small className="text-pierre font-light text-sm ml-1">/mes</small>}
                </div>
                <p className="text-[13px] text-pierre font-light">Setup: {p.setup} · Comissao: {p.commission}</p>
                <div className="h-px bg-sable/30 my-6" />
                <ul className="flex flex-col gap-3 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-terre font-light">
                      <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {p.id === "enterprise" ? (
                  <Link href="/contato" className="mt-8 block text-center py-4 text-sm tracking-[0.02em] transition-all border border-sable text-carbone hover:bg-ivoire hover:border-carbone">
                    Falar com vendas
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(p.id)}
                    disabled={loading === p.id}
                    className={`mt-8 block w-full text-center py-4 text-sm tracking-[0.02em] transition-all disabled:opacity-50 ${
                      p.popular
                        ? "bg-carbone text-blanc-casse border border-carbone hover:bg-terre"
                        : "border border-sable text-carbone hover:bg-ivoire hover:border-carbone"
                    }`}
                  >
                    {loading === p.id ? "Redirecionando..." : "Inscrever-se"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-24">
            <h3 className="font-serif text-[28px] text-carbone mb-8">Perguntas <i className="text-terre">recorrentes</i>.</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faq.map(([q, a], i) => (
                <div key={i} className="p-6 border border-sable/30 bg-white">
                  <h4 className="font-serif text-base text-carbone mb-2">{q}</h4>
                  <p className="text-sm text-pierre font-light leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
