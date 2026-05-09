import { resolveLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

type Section = { h: string; body: string; bodyExtra?: string[] };
type Copy = {
  eyebrow: string;
  title: string;
  sections: Section[];
  lastUpdate: string;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Legal",
    title: "Política de Privacidade",
    sections: [
      { h: "1. Introdução", body: "A Skinner (\"nós\") opera como Operador de dados sensíveis (biométricos) em nome dos seus clientes B2B (Controladores), em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)." },
      {
        h: "2. Dados coletados",
        body: "<strong class='text-carbone font-normal'>Foto facial:</strong> Dado biométrico sensível sob LGPD Art. 11. Processada em memória por inteligência artificial e descartada imediatamente após a análise. Não é armazenada em nenhum banco de dados.",
        bodyExtra: [
          "<strong class='text-carbone font-normal'>Questionário:</strong> Tipo de pele, preocupações, faixa etária e dados de saúde básicos. Armazenados de forma anônima por padrão.",
          "<strong class='text-carbone font-normal'>E-mail (opcional):</strong> Fornecido voluntariamente para recebimento do relatório. Pode ser deletado a qualquer momento.",
        ],
      },
      { h: "3. Base legal", body: "Consentimento explícito coletado antes da captura de foto, com linguagem clara sobre finalidade e tratamento dos dados." },
      { h: "4. Retenção de dados", body: "Fotos faciais: processadas e descartadas imediatamente. Resultados de análise: armazenados conforme plano do cliente B2B (30 a 365 dias). Leads de contato: mantidos até solicitação de exclusão." },
      { h: "5. Direitos do titular", body: "Você tem direito a: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento. Para exercer seus direitos, entre em contato pelo e-mail privacidade@skinner.com.br." },
      { h: "6. Segurança", body: "Criptografia em trânsito (TLS 1.3) e em repouso (AES-256). Rate limiting por IP. Audit log de todas as ações. Revisão de segurança trimestral." },
      { h: "7. Contato do DPO", body: "Encarregado de Proteção de Dados: privacidade@skinner.com.br" },
    ],
    lastUpdate: "Última atualização: abril de 2026.",
  },
  es: {
    eyebrow: "Legal",
    title: "Política de Privacidad",
    sections: [
      { h: "1. Introducción", body: "Skinner (\"nosotros\") opera como Operador de datos sensibles (biométricos) en nombre de sus clientes B2B (Controladores), en cumplimiento con la Ley General de Protección de Datos (LGPD - Ley 13.709/2018)." },
      {
        h: "2. Datos recolectados",
        body: "<strong class='text-carbone font-normal'>Foto facial:</strong> Dato biométrico sensible bajo LGPD Art. 11. Procesada en memoria por inteligencia artificial y descartada inmediatamente después del análisis. No se almacena en ninguna base de datos.",
        bodyExtra: [
          "<strong class='text-carbone font-normal'>Cuestionario:</strong> Tipo de piel, preocupaciones, rango etario y datos de salud básicos. Almacenados de forma anónima por defecto.",
          "<strong class='text-carbone font-normal'>Correo electrónico (opcional):</strong> Proporcionado voluntariamente para recibir el reporte. Puede ser eliminado en cualquier momento.",
        ],
      },
      { h: "3. Base legal", body: "Consentimiento explícito recolectado antes de la captura de foto, con lenguaje claro sobre finalidad y tratamiento de los datos." },
      { h: "4. Retención de datos", body: "Fotos faciales: procesadas y descartadas inmediatamente. Resultados de análisis: almacenados según plan del cliente B2B (30 a 365 días). Leads de contacto: mantenidos hasta solicitud de exclusión." },
      { h: "5. Derechos del titular", body: "Tienes derecho a: confirmación de tratamiento, acceso, corrección, anonimización, portabilidad, eliminación y revocación del consentimiento. Para ejercer tus derechos, contacta privacidade@skinner.com.br." },
      { h: "6. Seguridad", body: "Cifrado en tránsito (TLS 1.3) y en reposo (AES-256). Rate limiting por IP. Audit log de todas las acciones. Revisión de seguridad trimestral." },
      { h: "7. Contacto del DPO", body: "Encargado de Protección de Datos: privacidade@skinner.com.br" },
    ],
    lastUpdate: "Última actualización: abril de 2026.",
  },
  en: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    sections: [
      { h: "1. Introduction", body: "Skinner (\"we\") operates as a Processor of sensitive (biometric) data on behalf of its B2B clients (Controllers), in compliance with the Brazilian General Data Protection Law (LGPD - Law 13.709/2018) and equivalent regulations in other markets." },
      {
        h: "2. Data collected",
        body: "<strong class='text-carbone font-normal'>Facial photo:</strong> Sensitive biometric data under LGPD Art. 11. Processed in memory by artificial intelligence and discarded immediately after the analysis. It is not stored in any database.",
        bodyExtra: [
          "<strong class='text-carbone font-normal'>Questionnaire:</strong> Skin type, concerns, age range and basic health data. Stored anonymously by default.",
          "<strong class='text-carbone font-normal'>Email (optional):</strong> Voluntarily provided to receive the report. Can be deleted at any time.",
        ],
      },
      { h: "3. Legal basis", body: "Explicit consent collected before photo capture, with clear language about purpose and data treatment." },
      { h: "4. Data retention", body: "Facial photos: processed and discarded immediately. Analysis results: stored per B2B client plan (30 to 365 days). Contact leads: kept until deletion request." },
      { h: "5. Subject rights", body: "You have the right to: confirmation of processing, access, correction, anonymization, portability, deletion and consent revocation. To exercise your rights, contact privacidade@skinner.com.br." },
      { h: "6. Security", body: "Encryption in transit (TLS 1.3) and at rest (AES-256). Rate limiting per IP. Audit log of all actions. Quarterly security review." },
      { h: "7. DPO contact", body: "Data Protection Officer: privacidade@skinner.com.br" },
    ],
    lastUpdate: "Last update: April 2026.",
  },
};

export default async function PrivacidadePage() {
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
              <p dangerouslySetInnerHTML={{ __html: s.body }} />
              {s.bodyExtra?.map((extra, j) => (
                <p key={j} className="mt-2" dangerouslySetInnerHTML={{ __html: extra }} />
              ))}
            </div>
          ))}
          <p className="text-xs text-sable mt-8">{c.lastUpdate}</p>
        </div>
      </div>
    </section>
  );
}
