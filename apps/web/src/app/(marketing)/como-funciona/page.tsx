import Image from "next/image";
import Link from "next/link";
import { resolveLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

// Localized page copy. REVIEW_TRANSLATION_HUMAN: es/en done by AI.
type PageCopy = {
  heroEyebrow: string;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroTitleEnd: string;
  heroBody: string;
  s01Eyebrow: string;
  s01TitleStart: string;
  s01TitleHighlight: string;
  s01TitleEnd: string;
  s01Body: string;
  s01Bullets: string[];
  s01CardLabel: string;
  s01CardLightOk: string;
  s01CardAngleOk: string;
  s01CardQuestion: string;
  s01CardQ: string;
  s01CardOptions: string[];
  s01CardCta: string;
  s02Eyebrow: string;
  s02TitleStart: string;
  s02TitleHighlight: string;
  s02TitleEnd: string;
  s02Body: string;
  s02Stats: { v: string; l: string }[];
  s03Eyebrow: string;
  s03TitleStart: string;
  s03TitleHighlight: string;
  s03TitleEnd: string;
  s03Body: string;
  s03Bullets: string[];
  s03ImgAlt: string;
  stackEyebrow: string;
  stackTitleStart: string;
  stackTitleHighlight: string;
  stackTitleEnd: string;
  stackBody: string;
  stackCards: { t: string; d: string }[];
  ctaEyebrow: string;
  ctaTitleStart: string;
  ctaTitleHighlight: string;
  ctaTitleEnd: string;
  ctaButton: string;
};

const COPY: Record<Locale, PageCopy> = {
  "pt-BR": {
    heroEyebrow: "Produto · v1.0",
    heroTitleStart: "Como o ",
    heroTitleHighlight: "Skinner",
    heroTitleEnd: " funciona.",
    heroBody: "Quatro etapas. Três minutos. Um diagnóstico que fecha venda. Veja por dentro do motor de IA, do relatório do paciente e do painel do gestor.",
    s01Eyebrow: "01 — Captura",
    s01TitleStart: "Foto, questionário, ",
    s01TitleHighlight: "contexto",
    s01TitleEnd: ".",
    s01Body: "Em qualquer canal — site, tablet do PDV, WhatsApp, app da clínica. Captura otimizada por orientação visual de iluminação e enquadramento.",
    s01Bullets: [
      "Orientação ao vivo de iluminação e ângulo",
      "Detecção automática de fototipo Fitzpatrick",
      "Foto descartada após análise (LGPD-friendly)",
      "Funciona offline e sincroniza depois",
    ],
    s01CardLabel: "CAPTURA · LIVE",
    s01CardLightOk: "ILUMINAÇÃO ✓",
    s01CardAngleOk: "ÂNGULO ✓",
    s01CardQuestion: "Questionário · 3/7",
    s01CardQ: "Como sua pele se comporta no fim do dia?",
    s01CardOptions: ["Brilha em testa, nariz e queixo", "Brilha em todo o rosto", "Fica repuxada, sem brilho", "Sem alteração"],
    s01CardCta: "Continuar →",
    s02Eyebrow: "02 — Análise",
    s02TitleStart: "IA proprietária treinada em ",
    s02TitleHighlight: "847k",
    s02TitleEnd: " imagens.",
    s02Body: "Modelo dermatológico próprio, validado clinicamente, que classifica condições em escala de 5 níveis e gera um match score por produto do seu catálogo.",
    s02Stats: [
      { v: "847k", l: "imagens de treino" },
      { v: "23", l: "condições detectadas" },
      { v: "0.94", l: "F1-score validado" },
      { v: "1.8s", l: "tempo de inferência" },
    ],
    s03Eyebrow: "03 — Recomendação",
    s03TitleStart: "Seu catálogo, ",
    s03TitleHighlight: "inteligente",
    s03TitleEnd: ".",
    s03Body: "Importa o catálogo via CSV ou conexão direta com a loja. Cada SKU é cruzado com ingredientes, indicações e contraindicações antes de chegar à recomendação.",
    s03Bullets: [
      "142 atributos por SKU avaliados",
      "Filtro automático de contraindicação",
      "Ordenação por match score + estoque + margem",
      "Integração Bling, Tiny, Linx, VTEX, Shopify",
    ],
    s03ImgAlt: "Painel de gestão do catálogo Skinner com produtos, ingredientes e match score",
    stackEyebrow: "Stack",
    stackTitleStart: "Construído pra ",
    stackTitleHighlight: "escalar",
    stackTitleEnd: " sem fricção.",
    stackBody: "Compliance, integrações e performance que acompanham seu modelo de negócio — em qualquer mercado.",
    stackCards: [
      { t: "Compliance regional", d: "LGPD, GDPR e equivalentes locais. DPO dedicado. Foto descartada por padrão após análise." },
      { t: "Marca branca multi-tenant", d: "Subdomínio próprio, paleta, tipografia e copy ajustáveis por canal. Zero indício de Skinner." },
      { t: "Integrações abertas", d: "API REST, webhooks e SDKs. Conexão direta com e-commerce, ERP, prontuário e CRM." },
      { t: "Multi-canal nativo", d: "WhatsApp Business API, e-mail transacional, link compartilhável e widget embed para qualquer site." },
      { t: "Pagamento flexível", d: "Stripe, MercadoPago, Pagar.me e gateways locais. Checkout no carrinho do cliente, sem fricção." },
      { t: "Infraestrutura distribuída", d: "Multi-região com baixa latência. Backups automatizados. SLA de uptime 99.9% contratual." },
    ],
    ctaEyebrow: "Próximo passo",
    ctaTitleStart: "Veja na ",
    ctaTitleHighlight: "prática",
    ctaTitleEnd: ".",
    ctaButton: "Solicitar demo →",
  },
  es: {
    heroEyebrow: "Producto · v1.0",
    heroTitleStart: "Cómo funciona ",
    heroTitleHighlight: "Skinner",
    heroTitleEnd: ".",
    heroBody: "Cuatro etapas. Tres minutos. Un diagnóstico que cierra venta. Conoce por dentro el motor de IA, el reporte del paciente y el panel del gestor.",
    s01Eyebrow: "01 — Captura",
    s01TitleStart: "Foto, cuestionario, ",
    s01TitleHighlight: "contexto",
    s01TitleEnd: ".",
    s01Body: "En cualquier canal — sitio, tablet del PDV, WhatsApp, app de la clínica. Captura optimizada con guía visual de iluminación y encuadre.",
    s01Bullets: [
      "Guía en vivo de iluminación y ángulo",
      "Detección automática de fototipo Fitzpatrick",
      "Foto descartada después del análisis (LGPD-friendly)",
      "Funciona offline y sincroniza después",
    ],
    s01CardLabel: "CAPTURA · LIVE",
    s01CardLightOk: "ILUMINACIÓN ✓",
    s01CardAngleOk: "ÁNGULO ✓",
    s01CardQuestion: "Cuestionario · 3/7",
    s01CardQ: "¿Cómo se comporta tu piel al final del día?",
    s01CardOptions: ["Brilla en frente, nariz y mentón", "Brilla en todo el rostro", "Se siente tirante, sin brillo", "Sin alteración"],
    s01CardCta: "Continuar →",
    s02Eyebrow: "02 — Análisis",
    s02TitleStart: "IA propietaria entrenada en ",
    s02TitleHighlight: "847k",
    s02TitleEnd: " imágenes.",
    s02Body: "Modelo dermatológico propio, validado clínicamente, que clasifica condiciones en escala de 5 niveles y genera un match score por producto de tu catálogo.",
    s02Stats: [
      { v: "847k", l: "imágenes de entrenamiento" },
      { v: "23", l: "condiciones detectadas" },
      { v: "0.94", l: "F1-score validado" },
      { v: "1.8s", l: "tiempo de inferencia" },
    ],
    s03Eyebrow: "03 — Recomendación",
    s03TitleStart: "Tu catálogo, ",
    s03TitleHighlight: "inteligente",
    s03TitleEnd: ".",
    s03Body: "Importa el catálogo vía CSV o conexión directa con la tienda. Cada SKU se cruza con ingredientes, indicaciones y contraindicaciones antes de llegar a la recomendación.",
    s03Bullets: [
      "142 atributos por SKU evaluados",
      "Filtro automático de contraindicación",
      "Orden por match score + stock + margen",
      "Integración Bling, Tiny, Linx, VTEX, Shopify",
    ],
    s03ImgAlt: "Panel de gestión del catálogo Skinner con productos, ingredientes y match score",
    stackEyebrow: "Stack",
    stackTitleStart: "Construido para ",
    stackTitleHighlight: "escalar",
    stackTitleEnd: " sin fricción.",
    stackBody: "Compliance, integraciones y performance que acompañan tu modelo de negocio — en cualquier mercado.",
    stackCards: [
      { t: "Compliance regional", d: "LGPD, GDPR y equivalentes locales. DPO dedicado. Foto descartada por defecto después del análisis." },
      { t: "Marca blanca multi-tenant", d: "Subdominio propio, paleta, tipografía y copy ajustables por canal. Cero indicio de Skinner." },
      { t: "Integraciones abiertas", d: "API REST, webhooks y SDKs. Conexión directa con e-commerce, ERP, prontuario y CRM." },
      { t: "Multi-canal nativo", d: "WhatsApp Business API, email transaccional, link compartible y widget embed para cualquier sitio." },
      { t: "Pago flexible", d: "Stripe, MercadoPago, Pagar.me y gateways locales. Checkout en el carrito del cliente, sin fricción." },
      { t: "Infraestructura distribuida", d: "Multi-región con baja latencia. Backups automatizados. SLA de uptime 99.9% contractual." },
    ],
    ctaEyebrow: "Próximo paso",
    ctaTitleStart: "Velo en la ",
    ctaTitleHighlight: "práctica",
    ctaTitleEnd: ".",
    ctaButton: "Solicitar demo →",
  },
  en: {
    heroEyebrow: "Product · v1.0",
    heroTitleStart: "How ",
    heroTitleHighlight: "Skinner",
    heroTitleEnd: " works.",
    heroBody: "Four steps. Three minutes. A diagnosis that closes the sale. See inside the AI engine, the patient report and the manager's dashboard.",
    s01Eyebrow: "01 — Capture",
    s01TitleStart: "Photo, questionnaire, ",
    s01TitleHighlight: "context",
    s01TitleEnd: ".",
    s01Body: "On any channel — site, POS tablet, WhatsApp, clinic app. Capture optimized with visual lighting and framing guidance.",
    s01Bullets: [
      "Live lighting and angle guidance",
      "Automatic Fitzpatrick phototype detection",
      "Photo discarded after analysis (LGPD-friendly)",
      "Works offline and syncs later",
    ],
    s01CardLabel: "CAPTURE · LIVE",
    s01CardLightOk: "LIGHTING ✓",
    s01CardAngleOk: "ANGLE ✓",
    s01CardQuestion: "Questionnaire · 3/7",
    s01CardQ: "How does your skin feel at the end of the day?",
    s01CardOptions: ["Shines on forehead, nose and chin", "Shines all over the face", "Feels tight, no shine", "No change"],
    s01CardCta: "Continue →",
    s02Eyebrow: "02 — Analysis",
    s02TitleStart: "Proprietary AI trained on ",
    s02TitleHighlight: "847k",
    s02TitleEnd: " images.",
    s02Body: "Proprietary dermatological model, clinically validated, that classifies conditions on a 5-level scale and generates a match score per product from your catalog.",
    s02Stats: [
      { v: "847k", l: "training images" },
      { v: "23", l: "detected conditions" },
      { v: "0.94", l: "validated F1-score" },
      { v: "1.8s", l: "inference time" },
    ],
    s03Eyebrow: "03 — Recommendation",
    s03TitleStart: "Your catalog, ",
    s03TitleHighlight: "intelligent",
    s03TitleEnd: ".",
    s03Body: "Import the catalog via CSV or direct store connection. Each SKU is cross-checked with ingredients, indications and contraindications before reaching the recommendation.",
    s03Bullets: [
      "142 attributes per SKU evaluated",
      "Automatic contraindication filter",
      "Ranked by match score + stock + margin",
      "Bling, Tiny, Linx, VTEX, Shopify integration",
    ],
    s03ImgAlt: "Skinner catalog management panel with products, ingredients and match score",
    stackEyebrow: "Stack",
    stackTitleStart: "Built to ",
    stackTitleHighlight: "scale",
    stackTitleEnd: " without friction.",
    stackBody: "Compliance, integrations and performance that follow your business model — in any market.",
    stackCards: [
      { t: "Regional compliance", d: "LGPD, GDPR and local equivalents. Dedicated DPO. Photo discarded by default after analysis." },
      { t: "White-label multi-tenant", d: "Own subdomain, palette, typography and copy adjustable per channel. Zero Skinner branding." },
      { t: "Open integrations", d: "REST API, webhooks and SDKs. Direct connection with e-commerce, ERP, EMR and CRM." },
      { t: "Native multi-channel", d: "WhatsApp Business API, transactional email, shareable link and embed widget for any site." },
      { t: "Flexible payments", d: "Stripe, MercadoPago, Pagar.me and local gateways. Checkout in the customer's cart, no friction." },
      { t: "Distributed infrastructure", d: "Multi-region with low latency. Automated backups. Contractual 99.9% uptime SLA." },
    ],
    ctaEyebrow: "Next step",
    ctaTitleStart: "See it in ",
    ctaTitleHighlight: "practice",
    ctaTitleEnd: ".",
    ctaButton: "Request demo →",
  },
};

export default async function ComoFuncionaPage() {
  const locale = await resolveLocale();
  const c = COPY[locale];

  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.heroEyebrow}</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            {c.heroTitleStart}<i className="text-terre">{c.heroTitleHighlight}</i>{c.heroTitleEnd}
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">{c.heroBody}</p>
        </div>
      </section>

      {/* 01 — Captura */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.s01Eyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {c.s01TitleStart}<i className="text-terre">{c.s01TitleHighlight}</i>{c.s01TitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">{c.s01Body}</p>
            <ul className="flex flex-col gap-3">
              {c.s01Bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-pierre/25 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.18)] overflow-hidden">
            <div className="h-8 bg-ivoire flex items-center px-3 gap-1.5 border-b border-pierre/20">
              <span className="w-2 h-2 rounded-full bg-sable/70" /><span className="w-2 h-2 rounded-full bg-sable/70" /><span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="font-mono text-[9px] text-pierre mx-auto tracking-[0.04em]">analise.skinner.lat/captura</span>
            </div>
            <div className="p-8 flex gap-6">
              <div className="relative w-[48%] min-h-[380px] bg-ivoire">
                <div className="absolute inset-6 border border-dashed border-pierre/40" />
                <span className="absolute top-4 left-4 font-mono text-[9px] tracking-[0.1em] text-terre">{c.s01CardLabel}</span>
                <span className="absolute bottom-4 left-4 font-mono text-[9px] text-terre">{c.s01CardLightOk}</span>
                <span className="absolute bottom-4 right-4 font-mono text-[9px] text-terre">{c.s01CardAngleOk}</span>
              </div>
              <div className="flex-1">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-1">{c.s01CardQuestion}</p>
                <h3 className="font-serif text-[22px] italic text-carbone mt-1.5 mb-[18px]">{c.s01CardQ}</h3>
                {c.s01CardOptions.map((q, i) => (
                  <label key={i} className={`flex items-center gap-3 px-4 py-3.5 border border-pierre/20 mb-2 text-[13px] text-carbone ${i === 0 ? "bg-ivoire" : "bg-white"}`}>
                    <span className={`w-3.5 h-3.5 rounded-full border border-sable ${i === 0 ? "bg-carbone" : "bg-white"}`} />
                    {q}
                  </label>
                ))}
                <button className="mt-4 px-[22px] py-3 bg-carbone text-blanc-casse text-[13px] tracking-[0.02em]">{c.s01CardCta}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — Analise */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.s02Eyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {c.s02TitleStart}<i className="text-terre">{c.s02TitleHighlight}</i>{c.s02TitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">{c.s02Body}</p>
            <div className="grid grid-cols-2 border-t border-l border-sable/40">
              {c.s02Stats.map((s, i) => (
                <div key={i} className="p-5 border-b border-r border-sable/40">
                  <b className="font-serif text-[32px] italic text-carbone block leading-none">{s.v}</b>
                  <span className="text-[11px] text-pierre block mt-2 leading-snug">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Recomendacao */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.s03Eyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {c.s03TitleStart}<i className="text-terre">{c.s03TitleHighlight}</i>{c.s03TitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">{c.s03Body}</p>
            <ul className="flex flex-col gap-3">
              {c.s03Bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative w-full aspect-[1663/914] shadow-[0_30px_60px_-20px_rgba(28,25,23,0.18)]">
            <Image
              src="/marketing/screenshots/catalog-admin.jpg"
              alt={c.s03ImgAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
              className="object-cover object-top border border-pierre/20"
            />
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.stackEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              {c.stackTitleStart}<i className="text-terre">{c.stackTitleHighlight}</i>{c.stackTitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mt-6 max-w-[620px] mx-auto">{c.stackBody}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.stackCards.map((x, i) => (
              <div key={i} className="p-8 border border-sable/40 bg-blanc-casse">
                <span className="font-mono text-[10px] tracking-[0.12em] text-sable">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif text-xl text-carbone mt-3 mb-2">{x.t}</h3>
                <p className="text-[13px] text-pierre font-light leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-ivoire border-t border-sable/40">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.ctaEyebrow}</p>
          <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
            {c.ctaTitleStart}<i className="text-terre">{c.ctaTitleHighlight}</i>{c.ctaTitleEnd}
          </h2>
          <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block">
            {c.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
