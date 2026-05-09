import Link from "next/link";
import { resolveLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

type Case = {
  eyebrow: string;
  title: string;
  stats: [string, string][];
  quote: string;
  author: string;
};

type DemoCopy = {
  heroEyebrow: string;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroTitleEnd: string;
  heroBody: string;
  bigStats: { v: string; l: string }[];
  caseEyebrow: string;
  caseTitleStart: string;
  caseTitleHighlight: string;
  caseTitleEnd: string;
  cases: Case[];
  ctaTitleStart: string;
  ctaTitleHighlight: string;
  ctaTitleEnd: string;
  ctaButton: string;
};

const COPY: Record<Locale, DemoCopy> = {
  "pt-BR": {
    heroEyebrow: "Resultados · base ativa Q1/2026",
    heroTitleStart: "Os ",
    heroTitleHighlight: "números",
    heroTitleEnd: ".\nSem floreio.",
    heroBody: "47 clientes ativos · 218.000 análises geradas · R$ 14.6M em GMV atribuído acumulado nos últimos 12 meses.",
    bigStats: [
      { v: "+38%", l: "conversão recomendação → venda\nvs. baseline humano" },
      { v: "2.4x", l: "ticket médio skincare\nanálise vs. sem análise" },
      { v: "91%", l: "NPS do consumidor final\npós-análise (n=42k)" },
      { v: "R$ 14.6M", l: "GMV atribuído acumulado\núltimos 12 meses" },
    ],
    caseEyebrow: "Estudos de caso",
    caseTitleStart: "Como nossos clientes ",
    caseTitleHighlight: "medem",
    caseTitleEnd: ".",
    cases: [
      {
        eyebrow: "Clínica · São Paulo · 4 unidades",
        title: "Pele Bela aumentou 3.1x a venda de produto por consulta.",
        stats: [["3.1x", "venda / consulta"], ["R$ 287k", "receita atribuída / mês"], ["4 meses", "até 100% das unidades"]],
        quote: "Skinner virou parte do nosso pré-atendimento. A paciente já chega entendendo a própria pele.",
        author: "Dra. Helena Rocha, diretora",
      },
      {
        eyebrow: "Laboratório dermatológico · NDA",
        title: "+47% de sell-out em 90 dias na rede ativada.",
        stats: [["+47%", "sell-out em 90 dias"], ["380", "farmácias ativadas"], ["R$ 1.2M", "GMV atribuído / mês"]],
        quote: "Atribuição clara por SKU acabou com a discussão interna sobre eficácia de trade.",
        author: "Rafael Andrade, VP Comercial",
      },
      {
        eyebrow: "Rede de farmácias · Nordeste · 62 unidades",
        title: "Ticket de skincare 2.7x maior em clientes que fizeram análise.",
        stats: [["2.7x", "ticket médio skincare"], ["62%", "taxa de cross-sell"], ["9.2/10", "NPS do atendente"]],
        quote: "O tablet vira o gatilho da conversa. A análise fecha a venda.",
        author: "Diretora de Operações",
      },
    ],
    ctaTitleStart: "Quer resultados ",
    ctaTitleHighlight: "assim",
    ctaTitleEnd: "?",
    ctaButton: "Solicitar demo →",
  },
  es: {
    heroEyebrow: "Resultados · base activa Q1/2026",
    heroTitleStart: "Los ",
    heroTitleHighlight: "números",
    heroTitleEnd: ".\nSin adornos.",
    heroBody: "47 clientes activos · 218.000 análisis generados · $ 14.6M en GMV atribuido acumulado en los últimos 12 meses.",
    bigStats: [
      { v: "+38%", l: "conversión recomendación → venta\nvs. baseline humano" },
      { v: "2.4x", l: "ticket promedio skincare\nanálisis vs. sin análisis" },
      { v: "91%", l: "NPS del consumidor final\npost-análisis (n=42k)" },
      { v: "$ 14.6M", l: "GMV atribuido acumulado\núltimos 12 meses" },
    ],
    caseEyebrow: "Casos de éxito",
    caseTitleStart: "Cómo nuestros clientes ",
    caseTitleHighlight: "miden",
    caseTitleEnd: ".",
    cases: [
      {
        eyebrow: "Clínica · São Paulo · 4 unidades",
        title: "Pele Bela aumentó 3.1x la venta de producto por consulta.",
        stats: [["3.1x", "venta / consulta"], ["$ 287k", "ingresos atribuidos / mes"], ["4 meses", "hasta 100% de las unidades"]],
        quote: "Skinner se volvió parte de nuestro pre-atendimiento. La paciente ya llega entendiendo su propia piel.",
        author: "Dra. Helena Rocha, directora",
      },
      {
        eyebrow: "Laboratorio dermatológico · NDA",
        title: "+47% de sell-out en 90 días en la red activada.",
        stats: [["+47%", "sell-out en 90 días"], ["380", "farmacias activadas"], ["$ 1.2M", "GMV atribuido / mes"]],
        quote: "Atribución clara por SKU terminó con la discusión interna sobre eficacia de trade.",
        author: "Rafael Andrade, VP Comercial",
      },
      {
        eyebrow: "Red de farmacias · Nordeste · 62 unidades",
        title: "Ticket de skincare 2.7x mayor en clientes que hicieron análisis.",
        stats: [["2.7x", "ticket promedio skincare"], ["62%", "tasa de cross-sell"], ["9.2/10", "NPS del vendedor"]],
        quote: "El tablet vuelve el gatillo de la conversación. El análisis cierra la venta.",
        author: "Directora de Operaciones",
      },
    ],
    ctaTitleStart: "¿Quieres resultados ",
    ctaTitleHighlight: "así",
    ctaTitleEnd: "?",
    ctaButton: "Solicitar demo →",
  },
  en: {
    heroEyebrow: "Results · active base Q1/2026",
    heroTitleStart: "The ",
    heroTitleHighlight: "numbers",
    heroTitleEnd: ".\nNo fluff.",
    heroBody: "47 active customers · 218,000 analyses generated · $ 14.6M in attributed GMV over the last 12 months.",
    bigStats: [
      { v: "+38%", l: "recommendation → sale conversion\nvs. human baseline" },
      { v: "2.4x", l: "average skincare ticket\nanalysis vs. without" },
      { v: "91%", l: "end-consumer NPS\npost-analysis (n=42k)" },
      { v: "$ 14.6M", l: "attributed GMV total\nlast 12 months" },
    ],
    caseEyebrow: "Case studies",
    caseTitleStart: "How our customers ",
    caseTitleHighlight: "measure",
    caseTitleEnd: ".",
    cases: [
      {
        eyebrow: "Clinic · São Paulo · 4 locations",
        title: "Pele Bela 3.1x'd product sales per consultation.",
        stats: [["3.1x", "sale / consultation"], ["$ 287k", "attributed revenue / month"], ["4 months", "to 100% of locations"]],
        quote: "Skinner became part of our pre-consultation. The patient arrives already understanding their own skin.",
        author: "Dr. Helena Rocha, director",
      },
      {
        eyebrow: "Dermatological lab · NDA",
        title: "+47% sell-out in 90 days across the activated network.",
        stats: [["+47%", "sell-out in 90 days"], ["380", "pharmacies activated"], ["$ 1.2M", "attributed GMV / month"]],
        quote: "Clear per-SKU attribution ended internal debates about trade marketing effectiveness.",
        author: "Rafael Andrade, VP Commercial",
      },
      {
        eyebrow: "Pharmacy chain · Northeast · 62 locations",
        title: "2.7x higher skincare ticket among customers who did the analysis.",
        stats: [["2.7x", "average skincare ticket"], ["62%", "cross-sell rate"], ["9.2/10", "attendant NPS"]],
        quote: "The tablet sparks the conversation. The analysis closes the sale.",
        author: "Operations Director",
      },
    ],
    ctaTitleStart: "Want results ",
    ctaTitleHighlight: "like these",
    ctaTitleEnd: "?",
    ctaButton: "Request demo →",
  },
};

export default async function DemoPage() {
  const locale = await resolveLocale();
  const c = COPY[locale];
  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.heroEyebrow}</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone whitespace-pre-line">
            {c.heroTitleStart}<i className="text-terre">{c.heroTitleHighlight}</i>{c.heroTitleEnd}
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">{c.heroBody}</p>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-sable/30">
            {c.bigStats.map((s, i) => (
              <div key={i} className="p-9 border-b border-r border-sable/30">
                <b className="font-serif text-[clamp(48px,5vw,80px)] italic text-carbone leading-none block">{s.v}</b>
                <span className="text-xs text-pierre mt-4 block leading-snug whitespace-pre-line">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.caseEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              {c.caseTitleStart}<i className="text-terre">{c.caseTitleHighlight}</i>{c.caseTitleEnd}
            </h2>
          </div>
          <div className="space-y-8">
            {c.cases.map((cs, i) => (
              <article key={i} className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 border border-sable/30 overflow-hidden">
                <div className="aspect-[4/3] lg:aspect-auto bg-gradient-to-br from-ivoire to-[#d6cabb] flex items-center justify-center">
                  <span className="font-mono text-[9px] tracking-[0.08em] text-terre uppercase px-3 py-1 bg-white/80 border border-pierre/20">{cs.eyebrow.split("·")[0].trim()}</span>
                </div>
                <div className="p-8">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-2">{cs.eyebrow}</p>
                  <h3 className="font-serif text-[28px] text-carbone leading-snug mb-4">{cs.title}</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {cs.stats.map(([n, l], j) => (
                      <div key={j}>
                        <b className="font-serif text-2xl italic text-carbone block leading-none">{n}</b>
                        <span className="text-[11px] text-pierre block mt-1">{l}</span>
                      </div>
                    ))}
                  </div>
                  <p className="font-serif text-base italic text-terre leading-relaxed border-t border-sable/30 pt-4">
                    "{cs.quote}"<br />
                    <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-pierre not-italic mt-1 inline-block">— {cs.author}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 bg-ivoire border-t border-sable/40">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
            {c.ctaTitleStart}<i className="text-terre">{c.ctaTitleHighlight}</i>{c.ctaTitleEnd}
          </h2>
          <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block mt-8">
            {c.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
