/**
 * Email utility — uses Resend when RESEND_API_KEY is configured.
 * Falls back to console.log in dev.
 */

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

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
}): { subject: string; html: string } {
  const greeting = params.patientName ? `Ola ${params.patientName}` : "Ola";
  return {
    subject: `Sua analise de pele esta pronta`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />
        <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          ${greeting},
        </h1>
        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          Sua analise de pele realizada na <strong style="color: #1C1917;">${params.tenantName}</strong> esta pronta. Clique abaixo para baixar o relatorio completo em PDF.
        </p>
        <a href="${params.reportUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          Baixar relatorio em PDF
        </a>
        <p style="font-size: 12px; color: #C8BAA9; margin: 32px 0 0; line-height: 1.5;">
          Este email foi enviado pela ${params.tenantName} com base no seu consentimento durante a analise. Se voce nao reconhece esta solicitacao, ignore este email.
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
}): { subject: string; html: string } {
  const contactLine = [
    params.patientEmail ? `Email: ${params.patientEmail}` : null,
    params.patientPhone ? `WhatsApp: ${params.patientPhone}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    subject: `Nova lead capturada — ${params.patientName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />
        <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          Nova lead capturada
        </h1>
        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          Uma nova analise foi concluida na <strong style="color: #1C1917;">${params.tenantName}</strong> e o paciente autorizou contato.
        </p>
        <div style="background: #F7F3EE; border: 1px solid #C8BAA9; padding: 20px; margin: 0 0 24px;">
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>Nome:</strong> ${params.patientName}</p>
          ${contactLine ? `<p style="font-size: 14px; margin: 0 0 8px;">${contactLine}</p>` : ""}
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>Tipo de pele:</strong> ${params.skinType}</p>
          <p style="font-size: 14px; margin: 0;"><strong>Objetivo principal:</strong> ${params.primaryObjective}</p>
        </div>
        <a href="${params.dashboardUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          Ver leads no painel
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
}): { subject: string; html: string } {
  return {
    subject: `Skinner — Redefina sua senha`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />

        <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          Redefina sua senha
        </h1>

        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          Recebemos um pedido para redefinir a senha da sua conta Skinner.
          Use o botao abaixo para escolher uma nova senha.
        </p>

        <a href="${params.resetUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          Redefinir senha
        </a>

        <p style="font-size: 12px; color: #7C7269; margin: 24px 0 0; line-height: 1.5;">
          Este link expira em ${params.expiresInMinutes} minutos e so pode ser usado uma vez.
          Se voce nao pediu esta redefinicao, ignore este email — sua senha continua a mesma.
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
}): { subject: string; html: string } {
  const isFull = params.usagePct >= 1;
  const subject = isFull
    ? `Skinner — Limite de analises atingido`
    : `Skinner — Voce atingiu 80% do seu limite`;
  const headline = isFull
    ? "Limite de analises atingido"
    : "Voce esta proximo do limite";
  const body = isFull
    ? `Sua clinica usou todas as ${params.limit} analises do periodo atual. Novas analises pelo link publico ficam temporariamente bloqueadas ate a renovacao do ciclo. Para continuar agora, faca upgrade do plano.`
    : `Sua clinica ja usou ${params.used} de ${params.limit} analises (${Math.round(params.usagePct * 100)}%) do periodo atual. Recomendamos avaliar um upgrade para evitar interrupcoes.`;
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
          ${isFull ? "Fazer upgrade agora" : "Ver planos disponiveis"}
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
}): { subject: string; html: string } {
  return {
    subject: `Bem-vindo ao Skinner — Seu acesso esta pronto`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1C1917;">
        <img src="https://www.skinner.lat/brand/logo-primary.png" alt="Skinner" style="height: 48px; margin-bottom: 32px;" />

        <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: normal; font-style: italic; margin: 0 0 16px; color: #1C1917;">
          Bem-vindo ao Skinner
        </h1>

        <p style="font-size: 15px; color: #7C7269; line-height: 1.6; margin: 0 0 24px;">
          Sua conta no plano <strong style="color: #1C1917;">${params.planName}</strong> foi criada com sucesso.
          Use as credenciais abaixo para acessar o painel.
        </p>

        <div style="background: #F7F3EE; border: 1px solid #C8BAA9; padding: 24px; margin: 0 0 24px;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #7C7269; margin: 0 0 12px;">Credenciais de acesso</p>
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>Email:</strong> ${params.email}</p>
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>Senha temporaria:</strong> <code style="background: #EDE6DB; padding: 2px 8px; font-size: 16px;">${params.tempPassword}</code></p>
          <p style="font-size: 14px; margin: 0;"><strong>Empresa:</strong> ${params.tenantName}</p>
        </div>

        <a href="${params.loginUrl}" style="display: block; text-align: center; padding: 14px 24px; background: #1C1917; color: #F7F3EE; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          Acessar o painel →
        </a>

        <p style="font-size: 12px; color: #C8BAA9; margin: 32px 0 0; line-height: 1.5;">
          Recomendamos alterar sua senha apos o primeiro acesso.
          Se voce nao solicitou esta conta, ignore este email.
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
