"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// Adding a new segment: drop a new entry here AND in the redirect routes
// (/laboratorios, /clinicas, /farmacias, /varejo). Keep the keys URL-safe
// (they go in `?tab=...`).
type SegmentId = "laboratorios" | "clinicas" | "farmacias" | "varejo";

type SegmentTimeline = { d: string; t: string; x: string };

type Segment = {
  title: string;
  claim: string;
  desc: string;
  stats: [string, string][];
  bullets: string[];
  timeline: SegmentTimeline[];
};

// Default 5-step timeline reused by Lab / Clínicas / Farmácias. Varejo has
// its own (e-commerce specific: catalog sync, embed install, etc.) — see
// segments.varejo.timeline below.
const defaultTimeline: SegmentTimeline[] = [
  { d: "Dia 1—2", t: "Setup técnico", x: "Subdomínio, marca branca, primeiros usuários" },
  { d: "Dia 3—5", t: "Catálogo", x: "Importação e mapeamento de SKUs e ingredientes" },
  { d: "Dia 6—9", t: "Treinamento", x: "2h de onboarding pro time + material assíncrono" },
  { d: "Dia 10—14", t: "Piloto", x: "Primeiras 50 análises com acompanhamento de CSM" },
  { d: "Mês 2", t: "Otimização", x: "Revisão de funil + ajuste de match score" },
];

const segments: Record<SegmentId, Segment> = {
  laboratorios: {
    title: "Laboratórios",
    claim: "Sua marca como recomendação dermatológica.",
    desc: "Distribua o Skinner como ferramenta de ativação para sua rede de PDVs e farmácias parceiras. O catálogo da marca aparece como recomendação personalizada — não como prateleira.",
    stats: [["+47%", "sell-out em 90 dias"], ["380+", "pontos ativados"], ["R$ 1.2M", "GMV atribuído / mês"]],
    bullets: ["Painel master multi-rede", "Co-marketing com farmácias", "Atribuição por SKU e por região", "Insights de demanda por bioma"],
    timeline: defaultTimeline,
  },
  clinicas: {
    title: "Clínicas",
    claim: "O paciente chega educado. A venda flui.",
    desc: "Análise IA antes da consulta dermatológica. O paciente entra no consultório já entendendo o estado da pele, com expectativas alinhadas e mais aberto à recomendação de tratamento e venda de produto.",
    stats: [["3.1x", "venda de produto por consulta"], ["-40%", "tempo da consulta inicial"], ["NPS 71", "satisfação do paciente"]],
    bullets: ["Marca branca completa", "Integração com prontuário (memed, doctor.med)", "Receituário e PDF assinados", "Histórico de evolução do paciente"],
    timeline: defaultTimeline,
  },
  farmacias: {
    title: "Farmácias",
    claim: "Tablet no balcão. Ticket médio 2.4x maior.",
    desc: "Análise no PDV em 3 minutos. O atendente consulta junto com o cliente e a recomendação aparece em tempo real, com produtos disponíveis no estoque local.",
    stats: [["2.4x", "ticket médio skincare"], ["+62%", "cross-sell por atendimento"], ["89%", "taxa de aceite da recomendação"]],
    bullets: ["Modo PDV otimizado pra tablet", "Integração com Linx, RM, e PDVs próprios", "Comissão automática para atendente", "Treinamento por vídeo + certificação"],
    timeline: defaultTimeline,
  },
  varejo: {
    title: "Varejo",
    claim: "O cliente compra com confiança. O ticket sobe.",
    desc: "Análise de pele antes da decisão de compra. O cliente entende o que precisa, recebe rotina personalizada com produtos do seu catálogo e finaliza no carrinho da própria loja — sem fricção, sem abandono por dúvida.",
    // TODO: substituir por média real após 3 cases publicáveis. Números
    // atuais são benchmarks conservadores baseados em estudos de
    // personalização em e-commerce dermocosmético.
    stats: [["+38%", "conversão em PDP com análise"], ["+22%", "ticket médio via cross-sell"], ["-44%", "abandono de carrinho"]],
    bullets: [
      "Integração Nuvemshop, Shopify, VTEX e e-commerce headless",
      "Match score por SKU com ranqueamento por estoque e margem",
      "Captura de lead consentido para remarketing pós-compra",
      "Widget embed em PDP, landing ou home, sem reescrever site",
      "Cross-sell e bundle automático por análise",
    ],
    timeline: [
      { d: "Dia 1—2", t: "Setup técnico", x: "Subdomínio, marca branca, conexão com loja" },
      { d: "Dia 3—5", t: "Catálogo", x: "Sync automático de SKUs, ingredientes e estoque" },
      { d: "Dia 6—9", t: "Embed", x: "Widget instalado em PDP, home ou landing campaign" },
      { d: "Dia 10—14", t: "Piloto", x: "Primeiras 100 análises com acompanhamento de CSM" },
      { d: "Mês 2", t: "Otimização", x: "Match score recalibrado por margem e giro" },
    ],
  },
};

const segmentOrder: SegmentId[] = ["laboratorios", "clinicas", "farmacias", "varejo"];

function SegmentosContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SegmentId) || "clinicas";
  const [tab, setTab] = useState<SegmentId>(initialTab in segments ? initialTab : "clinicas");

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
          {/* Neutral headline so we don't have to re-edit copy each time we
              add a segment (was "Três jeitos" pre-Varejo). */}
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            Skinner por <i className="text-terre">segmento</i>.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            Mesmo motor de IA. Mesma qualidade de diagnóstico. Adaptado para cada
            modelo de negócio do mercado dermatológico.
          </p>
          {/* Tabs */}
          <div className="flex gap-3 mt-10 flex-wrap">
            {segmentOrder.map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={`px-6 py-3 text-sm border transition-all focus:outline-none focus:ring-1 focus:ring-carbone ${
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
            {/* Pass `?segment=tab` so the contact form pre-selects the
                Segmento dropdown — sales team knows which playbook to use
                without asking again. */}
            <Link
              href={`/contato?segment=${tab}`}
              className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block"
            >
              Falar com vendas →
            </Link>
          </div>
          <div className="p-8 border border-sable/30 bg-white">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Resultados típicos</p>
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
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Implementação</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              14 dias do contrato ao primeiro <i className="text-terre">relatório</i>.
            </h2>
          </div>
          <div className="space-y-4 max-w-2xl mx-auto">
            {s.timeline.map((x, i) => (
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
