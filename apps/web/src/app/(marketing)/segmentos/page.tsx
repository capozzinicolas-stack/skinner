"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

type SegmentId = "laboratorios" | "clinicas" | "farmacias";

const segments: Record<SegmentId, {
  title: string;
  claim: string;
  desc: string;
  stats: [string, string][];
  bullets: string[];
}> = {
  laboratorios: {
    title: "Laboratorios",
    claim: "Sua marca como recomendacao dermatologica.",
    desc: "Distribua o Skinner como ferramenta de ativacao para sua rede de PDVs e farmacias parceiras. O catalogo da marca aparece como recomendacao personalizada — nao como prateleira.",
    stats: [["+47%", "sell-out em 90 dias"], ["380+", "pontos ativados"], ["R$ 1.2M", "GMV atribuido / mes"]],
    bullets: ["Painel master multi-rede", "Co-marketing com farmacias", "Atribuicao por SKU e por regiao", "Insights de demanda por bioma"],
  },
  clinicas: {
    title: "Clinicas",
    claim: "O paciente chega educado. A venda flui.",
    desc: "Analise IA antes da consulta dermatologica. O paciente entra no consultorio ja entendendo o estado da pele, com expectativas alinhadas e mais aberto a recomendacao de tratamento e venda de produto.",
    stats: [["3.1x", "venda de produto por consulta"], ["-40%", "tempo da consulta inicial"], ["NPS 71", "satisfacao do paciente"]],
    bullets: ["Marca branca completa", "Integracao com prontuario (memed, doctor.med)", "Receituario e PDF assinados", "Historico de evolucao do paciente"],
  },
  farmacias: {
    title: "Farmacias",
    claim: "Tablet no balcao. Ticket medio 2.4x maior.",
    desc: "Analise no PDV em 3 minutos. O atendente consulta junto com o cliente e a recomendacao aparece em tempo real, com produtos disponiveis no estoque local.",
    stats: [["2.4x", "ticket medio skincare"], ["+62%", "cross-sell por atendimento"], ["89%", "taxa de aceite da recomendacao"]],
    bullets: ["Modo PDV otimizado pra tablet", "Integracao com Linx, RM, e PDVs proprios", "Comissao automatica para atendente", "Treinamento por video + certificacao"],
  },
};

const timeline = [
  { d: "Dia 1—2", t: "Setup tecnico", x: "Subdominio, marca branca, primeiros usuarios" },
  { d: "Dia 3—5", t: "Catalogo", x: "Importacao e mapeamento de SKUs e ingredientes" },
  { d: "Dia 6—9", t: "Treinamento", x: "2h de onboarding pro time + material assincrono" },
  { d: "Dia 10—14", t: "Piloto", x: "Primeiras 50 analises com acompanhamento de CSM" },
  { d: "Mes 2", t: "Otimizacao", x: "Revisao de funil + ajuste de match score" },
];

function SegmentosContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SegmentId) || "clinicas";
  const [tab, setTab] = useState<SegmentId>(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab") as SegmentId;
    if (t && segments[t]) setTab(t);
  }, [searchParams]);

  const s = segments[tab];

  return (
    <>
      {/* Hero with tabs */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Segmentos</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            <i className="text-terre">Tres</i> jeitos de usar Skinner.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            Mesmo motor de IA. Mesma qualidade de diagnostico. Adaptado pra cada
            modelo de negocio do mercado dermatologico brasileiro.
          </p>
          {/* Tabs */}
          <div className="flex mt-10">
            {(Object.keys(segments) as SegmentId[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-6 py-3 text-sm border transition-all ${
                  tab === key
                    ? "bg-carbone text-blanc-casse border-carbone"
                    : "bg-transparent text-carbone border-sable/40 hover:border-carbone"
                }`}
              >
                {segments[key].title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Segment content */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-start">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{s.title}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {s.claim}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              {s.desc}
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {s.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block">
              Falar com vendas →
            </Link>
          </div>
          <div className="p-8 border border-sable/30 bg-white">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Resultados tipicos</p>
            <div className="space-y-6">
              {s.stats.map(([n, l], i) => (
                <div key={i} className="border-b border-sable/20 pb-4">
                  <b className="font-serif text-4xl italic text-carbone block leading-none">{n}</b>
                  <span className="text-sm text-pierre font-light mt-2 block">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Implementacao</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              14 dias do contrato ao primeiro <i className="text-terre">relatorio</i>.
            </h2>
          </div>
          <div className="space-y-4 max-w-2xl mx-auto">
            {timeline.map((x, i) => (
              <div key={i} className="flex gap-6 items-start p-5 border border-sable/30">
                <span className="font-mono text-[10px] tracking-[0.1em] text-pierre uppercase w-20 flex-shrink-0 pt-1">{x.d}</span>
                <div>
                  <h4 className="font-serif text-base text-carbone">{x.t}</h4>
                  <p className="text-sm text-pierre font-light mt-1">{x.x}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function SegmentosPage() {
  return (
    <Suspense>
      <SegmentosContent />
    </Suspense>
  );
}
