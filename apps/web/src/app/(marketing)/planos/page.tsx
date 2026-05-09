"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

type Copy = {
  eyebrow: string;
  titleHighlight: string;
  titleEnd: string;
  titleLine2: string;
  body: string;
  loading: string;
  popularBadge: string;
  perMonth: string;
  setupLabel: string;
  commissionLabel: string;
  customConsult: string;
  defaultCustomCta: string;
  defaultStandardCta: string;
  redirecting: string;
  errorPayment: string;
  errorConnect: string;
  faqTitleStart: string;
  faqTitleHighlight: string;
  faqTitleEnd: string;
  faq: [string, string][];
  marketingMeta: Record<string, { target: string; popular: boolean }>;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Planos",
    titleHighlight: "Planos",
    titleEnd: " simples.",
    titleLine2: "Sem letra miúda.",
    body: "Mensalidade fixa + comissão sobre venda atribuída. Sem fidelidade. Sem custo escondido.",
    loading: "Carregando planos...",
    popularBadge: "Mais escolhido",
    perMonth: "/mês",
    setupLabel: "Setup",
    commissionLabel: "Comissão",
    customConsult: "Sob consulta",
    defaultCustomCta: "Falar com vendas",
    defaultStandardCta: "Inscrever-se",
    redirecting: "Redirecionando...",
    errorPayment: "Erro ao criar sessão de pagamento",
    errorConnect: "Erro ao conectar com o sistema de pagamento",
    faqTitleStart: "Perguntas ",
    faqTitleHighlight: "recorrentes",
    faqTitleEnd: ".",
    faq: [
      ["Como funciona a comissão?", "Cobrada apenas sobre vendas confirmadas geradas pela recomendação Skinner. Rastreamento via pixel ou API. Você só paga quando a Skinner gera venda."],
      ["Tem fidelidade?", "Não. Cancela quando quiser. Histórico exportável e dados ficam disponíveis por 30 dias após o cancelamento."],
      ["LGPD?", "Foto descartada após análise por padrão. DPO dedicado. Conforme ANPD. Termo de tratamento de dados disponível para análise jurídica."],
      ["Quanto tempo leva pra implementar?", "14 dias do contrato ao primeiro relatório em produção. CSM acompanha as 50 primeiras análises."],
      ["Funciona com meu catálogo?", "Sim. Importação por CSV, integração com Bling, Tiny, Linx, VTEX, Shopify, ou API direta."],
      ["Precisa de hardware?", "Não. Funciona em qualquer dispositivo com câmera. Tablet recomendado pra PDV."],
    ],
    marketingMeta: {
      growth: { target: "Clínicas e farmácias independentes", popular: false },
      pro: { target: "Redes regionais e clínicas multi-unidade", popular: true },
      enterprise: { target: "Laboratórios, redes nacionais", popular: false },
    },
  },
  es: {
    eyebrow: "Planes",
    titleHighlight: "Planes",
    titleEnd: " simples.",
    titleLine2: "Sin letra chica.",
    body: "Mensualidad fija + comisión sobre venta atribuida. Sin permanencia. Sin costo oculto.",
    loading: "Cargando planes...",
    popularBadge: "Más elegido",
    perMonth: "/mes",
    setupLabel: "Setup",
    commissionLabel: "Comisión",
    customConsult: "Consultar",
    defaultCustomCta: "Hablar con ventas",
    defaultStandardCta: "Suscribirse",
    redirecting: "Redirigiendo...",
    errorPayment: "Error al crear sesión de pago",
    errorConnect: "Error al conectar con el sistema de pago",
    faqTitleStart: "Preguntas ",
    faqTitleHighlight: "frecuentes",
    faqTitleEnd: ".",
    faq: [
      ["¿Cómo funciona la comisión?", "Se cobra solo sobre ventas confirmadas generadas por la recomendación Skinner. Rastreo vía pixel o API. Solo pagas cuando Skinner genera venta."],
      ["¿Hay permanencia?", "No. Cancela cuando quieras. Historial exportable y datos disponibles por 30 días después de la cancelación."],
      ["¿LGPD?", "Foto descartada después del análisis por defecto. DPO dedicado. Conforme con ANPD. Acuerdo de tratamiento de datos disponible para análisis jurídico."],
      ["¿Cuánto tarda la implementación?", "14 días del contrato al primer reporte en producción. CSM acompaña los primeros 50 análisis."],
      ["¿Funciona con mi catálogo?", "Sí. Importación por CSV, integración con Bling, Tiny, Linx, VTEX, Shopify, o API directa."],
      ["¿Necesito hardware?", "No. Funciona en cualquier dispositivo con cámara. Tablet recomendado para PDV."],
    ],
    marketingMeta: {
      growth: { target: "Clínicas y farmacias independientes", popular: false },
      pro: { target: "Cadenas regionales y clínicas multi-unidad", popular: true },
      enterprise: { target: "Laboratorios, cadenas nacionales", popular: false },
    },
  },
  en: {
    eyebrow: "Plans",
    titleHighlight: "Plans",
    titleEnd: " simple.",
    titleLine2: "No fine print.",
    body: "Fixed monthly fee + commission on attributed sales. No lock-in. No hidden costs.",
    loading: "Loading plans...",
    popularBadge: "Most chosen",
    perMonth: "/mo",
    setupLabel: "Setup",
    commissionLabel: "Commission",
    customConsult: "Contact us",
    defaultCustomCta: "Talk to sales",
    defaultStandardCta: "Subscribe",
    redirecting: "Redirecting...",
    errorPayment: "Error creating payment session",
    errorConnect: "Error connecting to the payment system",
    faqTitleStart: "Frequent ",
    faqTitleHighlight: "questions",
    faqTitleEnd: ".",
    faq: [
      ["How does the commission work?", "Only charged on confirmed sales generated by Skinner recommendations. Tracking via pixel or API. You only pay when Skinner generates a sale."],
      ["Is there a lock-in?", "No. Cancel anytime. Exportable history and data available for 30 days after cancellation."],
      ["LGPD?", "Photo discarded after analysis by default. Dedicated DPO. ANPD-compliant. Data processing agreement available for legal review."],
      ["How long does implementation take?", "14 days from contract to first report in production. CSM accompanies the first 50 analyses."],
      ["Does it work with my catalog?", "Yes. CSV import, integration with Bling, Tiny, Linx, VTEX, Shopify, or direct API."],
      ["Do I need hardware?", "No. Works on any device with a camera. Tablet recommended for POS."],
    ],
    marketingMeta: {
      growth: { target: "Independent clinics and pharmacies", popular: false },
      pro: { target: "Regional chains and multi-location clinics", popular: true },
      enterprise: { target: "Laboratories, national chains", popular: false },
    },
  },
};

export default function PlanosPage() {
  const { locale } = useI18n();
  const c = COPY[locale];

  const [loading, setLoading] = useState<string | null>(null);
  const plansQuery = trpc.billing.publicPlans.useQuery();
  const plans = (plansQuery.data ?? [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

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
        alert(data.error || c.errorPayment);
        setLoading(null);
      }
    } catch {
      alert(c.errorConnect);
      setLoading(null);
    }
  }

  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.eyebrow}</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            <i className="text-terre">{c.titleHighlight}</i>{c.titleEnd}<br />{c.titleLine2}
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">{c.body}</p>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          {plansQuery.isLoading && (
            <p className="text-sm text-pierre font-light">{c.loading}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const meta = c.marketingMeta[p.id] ?? { target: "", popular: false };
              const priceLabel = p.customAllowed
                ? c.customConsult
                : `R$ ${p.monthlyPriceBRL.toLocaleString("pt-BR")}`;
              const setupLabel =
                p.customAllowed || !p.setupFeeBRL
                  ? "—"
                  : `R$ ${p.setupFeeBRL.toLocaleString("pt-BR")}`;
              const commissionLabel = `${(p.commissionRate * 100).toFixed(0)}%`;
              return (
                <div key={p.id} className={`relative p-8 border flex flex-col ${meta.popular ? "border-carbone bg-blanc-casse" : "border-sable/40 bg-white"}`}>
                  {meta.popular && <span className="absolute -top-3 left-8 font-mono text-[10px] tracking-[0.12em] uppercase text-blanc-casse bg-carbone px-3 py-1">{c.popularBadge}</span>}
                  {meta.target && (
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre">{meta.target}</p>
                  )}
                  <h2 className="font-serif text-4xl italic text-carbone mt-2">{p.name}</h2>
                  <div className="mt-4 mb-1">
                    <b className="font-serif text-3xl text-carbone">{priceLabel}</b>
                    {!p.customAllowed && <small className="text-pierre font-light text-sm ml-1">{c.perMonth}</small>}
                  </div>
                  <p className="text-[13px] text-pierre font-light">{c.setupLabel}: {setupLabel} · {c.commissionLabel}: {commissionLabel}</p>
                  <div className="h-px bg-sable/30 my-6" />
                  <ul className="flex flex-col gap-3 flex-1">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex gap-3 text-sm text-terre font-light">
                        <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  {p.customAllowed ? (
                    <Link href="/contato" className="mt-8 block text-center py-4 text-sm tracking-[0.02em] transition-all border border-sable text-carbone hover:bg-ivoire hover:border-carbone">
                      {p.ctaText || c.defaultCustomCta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCheckout(p.id)}
                      disabled={loading === p.id}
                      className={`mt-8 block w-full text-center py-4 text-sm tracking-[0.02em] transition-all disabled:opacity-50 ${
                        meta.popular
                          ? "bg-carbone text-blanc-casse border border-carbone hover:bg-terre"
                          : "border border-sable text-carbone hover:bg-ivoire hover:border-carbone"
                      }`}
                    >
                      {loading === p.id ? c.redirecting : (p.ctaText || c.defaultStandardCta)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-24">
            <h3 className="font-serif text-[28px] text-carbone mb-8">{c.faqTitleStart}<i className="text-terre">{c.faqTitleHighlight}</i>{c.faqTitleEnd}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {c.faq.map(([q, a], i) => (
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
