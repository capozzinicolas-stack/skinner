/**
 * Email utility — uses Resend when RESEND_API_KEY is configured.
 * Falls back to console.log in dev.
 *
 * Multi-locale (May-2026): every builder accepts an optional `locale` param.
 * Defaults to "pt-BR" so existing callers keep working unchanged. Callers
 * that have a tenant context should pass tenant.defaultLocale; callers in
 * the patient flow should pass the resolved channel/tenant locale.
 *
 * REVIEW_TRANSLATION_HUMAN: es/en copy is AI-translated — review tone with
 * native speaker before going live to those locales.
 */

import type { Locale } from "@/lib/i18n/types";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

// Lookup per-builder per-locale strings without bloating each function
// with a switch. Each builder pulls from EMAIL_STRINGS[locale] and falls
// back to pt-BR when a key is missing.
type EmailStrings = {
  analysisDelivery: {
    subject: string;
    greetingNoName: string;
    body: (tenantName: string) => string;
    cta: string;
    consent: (tenantName: string) => string;
  };
  newLead: {
    subject: (patientName: string) => string;
    headline: string;
    body: (tenantName: string) => string;
    nameLabel: string;
    skinTypeLabel: string;
    objectiveLabel: string;
    cta: string;
  };
  passwordReset: {
    subject: string;
    headline: string;
    body: string;
    cta: string;
    expiry: (mins: number) => string;
  };
  usageAlert: {
    subjectFull: string;
    subjectNear: string;
    headlineFull: string;
    headlineNear: string;
    bodyFull: (limit: number) => string;
    bodyNear: (used: number, limit: number, pct: number) => string;
    ctaFull: string;
    ctaNear: string;
  };
  welcome: {
    subject: string;
    headline: string;
    body: (planName: string) => string;
    credentialsTitle: string;
    emailLabel: string;
    tempPasswordLabel: string;
    companyLabel: string;
    cta: string;
    footer: string;
  };
};

const EMAIL_STRINGS: Record<Locale, EmailStrings> = {
  "pt-BR": {
    analysisDelivery: {
      subject: "Sua analise de pele esta pronta",
      greetingNoName: "Ola",
      body: (t) =>
        `Sua analise de pele realizada na <strong style="color: #1C1917;">${t}</strong> esta pronta. Clique abaixo para baixar o relatorio completo em PDF.`,
      cta: "Baixar relatorio em PDF",
      consent: (t) =>
        `Este email foi enviado pela ${t} com base no seu consentimento durante a analise. Se voce nao reconhece esta solicitacao, ignore este email.`,
    },
    newLead: {
      subject: (n) => `Nova lead capturada — ${n}`,
      headline: "Nova lead capturada",
      body: (t) =>
        `Uma nova analise foi concluida na <strong style="color: #1C1917;">${t}</strong> e o paciente autorizou contato.`,
      nameLabel: "Nome",
      skinTypeLabel: "Tipo de pele",
      objectiveLabel: "Objetivo principal",
      cta: "Ver leads no painel",
    },
    passwordReset: {
      subject: "Skinner — Redefina sua senha",
      headline: "Redefina sua senha",
      body: "Recebemos um pedido para redefinir a senha da sua conta Skinner. Use o botao abaixo para escolher uma nova senha.",
      cta: "Redefinir senha",
      expiry: (m) =>
        `Este link expira em ${m} minutos e so pode ser usado uma vez. Se voce nao pediu esta redefinicao, ignore este email — sua senha continua a mesma.`,
    },
    usageAlert: {
      subjectFull: "Skinner — Limite de analises atingido",
      subjectNear: "Skinner — Voce atingiu 80% do seu limite",
      headlineFull: "Limite de analises atingido",
      headlineNear: "Voce esta proximo do limite",
      bodyFull: (l) =>
        `Sua clinica usou todas as ${l} analises do periodo atual. Novas analises pelo link publico ficam temporariamente bloqueadas ate a renovacao do ciclo. Para continuar agora, faca upgrade do plano.`,
      bodyNear: (u, l, p) =>
        `Sua clinica ja usou ${u} de ${l} analises (${p}%) do periodo atual. Recomendamos avaliar um upgrade para evitar interrupcoes.`,
      ctaFull: "Fazer upgrade agora",
      ctaNear: "Ver planos disponiveis",
    },
    welcome: {
      subject: "Bem-vindo ao Skinner — Seu acesso esta pronto",
      headline: "Bem-vindo ao Skinner",
      body: (p) =>
        `Sua conta no plano <strong style="color: #1C1917;">${p}</strong> foi criada com sucesso. Use as credenciais abaixo para acessar o painel.`,
      credentialsTitle: "Credenciais de acesso",
      emailLabel: "Email",
      tempPasswordLabel: "Senha temporaria",
      companyLabel: "Empresa",
      cta: "Acessar o painel →",
      footer:
        "Recomendamos alterar sua senha apos o primeiro acesso. Se voce nao solicitou esta conta, ignore este email.",
    },
  },
  es: {
    analysisDelivery: {
      subject: "Tu analisis de piel esta listo",
      greetingNoName: "Hola",
      body: (t) =>
        `Tu analisis de piel realizado en <strong style="color: #1C1917;">${t}</strong> esta listo. Haz clic abajo para descargar el reporte completo en PDF.`,
      cta: "Descargar reporte PDF",
      consent: (t) =>
        `Este correo fue enviado por ${t} con base en tu consentimiento durante el analisis. Si no reconoces esta solicitud, ignora este correo.`,
    },
    newLead: {
      subject: (n) => `Nueva lead capturada — ${n}`,
      headline: "Nueva lead capturada",
      body: (t) =>
        `Un nuevo analisis se concluyo en <strong style="color: #1C1917;">${t}</strong> y el paciente autorizo contacto.`,
      nameLabel: "Nombre",
      skinTypeLabel: "Tipo de piel",
      objectiveLabel: "Objetivo principal",
      cta: "Ver leads en el panel",
    },
    passwordReset: {
      subject: "Skinner — Restablece tu contrasena",
      headline: "Restablece tu contrasena",
      body: "Recibimos una solicitud para restablecer la contrasena de tu cuenta Skinner. Usa el boton abajo para elegir una nueva.",
      cta: "Restablecer contrasena",
      expiry: (m) =>
        `Este enlace expira en ${m} minutos y solo puede usarse una vez. Si no solicitaste este cambio, ignora este correo — tu contrasena no cambia.`,
    },
    usageAlert: {
      subjectFull: "Skinner — Limite de analisis alcanzado",
      subjectNear: "Skinner — Llegaste al 80% de tu limite",
      headlineFull: "Limite de analisis alcanzado",
      headlineNear: "Estas cerca del limite",
      bodyFull: (l) =>
        `Tu clinica uso los ${l} analisis del periodo actual. Los nuevos analisis quedan bloqueados temporalmente hasta la renovacion del ciclo. Para continuar ahora, haz upgrade del plan.`,
      bodyNear: (u, l, p) =>
        `Tu clinica ya uso ${u} de ${l} analisis (${p}%) del periodo actual. Recomendamos evaluar un upgrade para evitar interrupciones.`,
      ctaFull: "Hacer upgrade ahora",
      ctaNear: "Ver planes disponibles",
    },
    welcome: {
      subject: "Bienvenido a Skinner — Tu acceso esta listo",
      headline: "Bienvenido a Skinner",
      body: (p) =>
        `Tu cuenta en el plan <strong style="color: #1C1917;">${p}</strong> fue creada con exito. Usa las credenciales abajo para acceder al panel.`,
      credentialsTitle: "Credenciales de acceso",
      emailLabel: "Correo",
      tempPasswordLabel: "Contrasena temporal",
      companyLabel: "Empresa",
      cta: "Acceder al panel →",
      footer:
        "Recomendamos cambiar tu contrasena despues del primer acceso. Si no solicitaste esta cuenta, ignora este correo.",
    },
  },
  en: {
    analysisDelivery: {
      subject: "Your skin analysis is ready",
      greetingNoName: "Hello",
      body: (t) =>
        `Your skin analysis from <strong style="color: #1C1917;">${t}</strong> is ready. Click below to download the full PDF report.`,
      cta: "Download PDF report",
      consent: (t) =>
        `This email was sent by ${t} based on your consent during the analysis. If you don't recognize this request, ignore this email.`,
    },
    newLead: {
      subject: (n) => `New lead captured — ${n}`,
      headline: "New lead captured",
      body: (t) =>
        `A new analysis was completed at <strong style="color: #1C1917;">${t}</strong> and the patient authorized contact.`,
      nameLabel: "Name",
      skinTypeLabel: "Skin type",
      objectiveLabel: "Primary objective",
      cta: "View leads in panel",
    },
    passwordReset: {
      subject: "Skinner — Reset your password",
      headline: "Reset your password",
      body: "We received a request to reset the password on your Skinner account. Use the button below to choose a new one.",
      cta: "Reset password",
      expiry: (m) =>
        `This link expires in ${m} minutes and can only be used once. If you didn't request this reset, ignore this email — your password stays the same.`,
    },
    usageAlert: {
      subjectFull: "Skinner — Analysis limit reached",
      subjectNear: "Skinner — You reached 80% of your limit",
      headlineFull: "Analysis limit reached",
      headlineNear: "You're close to your limit",
      bodyFull: (l) =>
        `Your clinic used all ${l} analyses for the current period. New public-link analyses are temporarily blocked until the next cycle. To continue now, upgrade your plan.`,
      bodyNear: (u, l, p) =>
        `Your clinic has used ${u} of ${l} analyses (${p}%) for the current period. We recommend an upgrade to avoid interruptions.`,
      ctaFull: "Upgrade now",
      ctaNear: "View available plans",
    },
    welcome: {
      subject: "Welcome to Skinner — Your access is ready",
      headline: "Welcome to Skinner",
      body: (p) =>
        `Your account on the <strong style="color: #1C1917;">${p}</strong> plan was created successfully. Use the credentials below to access the panel.`,
      credentialsTitle: "Access credentials",
      emailLabel: "Email",
      tempPasswordLabel: "Temporary password",
      companyLabel: "Company",
      cta: "Access the panel →",
      footer:
        "We recommend changing your password after first sign-in. If you didn't request this account, ignore this email.",
    },
  },
};

function s(locale: Locale = "pt-BR"): EmailStrings {
  return EMAIL_STRINGS[locale] ?? EMAIL_STRINGS["pt-BR"];
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email] (no RESEND_API_KEY) Would send to ${to}: ${subject}`);
    console.log(`[email] Body: ${html.slice(0, 200)}...`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Skinner <noreply@skinner.lat>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[email] Resend error: ${err}`);
      return false;
    }

    console.log(`[email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("[email] Failed:", err);
    return false;
  }
}

export function buildAnalysisDeliveryEmail(params: {
  tenantName: string;
  patientName: string | null;
  reportUrl: string;
  locale?: Locale;
}): { subject: string; html: string } {
  const L = s(params.locale);
  const greeting = params.patientName
    ? `${L.analysisDelivery.greetingNoName} ${params.patientName}`
    : L.analysisDelivery.greetingNoName;
  return {
    subject: L.analysisDelivery.subject,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />
        <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          ${greeting},
        </h1>
        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          ${L.analysisDelivery.body(params.tenantName)}
        </p>
        <a href="${params.reportUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          ${L.analysisDelivery.cta}
        </a>
        <p style="font-size: 12px; color: #C8BAA9; margin: 32px 0 0; line-height: 1.5;">
          ${L.analysisDelivery.consent(params.tenantName)}
        </p>
        <div style="border-top: 1px solid #EDE6DB; margin-top: 32px; padding-top: 16px;">
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #C8BAA9; margin: 0;">
            Skinner · Skin Tech · 2026
          </p>
        </div>
      </div>
    `,
  };
}

export function buildNewLeadNotificationEmail(params: {
  tenantName: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  skinType: string;
  primaryObjective: string;
  dashboardUrl: string;
  locale?: Locale;
}): { subject: string; html: string } {
  const L = s(params.locale);
  const contactLine = [
    params.patientEmail ? `Email: ${params.patientEmail}` : null,
    params.patientPhone ? `WhatsApp: ${params.patientPhone}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    subject: L.newLead.subject(params.patientName),
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />
        <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          ${L.newLead.headline}
        </h1>
        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          ${L.newLead.body(params.tenantName)}
        </p>
        <div style="background: #F7F3EE; border: 1px solid #C8BAA9; padding: 20px; margin: 0 0 24px;">
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>${L.newLead.nameLabel}:</strong> ${params.patientName}</p>
          ${contactLine ? `<p style="font-size: 14px; margin: 0 0 8px;">${contactLine}</p>` : ""}
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>${L.newLead.skinTypeLabel}:</strong> ${params.skinType}</p>
          <p style="font-size: 14px; margin: 0;"><strong>${L.newLead.objectiveLabel}:</strong> ${params.primaryObjective}</p>
        </div>
        <a href="${params.dashboardUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          ${L.newLead.cta}
        </a>
        <div style="border-top: 1px solid #EDE6DB; margin-top: 32px; padding-top: 16px;">
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #C8BAA9; margin: 0;">
            Skinner · ${params.tenantName} · 2026
          </p>
        </div>
      </div>
    `,
  };
}

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  expiresInMinutes: number;
  locale?: Locale;
}): { subject: string; html: string } {
  const L = s(params.locale);
  return {
    subject: L.passwordReset.subject,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />

        <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          ${L.passwordReset.headline}
        </h1>

        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          ${L.passwordReset.body}
        </p>

        <a href="${params.resetUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          ${L.passwordReset.cta}
        </a>

        <p style="font-size: 12px; color: #7C7269; margin: 24px 0 0; line-height: 1.5;">
          ${L.passwordReset.expiry(params.expiresInMinutes)}
        </p>

        <div style="border-top: 1px solid #EDE6DB; margin-top: 32px; padding-top: 16px;">
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #C8BAA9; margin: 0;">
            Skinner · Skin Tech · 2026
          </p>
        </div>
      </div>
    `,
  };
}

export function buildUsageAlertEmail(params: {
  tenantName: string;
  usagePct: number; // 0..1
  used: number;
  limit: number;
  upgradeUrl: string;
  locale?: Locale;
}): { subject: string; html: string } {
  const L = s(params.locale);
  const isFull = params.usagePct >= 1;
  const subject = isFull ? L.usageAlert.subjectFull : L.usageAlert.subjectNear;
  const headline = isFull
    ? L.usageAlert.headlineFull
    : L.usageAlert.headlineNear;
  const body = isFull
    ? L.usageAlert.bodyFull(params.limit)
    : L.usageAlert.bodyNear(
        params.used,
        params.limit,
        Math.round(params.usagePct * 100)
      );
  return {
    subject,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />
        <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          ${headline}
        </h1>
        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">${body}</p>
        <a href="${params.upgradeUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          ${isFull ? L.usageAlert.ctaFull : L.usageAlert.ctaNear}
        </a>
        <div style="border-top: 1px solid #EDE6DB; margin-top: 32px; padding-top: 16px;">
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #C8BAA9; margin: 0;">
            Skinner · ${params.tenantName} · 2026
          </p>
        </div>
      </div>
    `,
  };
}

export function buildWelcomeEmail(params: {
  tenantName: string;
  email: string;
  tempPassword: string;
  planName: string;
  loginUrl: string;
  locale?: Locale;
}): { subject: string; html: string } {
  const L = s(params.locale);
  return {
    subject: L.welcome.subject,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />

        <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          ${L.welcome.headline}
        </h1>

        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          ${L.welcome.body(params.planName)}
        </p>

        <div style="background: #F7F3EE; border: 1px solid #C8BAA9; padding: 24px; margin: 0 0 24px;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #7C7269; margin: 0 0 12px;">${L.welcome.credentialsTitle}</p>
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>${L.welcome.emailLabel}:</strong> ${params.email}</p>
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>${L.welcome.tempPasswordLabel}:</strong> <code style="background: #EDE6DB; padding: 2px 8px; font-size: 16px;">${params.tempPassword}</code></p>
          <p style="font-size: 14px; margin: 0;"><strong>${L.welcome.companyLabel}:</strong> ${params.tenantName}</p>
        </div>

        <a href="${params.loginUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          ${L.welcome.cta}
        </a>

        <p style="font-size: 12px; color: #C8BAA9; margin: 32px 0 0; line-height: 1.5;">
          ${L.welcome.footer}
        </p>

        <div style="border-top: 1px solid #EDE6DB; margin-top: 32px; padding-top: 16px;">
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #C8BAA9; margin: 0;">
            Skinner · Skin Tech · 2026
          </p>
        </div>
      </div>
    `,
  };
}
