import { resolveLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

// metadata is server-static and computed at build time. We hardcode pt-BR
// for now because Next.js metadata API can't read async cookies in
// generateMetadata for static routes without forcing dynamic. SEO-wise OK
// because the marketing site doesn't currently have URL-prefix routing
// for locales — visitors search in their own language and find translated
// page content via the cookie-driven runtime.
export const metadata = {
  title: "Pixel de Conversão — Skinner",
  description:
    "Documentação técnica do pixel de conversão Skinner para rastrear vendas geradas via recomendações da análise de pele.",
};

const trackPurchaseSnippet = `<!-- Cole no thank-you page do seu e-commerce.
     Substitua RECOMMENDATION_ID e SALE_VALUE pelos valores reais. -->
<script>
  fetch("https://app.skinner.lat/api/pixel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: "RECOMMENDATION_ID",
      value: SALE_VALUE
    })
  });
</script>`;

const trackClickSnippet = `<!-- Use como pixel transparente em emails ou páginas -->
<img src="https://app.skinner.lat/api/pixel?ref=RECOMMENDATION_ID"
     width="1" height="1" alt="" />`;

type Copy = {
  eyebrow: string;
  title: string;
  intro: string;
  howItWorksH: string;
  howItWorksBody1: string;
  howItWorksBody2: string;
  s1H: string;
  s1Body: string;
  s2H: string;
  s2Body: string;
  s3H: string;
  s3Body: string;
  s4H: string;
  s4Body: string;
  contactBody: string;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Documentação técnica",
    title: "Pixel de Conversão",
    intro: "Rastreie vendas geradas a partir das recomendações da análise de pele Skinner. Os dados aparecem automaticamente no dashboard do seu portal B2B.",
    howItWorksH: "Como funciona",
    howItWorksBody1: "Quando um paciente conclui uma análise, cada produto recomendado recebe um identificador único (",
    howItWorksBody2: "). Quando esse paciente compra um produto recomendado, você envia esse identificador junto com o valor da venda para o pixel Skinner. O sistema registra a conversão, calcula a comissão e atualiza o relatório do período.",
    s1H: "1. Compra confirmada (POST)",
    s1Body: "Cole o snippet abaixo no thank-you page (página de \"compra confirmada\") do seu e-commerce. Substitua os placeholders pelos valores que você já tem no carrinho.",
    s2H: "2. Click tracking (GET)",
    s2Body: "Para rastrear cliques (sem valor de venda), use a imagem pixel transparente. Funciona em emails marketing, landing pages e qualquer contexto onde JavaScript não está disponível.",
    s3H: "Onde encontrar o recommendationId",
    s3Body: " está disponível no link de cada produto recomendado no resultado da análise. Se você usa integração com Nuvemshop ou Shopify, o identificador é propagado automaticamente via UTM. Para integrações manuais, contate o suporte e ajustamos o pipeline.",
    s4H: "Privacidade e LGPD",
    s4Body: "O pixel registra apenas o identificador da recomendação e o valor da venda. Não coleta IP, cookies de terceiros, nem dados pessoais do cliente final. É compatível com LGPD sem necessidade de consentimento explícito do usuário.",
    contactBody: "Dúvidas técnicas? Contate o time Skinner em ",
  },
  es: {
    eyebrow: "Documentación técnica",
    title: "Pixel de Conversión",
    intro: "Rastrea ventas generadas a partir de las recomendaciones del análisis de piel Skinner. Los datos aparecen automáticamente en el dashboard de tu portal B2B.",
    howItWorksH: "Cómo funciona",
    howItWorksBody1: "Cuando un paciente concluye un análisis, cada producto recomendado recibe un identificador único (",
    howItWorksBody2: "). Cuando ese paciente compra un producto recomendado, envías ese identificador junto con el valor de la venta al pixel Skinner. El sistema registra la conversión, calcula la comisión y actualiza el reporte del período.",
    s1H: "1. Compra confirmada (POST)",
    s1Body: "Pega el snippet abajo en el thank-you page (página de \"compra confirmada\") de tu e-commerce. Reemplaza los placeholders con los valores que ya tienes en el carrito.",
    s2H: "2. Click tracking (GET)",
    s2Body: "Para rastrear clics (sin valor de venta), usa la imagen pixel transparente. Funciona en emails marketing, landing pages y cualquier contexto donde JavaScript no esté disponible.",
    s3H: "Dónde encontrar el recommendationId",
    s3Body: " está disponible en el link de cada producto recomendado en el resultado del análisis. Si usas integración con Nuvemshop o Shopify, el identificador se propaga automáticamente vía UTM. Para integraciones manuales, contacta al soporte y ajustamos el pipeline.",
    s4H: "Privacidad y LGPD",
    s4Body: "El pixel registra solamente el identificador de la recomendación y el valor de la venta. No recolecta IP, cookies de terceros ni datos personales del cliente final. Es compatible con LGPD sin necesidad de consentimiento explícito del usuario.",
    contactBody: "¿Dudas técnicas? Contacta al equipo Skinner en ",
  },
  en: {
    eyebrow: "Technical documentation",
    title: "Conversion Pixel",
    intro: "Track sales generated from Skinner skin-analysis recommendations. Data appears automatically in your B2B portal dashboard.",
    howItWorksH: "How it works",
    howItWorksBody1: "When a patient completes an analysis, each recommended product receives a unique identifier (",
    howItWorksBody2: "). When that patient buys a recommended product, you send that identifier along with the sale value to the Skinner pixel. The system records the conversion, calculates the commission and updates the period report.",
    s1H: "1. Confirmed purchase (POST)",
    s1Body: "Paste the snippet below into your e-commerce thank-you page. Replace the placeholders with the values you already have in the cart.",
    s2H: "2. Click tracking (GET)",
    s2Body: "To track clicks (without sale value), use the transparent pixel image. Works in marketing emails, landing pages and any context where JavaScript isn't available.",
    s3H: "Where to find the recommendationId",
    s3Body: " is available in the link of each recommended product in the analysis result. If you use Nuvemshop or Shopify integration, the identifier is propagated automatically via UTM. For manual integrations, contact support and we'll adjust the pipeline.",
    s4H: "Privacy and LGPD",
    s4Body: "The pixel only records the recommendation identifier and the sale value. It does not collect IP, third-party cookies or personal data of the end customer. Compliant with LGPD without need for explicit user consent.",
    contactBody: "Technical questions? Contact the Skinner team at ",
  },
};

export default async function PixelDocsPage() {
  const locale = await resolveLocale();
  const c = COPY[locale];

  return (
    <main className="min-h-screen bg-blanc-casse">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="border-b border-sable/30 pb-6 mb-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">{c.eyebrow}</p>
          <h1 className="font-serif text-3xl text-carbone">{c.title}</h1>
          <p className="text-sm text-pierre font-light mt-3">{c.intro}</p>
        </div>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl text-carbone">{c.howItWorksH}</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            {c.howItWorksBody1}
            <code className="text-carbone bg-ivoire px-1.5 py-0.5">recommendationId</code>
            {c.howItWorksBody2}
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">{c.s1H}</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">{c.s1Body}</p>
          <pre className="bg-carbone text-blanc-casse text-xs p-5 overflow-x-auto font-mono leading-relaxed">
{trackPurchaseSnippet}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">{c.s2H}</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">{c.s2Body}</p>
          <pre className="bg-carbone text-blanc-casse text-xs p-5 overflow-x-auto font-mono leading-relaxed">
{trackClickSnippet}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">{c.s3H}</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            <code className="text-carbone bg-ivoire px-1.5 py-0.5">recommendationId</code>
            {c.s3Body}
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">{c.s4H}</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">{c.s4Body}</p>
        </section>

        <div className="border-t border-sable/30 pt-6">
          <p className="text-xs text-pierre font-light">
            {c.contactBody}
            <a href="mailto:suporte@skinner.lat" className="text-carbone hover:underline">
              suporte@skinner.lat
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
