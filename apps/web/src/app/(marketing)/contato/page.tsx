"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

type Copy = {
  heroEyebrow: string;
  heroTitleHighlight: string;
  heroTitleEnd: string;
  heroBody: string;
  expectEyebrow: string;
  expectTitleStart: string;
  expectTitleHighlight: string;
  expectTitleEnd: string;
  expectBullets: string[];
  contactComm: string;
  contactWhatsapp: string;
  contactAddress: string;
  receivedLabel: string;
  thankYouMain: string;
  thankYouItalic: string;
  formEyebrow: string;
  formName: string;
  formNamePlaceholder: string;
  formEmail: string;
  formEmailPlaceholder: string;
  formCompany: string;
  formCompanyPlaceholder: string;
  formSegment: string;
  formSegmentEmpty: string;
  formSegmentOptions: { clinic: string; lab: string; pharmacy: string; retail: string; other: string };
  formMessage: string;
  formMessagePlaceholder: string;
  formSubmit: string;
  segmentToLabel: Record<string, string>;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    heroEyebrow: "Contato",
    heroTitleHighlight: "Vamos",
    heroTitleEnd: " conversar.",
    heroBody: "Demo de 25 min com o time de produto. A gente entende seu modelo de negócio e desenha um piloto sob medida.",
    expectEyebrow: "O que esperar",
    expectTitleStart: "Em ",
    expectTitleHighlight: "25 min",
    expectTitleEnd: ", a gente cobre:",
    expectBullets: [
      "Tour pelo produto (10 min)",
      "Casos parecidos com o seu (5 min)",
      "Análise rápida do seu funil atual (5 min)",
      "Plano de piloto desenhado ao vivo (5 min)",
    ],
    contactComm: "comercial",
    contactWhatsapp: "whatsapp",
    contactAddress: "endereço",
    receivedLabel: "Recebido",
    thankYouMain: "Obrigado.",
    thankYouItalic: "em até 1 dia útil",
    formEyebrow: "Preencha pra agendar",
    formName: "Nome",
    formNamePlaceholder: "Seu nome completo",
    formEmail: "Email corporativo",
    formEmailPlaceholder: "você@empresa.com.br",
    formCompany: "Empresa",
    formCompanyPlaceholder: "Razão social ou nome fantasia",
    formSegment: "Segmento",
    formSegmentEmpty: "— Selecione —",
    formSegmentOptions: { clinic: "Clínica", lab: "Laboratório", pharmacy: "Farmácia", retail: "Varejo", other: "Outro" },
    formMessage: "Mensagem",
    formMessagePlaceholder: "Conta um pouco do que você procura.",
    formSubmit: "Solicitar demo →",
    segmentToLabel: { laboratorios: "Laboratório", clinicas: "Clínica", farmacias: "Farmácia", varejo: "Varejo" },
  },
  es: {
    heroEyebrow: "Contacto",
    heroTitleHighlight: "Vamos",
    heroTitleEnd: " a conversar.",
    heroBody: "Demo de 25 min con el equipo de producto. Entendemos tu modelo de negocio y diseñamos un piloto a medida.",
    expectEyebrow: "Qué esperar",
    expectTitleStart: "En ",
    expectTitleHighlight: "25 min",
    expectTitleEnd: ", cubrimos:",
    expectBullets: [
      "Tour por el producto (10 min)",
      "Casos parecidos al tuyo (5 min)",
      "Análisis rápido de tu embudo actual (5 min)",
      "Plan piloto diseñado en vivo (5 min)",
    ],
    contactComm: "comercial",
    contactWhatsapp: "whatsapp",
    contactAddress: "dirección",
    receivedLabel: "Recibido",
    thankYouMain: "Gracias.",
    thankYouItalic: "en máximo 1 día hábil",
    formEyebrow: "Completa para agendar",
    formName: "Nombre",
    formNamePlaceholder: "Tu nombre completo",
    formEmail: "Email corporativo",
    formEmailPlaceholder: "tu@empresa.com",
    formCompany: "Empresa",
    formCompanyPlaceholder: "Razón social o nombre comercial",
    formSegment: "Segmento",
    formSegmentEmpty: "— Selecciona —",
    formSegmentOptions: { clinic: "Clínica", lab: "Laboratorio", pharmacy: "Farmacia", retail: "Retail", other: "Otro" },
    formMessage: "Mensaje",
    formMessagePlaceholder: "Cuéntanos un poco lo que buscas.",
    formSubmit: "Solicitar demo →",
    segmentToLabel: { laboratorios: "Laboratorio", clinicas: "Clínica", farmacias: "Farmacia", varejo: "Retail" },
  },
  en: {
    heroEyebrow: "Contact",
    heroTitleHighlight: "Let's",
    heroTitleEnd: " talk.",
    heroBody: "25-min demo with the product team. We understand your business model and design a tailored pilot.",
    expectEyebrow: "What to expect",
    expectTitleStart: "In ",
    expectTitleHighlight: "25 min",
    expectTitleEnd: ", we cover:",
    expectBullets: [
      "Product tour (10 min)",
      "Cases similar to yours (5 min)",
      "Quick analysis of your current funnel (5 min)",
      "Pilot plan designed live (5 min)",
    ],
    contactComm: "commercial",
    contactWhatsapp: "whatsapp",
    contactAddress: "address",
    receivedLabel: "Received",
    thankYouMain: "Thanks.",
    thankYouItalic: "within 1 business day",
    formEyebrow: "Fill in to schedule",
    formName: "Name",
    formNamePlaceholder: "Your full name",
    formEmail: "Work email",
    formEmailPlaceholder: "you@company.com",
    formCompany: "Company",
    formCompanyPlaceholder: "Legal or trade name",
    formSegment: "Segment",
    formSegmentEmpty: "— Select —",
    formSegmentOptions: { clinic: "Clinic", lab: "Laboratory", pharmacy: "Pharmacy", retail: "Retail", other: "Other" },
    formMessage: "Message",
    formMessagePlaceholder: "Tell us a bit about what you're looking for.",
    formSubmit: "Request demo →",
    segmentToLabel: { laboratorios: "Laboratory", clinicas: "Clinic", farmacias: "Pharmacy", varejo: "Retail" },
  },
};

function ContatoForm() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const searchParams = useSearchParams();
  const initialSegment = searchParams.get("segment") ?? "";
  const initialSegmentLabel = c.segmentToLabel[initialSegment] ?? "";

  const [sent, setSent] = useState(false);
  const [segment, setSegment] = useState(initialSegmentLabel);

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
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.heroEyebrow}</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            <i className="text-terre">{c.heroTitleHighlight}</i>{c.heroTitleEnd}
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">{c.heroBody}</p>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.expectEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {c.expectTitleStart}<i className="text-terre">{c.expectTitleHighlight}</i>{c.expectTitleEnd}
            </h2>
            <ul className="flex flex-col gap-3">
              {c.expectBullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-4">
              <div className="flex gap-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre w-24">{c.contactComm}</span>
                <span className="text-sm text-carbone">vendas@skinner.lat</span>
              </div>
              <div className="flex gap-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre w-24">{c.contactWhatsapp}</span>
                <span className="text-sm text-carbone">+55 11 9 8888-0000</span>
              </div>
              <div className="flex gap-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre w-24">{c.contactAddress}</span>
                <span className="text-sm text-carbone">São Paulo, SP</span>
              </div>
            </div>
          </div>

          {sent ? (
            <div className="p-12 border border-sable/30 bg-white flex flex-col justify-center">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-2">{c.receivedLabel}</p>
              <h3 className="font-serif text-[28px] text-carbone">
                {c.thankYouMain}<br /><i className="text-terre">{c.thankYouItalic}</i>.
              </h3>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 border border-sable/30 bg-white space-y-5">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre">{c.formEyebrow}</p>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">{c.formName}</span>
                <input name="name" type="text" required placeholder={c.formNamePlaceholder} className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">{c.formEmail}</span>
                <input name="email" type="email" required placeholder={c.formEmailPlaceholder} className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">{c.formCompany}</span>
                <input name="company" type="text" placeholder={c.formCompanyPlaceholder} className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">{c.formSegment}</span>
                <select
                  name="segment"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
                >
                  <option value="">{c.formSegmentEmpty}</option>
                  <option>{c.formSegmentOptions.clinic}</option>
                  <option>{c.formSegmentOptions.lab}</option>
                  <option>{c.formSegmentOptions.pharmacy}</option>
                  <option>{c.formSegmentOptions.retail}</option>
                  <option>{c.formSegmentOptions.other}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-carbone block mb-1">{c.formMessage}</span>
                <textarea name="message" rows={3} placeholder={c.formMessagePlaceholder} className="w-full px-4 py-3 border border-sable/30 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre" />
              </label>
              <button type="submit" className="w-full py-4 bg-carbone text-blanc-casse text-sm tracking-[0.02em] hover:bg-terre transition-all">
                {c.formSubmit}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

export default function ContatoPage() {
  return (
    <Suspense>
      <ContatoForm />
    </Suspense>
  );
}
