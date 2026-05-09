import { resolveLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

type Section = { h: string; body: string };
type Copy = { eyebrow: string; title: string; sections: Section[]; lastUpdate: string };

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Legal",
    title: "Termos de Uso",
    sections: [
      { h: "1. Aceitação", body: "Ao utilizar a plataforma Skinner, você concorda com estes termos de uso. Se você é um cliente B2B, um Contrato de Prestação de Serviços (SLA) separado pode ser aplicável." },
      { h: "2. Descrição do serviço", body: "Skinner é uma plataforma SaaS B2B de inteligência dermatológica que oferece análise facial por IA e recomendação personalizada de produtos. O serviço é contratado por empresas (tenants) e disponibilizado aos seus clientes finais." },
      { h: "3. Disclaimer médico", body: "A análise de pele fornecida pela Skinner é exclusivamente informativa e educacional. Não constitui diagnóstico médico, prescrição ou aconselhamento profissional de saúde. Sempre consulte um dermatologista para condições de pele que necessitem tratamento médico." },
      { h: "4. Uso aceitável", body: "O cliente B2B se compromete a: utilizar a plataforma apenas para fins legítimos, não tentar reverter a engenharia do motor de análise, não compartilhar credenciais de acesso e manter seu catálogo de produtos atualizado e verídico." },
      { h: "5. Propriedade intelectual", body: "A base dermatológica, algoritmos de matching, modelos de análise e marca Skinner são propriedade exclusiva da Skinner. O conteúdo do catálogo de produtos e os dados de clientes finais pertencem ao respectivo cliente B2B." },
      { h: "6. Faturamento", body: "A cobrança é realizada mensalmente via Stripe. Inclui mensalidade fixa, análises excedentes ao limite do plano e comissão sobre vendas rastreadas. O cancelamento pode ser feito a qualquer momento e entra em vigor no final do ciclo corrente." },
      { h: "7. Limitação de responsabilidade", body: "A Skinner não se responsabiliza por decisões de compra tomadas pelo consumidor final com base nas recomendações da plataforma. A responsabilidade sobre os produtos recomendados é exclusiva do cliente B2B que os cadastrou." },
      { h: "8. Alterações", body: "Estes termos podem ser atualizados periodicamente. Alterações significativas serão comunicadas por e-mail aos clientes B2B com 30 dias de antecedência." },
    ],
    lastUpdate: "Última atualização: abril de 2026.",
  },
  es: {
    eyebrow: "Legal",
    title: "Términos de Uso",
    sections: [
      { h: "1. Aceptación", body: "Al utilizar la plataforma Skinner, aceptas estos términos de uso. Si eres cliente B2B, puede aplicar un Contrato de Prestación de Servicios (SLA) separado." },
      { h: "2. Descripción del servicio", body: "Skinner es una plataforma SaaS B2B de inteligencia dermatológica que ofrece análisis facial por IA y recomendación personalizada de productos. El servicio es contratado por empresas (tenants) y disponibilizado a sus clientes finales." },
      { h: "3. Disclaimer médico", body: "El análisis de piel provisto por Skinner es exclusivamente informativo y educacional. No constituye diagnóstico médico, prescripción ni consejo profesional de salud. Siempre consulta a un dermatólogo para condiciones de piel que requieran tratamiento médico." },
      { h: "4. Uso aceptable", body: "El cliente B2B se compromete a: utilizar la plataforma solo para fines legítimos, no intentar realizar ingeniería inversa del motor de análisis, no compartir credenciales de acceso y mantener su catálogo de productos actualizado y verídico." },
      { h: "5. Propiedad intelectual", body: "La base dermatológica, algoritmos de matching, modelos de análisis y la marca Skinner son propiedad exclusiva de Skinner. El contenido del catálogo de productos y los datos de clientes finales pertenecen al respectivo cliente B2B." },
      { h: "6. Facturación", body: "El cobro se realiza mensualmente vía Stripe. Incluye mensualidad fija, análisis excedentes al límite del plan y comisión sobre ventas rastreadas. La cancelación puede realizarse en cualquier momento y entra en vigor al final del ciclo corriente." },
      { h: "7. Limitación de responsabilidad", body: "Skinner no se responsabiliza por decisiones de compra tomadas por el consumidor final basadas en las recomendaciones de la plataforma. La responsabilidad sobre los productos recomendados es exclusiva del cliente B2B que los registró." },
      { h: "8. Modificaciones", body: "Estos términos pueden actualizarse periódicamente. Las modificaciones significativas serán comunicadas por correo a los clientes B2B con 30 días de anticipación." },
    ],
    lastUpdate: "Última actualización: abril de 2026.",
  },
  en: {
    eyebrow: "Legal",
    title: "Terms of Use",
    sections: [
      { h: "1. Acceptance", body: "By using the Skinner platform, you agree to these terms of use. If you are a B2B client, a separate Service Level Agreement (SLA) may apply." },
      { h: "2. Service description", body: "Skinner is a B2B SaaS platform for dermatological intelligence offering AI facial analysis and personalized product recommendation. The service is contracted by businesses (tenants) and made available to their end customers." },
      { h: "3. Medical disclaimer", body: "The skin analysis provided by Skinner is for information and education only. It does not constitute medical diagnosis, prescription or professional health advice. Always consult a dermatologist for skin conditions requiring medical treatment." },
      { h: "4. Acceptable use", body: "The B2B client agrees to: use the platform only for legitimate purposes, not attempt to reverse-engineer the analysis engine, not share access credentials and keep their product catalog up to date and accurate." },
      { h: "5. Intellectual property", body: "The dermatological knowledge base, matching algorithms, analysis models and Skinner brand are exclusive property of Skinner. The content of the product catalog and end-customer data belong to the respective B2B client." },
      { h: "6. Billing", body: "Charges are processed monthly via Stripe. Includes fixed monthly fee, analyses exceeding the plan limit and commission on tracked sales. Cancellation can be made at any time and takes effect at the end of the current cycle." },
      { h: "7. Limitation of liability", body: "Skinner is not liable for purchase decisions made by the end consumer based on platform recommendations. Responsibility for recommended products lies exclusively with the B2B client who registered them." },
      { h: "8. Changes", body: "These terms may be updated periodically. Significant changes will be communicated by email to B2B clients with 30 days notice." },
    ],
    lastUpdate: "Last update: April 2026.",
  },
};

export default async function TermosPage() {
  const locale = await resolveLocale();
  const c = COPY[locale];
  return (
    <section className="py-20 px-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">{c.eyebrow}</p>
        <h1 className="font-serif text-3xl text-carbone italic mb-8">{c.title}</h1>

        <div className="space-y-8 text-sm text-pierre font-light leading-relaxed">
          {c.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-carbone text-sm mb-2">{s.h}</h2>
              <p>{s.body}</p>
            </div>
          ))}
          <p className="text-xs text-sable mt-8">{c.lastUpdate}</p>
        </div>
      </div>
    </section>
  );
}
