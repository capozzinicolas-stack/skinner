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
