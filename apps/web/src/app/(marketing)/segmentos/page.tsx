"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

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

type Copy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  titleEnd: string;
  body: string;
  segmentsObj: Record<SegmentId, Segment>;
  segmentOrder: SegmentId[];
  ctaSales: string;
  resultsLabel: string;
  implementationEyebrow: string;
  implementationTitleStart: string;
  implementationTitleHighlight: string;
  implementationTitleEnd: string;
};

const segmentOrder: SegmentId[] = ["laboratorios", "clinicas", "farmacias", "varejo"];

const defaultTimelinePtBR: SegmentTimeline[] = [
  { d: "Dia 1—2", t: "Setup técnico", x: "Subdomínio, marca branca, primeiros usuários" },
  { d: "Dia 3—5", t: "Catálogo", x: "Importação e mapeamento de SKUs e ingredientes" },
  { d: "Dia 6—9", t: "Treinamento", x: "2h de onboarding pro time + material assíncrono" },
  { d: "Dia 10—14", t: "Piloto", x: "Primeiras 50 análises com acompanhamento de CSM" },
  { d: "Mês 2", t: "Otimização", x: "Revisão de funil + ajuste de match score" },
];

const defaultTimelineEs: SegmentTimeline[] = [
  { d: "Día 1—2", t: "Setup técnico", x: "Subdominio, marca blanca, primeros usuarios" },
  { d: "Día 3—5", t: "Catálogo", x: "Importación y mapeo de SKUs e ingredientes" },
  { d: "Día 6—9", t: "Capacitación", x: "2h de onboarding al equipo + material asíncrono" },
  { d: "Día 10—14", t: "Piloto", x: "Primeros 50 análisis con acompañamiento de CSM" },
  { d: "Mes 2", t: "Optimización", x: "Revisión de embudo + ajuste de match score" },
];

const defaultTimelineEn: SegmentTimeline[] = [
  { d: "Day 1—2", t: "Technical setup", x: "Subdomain, white-label, first users" },
  { d: "Day 3—5", t: "Catalog", x: "Import and mapping of SKUs and ingredients" },
  { d: "Day 6—9", t: "Training", x: "2h team onboarding + async material" },
  { d: "Day 10—14", t: "Pilot", x: "First 50 analyses with CSM accompaniment" },
  { d: "Month 2", t: "Optimization", x: "Funnel review + match score tuning" },
];

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Segmentos",
    titleStart: "Skinner por ",
    titleHighlight: "segmento",
    titleEnd: ".",
    body: "Mesmo motor de IA. Mesma qualidade de diagnóstico. Adaptado para cada modelo de negócio do mercado dermatológico.",
    segmentsObj: {
      laboratorios: {
        title: "Laboratórios",
        claim: "Sua marca como recomendação dermatológica.",
        desc: "Distribua o Skinner como ferramenta de ativação para sua rede de PDVs e farmácias parceiras. O catálogo da marca aparece como recomendação personalizada — não como prateleira.",
        stats: [["+47%", "sell-out em 90 dias"], ["380+", "pontos ativados"], ["R$ 1.2M", "GMV atribuído / mês"]],
        bullets: ["Painel master multi-rede", "Co-marketing com farmácias", "Atribuição por SKU e por região", "Insights de demanda por bioma"],
        timeline: defaultTimelinePtBR,
      },
      clinicas: {
        title: "Clínicas",
        claim: "O paciente chega educado. A venda flui.",
        desc: "Análise IA antes da consulta dermatológica. O paciente entra no consultório já entendendo o estado da pele, com expectativas alinhadas e mais aberto à recomendação de tratamento e venda de produto.",
        stats: [["3.1x", "venda de produto por consulta"], ["-40%", "tempo da consulta inicial"], ["NPS 71", "satisfação do paciente"]],
        bullets: ["Marca branca completa", "Integração com prontuário (memed, doctor.med)", "Receituário e PDF assinados", "Histórico de evolução do paciente"],
        timeline: defaultTimelinePtBR,
      },
      farmacias: {
        title: "Farmácias",
        claim: "Tablet no balcão. Ticket médio 2.4x maior.",
        desc: "Análise no PDV em 3 minutos. O atendente consulta junto com o cliente e a recomendação aparece em tempo real, com produtos disponíveis no estoque local.",
        stats: [["2.4x", "ticket médio skincare"], ["+62%", "cross-sell por atendimento"], ["89%", "taxa de aceite da recomendação"]],
        bullets: ["Modo PDV otimizado pra tablet", "Integração com Linx, RM, e PDVs próprios", "Comissão automática para atendente", "Treinamento por vídeo + certificação"],
        timeline: defaultTimelinePtBR,
      },
      varejo: {
        title: "Varejo",
        claim: "O cliente compra com confiança. O ticket sobe.",
        desc: "Análise de pele antes da decisão de compra. O cliente entende o que precisa, recebe rotina personalizada com produtos do seu catálogo e finaliza no carrinho da própria loja — sem fricção, sem abandono por dúvida.",
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
    },
    segmentOrder,
    ctaSales: "Falar com vendas →",
    resultsLabel: "Resultados típicos",
    implementationEyebrow: "Implementação",
    implementationTitleStart: "14 dias do contrato ao primeiro ",
    implementationTitleHighlight: "relatório",
    implementationTitleEnd: ".",
  },
  es: {
    eyebrow: "Segmentos",
    titleStart: "Skinner por ",
    titleHighlight: "segmento",
    titleEnd: ".",
    body: "Mismo motor de IA. Misma calidad de diagnóstico. Adaptado a cada modelo de negocio del mercado dermatológico.",
    segmentsObj: {
      laboratorios: {
        title: "Laboratorios",
        claim: "Tu marca como recomendación dermatológica.",
        desc: "Distribuye Skinner como herramienta de activación para tu red de PDVs y farmacias aliadas. El catálogo de la marca aparece como recomendación personalizada — no como anaquel.",
        stats: [["+47%", "sell-out en 90 días"], ["380+", "puntos activados"], ["$ 1.2M", "GMV atribuido / mes"]],
        bullets: ["Panel maestro multi-red", "Co-marketing con farmacias", "Atribución por SKU y por región", "Insights de demanda por bioma"],
        timeline: defaultTimelineEs,
      },
      clinicas: {
        title: "Clínicas",
        claim: "El paciente llega informado. La venta fluye.",
        desc: "Análisis IA antes de la consulta dermatológica. El paciente entra al consultorio entendiendo el estado de su piel, con expectativas alineadas y más abierto a la recomendación de tratamiento y venta de producto.",
        stats: [["3.1x", "venta de producto por consulta"], ["-40%", "tiempo de la consulta inicial"], ["NPS 71", "satisfacción del paciente"]],
        bullets: ["Marca blanca completa", "Integración con prontuario (memed, doctor.med)", "Recetario y PDF firmados", "Historial de evolución del paciente"],
        timeline: defaultTimelineEs,
      },
      farmacias: {
        title: "Farmacias",
        claim: "Tablet en mostrador. Ticket promedio 2.4x mayor.",
        desc: "Análisis en el PDV en 3 minutos. El vendedor consulta junto con el cliente y la recomendación aparece en tiempo real, con productos disponibles en el stock local.",
        stats: [["2.4x", "ticket promedio skincare"], ["+62%", "cross-sell por atención"], ["89%", "tasa de aceptación de la recomendación"]],
        bullets: ["Modo PDV optimizado para tablet", "Integración con Linx, RM, y PDVs propios", "Comisión automática al vendedor", "Capacitación en video + certificación"],
        timeline: defaultTimelineEs,
      },
      varejo: {
        title: "Retail",
        claim: "El cliente compra con confianza. El ticket sube.",
        desc: "Análisis de piel antes de la decisión de compra. El cliente entiende qué necesita, recibe rutina personalizada con productos de tu catálogo y finaliza en el carrito de la propia tienda — sin fricción, sin abandono por dudas.",
        stats: [["+38%", "conversión en PDP con análisis"], ["+22%", "ticket promedio vía cross-sell"], ["-44%", "abandono de carrito"]],
        bullets: [
          "Integración Nuvemshop, Shopify, VTEX y e-commerce headless",
          "Match score por SKU con ranking por stock y margen",
          "Captura de lead consentida para remarketing post-compra",
          "Widget embed en PDP, landing o home, sin reescribir sitio",
          "Cross-sell y bundle automático por análisis",
        ],
        timeline: [
          { d: "Día 1—2", t: "Setup técnico", x: "Subdominio, marca blanca, conexión con tienda" },
          { d: "Día 3—5", t: "Catálogo", x: "Sync automático de SKUs, ingredientes y stock" },
          { d: "Día 6—9", t: "Embed", x: "Widget instalado en PDP, home o landing campaign" },
          { d: "Día 10—14", t: "Piloto", x: "Primeros 100 análisis con acompañamiento de CSM" },
          { d: "Mes 2", t: "Optimización", x: "Match score recalibrado por margen y rotación" },
        ],
      },
    },
    segmentOrder,
    ctaSales: "Hablar con ventas →",
    resultsLabel: "Resultados típicos",
    implementationEyebrow: "Implementación",
    implementationTitleStart: "14 días del contrato al primer ",
    implementationTitleHighlight: "reporte",
    implementationTitleEnd: ".",
  },
  en: {
    eyebrow: "Segments",
    titleStart: "Skinner by ",
    titleHighlight: "segment",
    titleEnd: ".",
    body: "Same AI engine. Same diagnostic quality. Adapted to each business model in the dermatological market.",
    segmentsObj: {
      laboratorios: {
        title: "Laboratories",
        claim: "Your brand as dermatological recommendation.",
        desc: "Distribute Skinner as activation tool for your network of POS and partner pharmacies. The brand catalog appears as personalized recommendation — not as shelf space.",
        stats: [["+47%", "sell-out in 90 days"], ["380+", "points activated"], ["$ 1.2M", "attributed GMV / month"]],
        bullets: ["Multi-network master dashboard", "Co-marketing with pharmacies", "Attribution per SKU and per region", "Demand insights per region"],
        timeline: defaultTimelineEn,
      },
      clinicas: {
        title: "Clinics",
        claim: "The patient arrives informed. The sale flows.",
        desc: "AI analysis before the dermatological consultation. The patient walks into the office already understanding their skin condition, with aligned expectations and more open to treatment recommendation and product sale.",
        stats: [["3.1x", "product sale per consultation"], ["-40%", "initial consultation time"], ["NPS 71", "patient satisfaction"]],
        bullets: ["Complete white label", "EMR integration (memed, doctor.med)", "Signed prescription and PDF", "Patient evolution history"],
        timeline: defaultTimelineEn,
      },
      farmacias: {
        title: "Pharmacies",
        claim: "Tablet at the counter. Average ticket 2.4x higher.",
        desc: "POS analysis in 3 minutes. The attendant consults alongside the customer and the recommendation appears in real time, with products available in local stock.",
        stats: [["2.4x", "average skincare ticket"], ["+62%", "cross-sell per visit"], ["89%", "recommendation acceptance rate"]],
        bullets: ["POS mode optimized for tablet", "Integration with Linx, RM, and proprietary POS", "Automatic commission for attendants", "Video training + certification"],
        timeline: defaultTimelineEn,
      },
      varejo: {
        title: "Retail",
        claim: "Customer buys with confidence. AOV goes up.",
        desc: "Skin analysis before the purchase decision. The customer understands what they need, receives a personalized routine with products from your catalog and checks out in the store's own cart — no friction, no doubt-driven abandonment.",
        stats: [["+38%", "PDP conversion with analysis"], ["+22%", "average order value via cross-sell"], ["-44%", "cart abandonment"]],
        bullets: [
          "Nuvemshop, Shopify, VTEX and headless e-commerce integration",
          "Per-SKU match score with stock and margin ranking",
          "Consented lead capture for post-purchase remarketing",
          "Embed widget on PDP, landing or home, without rewriting the site",
          "Automatic cross-sell and bundle per analysis",
        ],
        timeline: [
          { d: "Day 1—2", t: "Technical setup", x: "Subdomain, white-label, store connection" },
          { d: "Day 3—5", t: "Catalog", x: "Automatic sync of SKUs, ingredients and stock" },
          { d: "Day 6—9", t: "Embed", x: "Widget installed on PDP, home or landing campaign" },
          { d: "Day 10—14", t: "Pilot", x: "First 100 analyses with CSM accompaniment" },
          { d: "Month 2", t: "Optimization", x: "Match score recalibrated by margin and turnover" },
        ],
      },
    },
    segmentOrder,
    ctaSales: "Talk to sales →",
    resultsLabel: "Typical results",
    implementationEyebrow: "Implementation",
    implementationTitleStart: "14 days from contract to first ",
    implementationTitleHighlight: "report",
    implementationTitleEnd: ".",
  },
};

function SegmentosContent() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialTab = (searchParams.get("tab") as SegmentId) || "clinicas";
  const [tab, setTab] = useState<SegmentId>(initialTab in c.segmentsObj ? initialTab : "clinicas");

  useEffect(() => {
    const t = searchParams.get("tab") as SegmentId;
    if (t && c.segmentsObj[t]) setTab(t);
  }, [searchParams, c.segmentsObj]);

  // Sync tab change → URL with `?tab=...`. Uses router.replace (not push)
  // so back-button doesn't get polluted with N tab clicks; SEO crawlers
  // and shareable links still get the right URL on each tab. Scroll: false
  // so clicking a tab doesn't jump to top — the tabs themselves are above
  // the content, you want to keep your view stable.
  function handleTabClick(key: SegmentId) {
    setTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const s = c.segmentsObj[tab];

  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.eyebrow}</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            {c.titleStart}<i className="text-terre">{c.titleHighlight}</i>{c.titleEnd}
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">{c.body}</p>
          <div className="flex gap-3 mt-10 flex-wrap">
            {c.segmentOrder.map((key) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                aria-pressed={tab === key}
                className={`px-6 py-3 text-sm border transition-all focus:outline-none focus:ring-1 focus:ring-carbone ${
                  tab === key
                    ? "bg-carbone text-blanc-casse border-carbone"
                    : "bg-transparent text-carbone border-sable/40 hover:border-carbone"
                }`}
              >
                {c.segmentsObj[key].title}
              </button>
            ))}
          </div>
        </div>
      </section>

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
            <Link
              href={`/contato?segment=${tab}`}
              className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block"
            >
              {c.ctaSales}
            </Link>
          </div>
          <div className="p-8 border border-sable/30 bg-white">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.resultsLabel}</p>
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

      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.implementationEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              {c.implementationTitleStart}<i className="text-terre">{c.implementationTitleHighlight}</i>{c.implementationTitleEnd}
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
