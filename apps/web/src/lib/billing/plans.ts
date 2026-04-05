export const PLANS = {
  starter: {
    name: "Starter",
    monthlyPrice: 490,
    setupFee: 990,
    analysisLimit: 200,
    excessCostPerAnalysis: 3.5,
    commissionRate: 0.03,
    maxUsers: 2,
    features: [
      "200 analises/mes",
      "Link direto + QR code",
      "2 usuarios",
      "Relatorio PDF padrao",
      "Suporte por e-mail",
      "Armazenamento PDFs 30 dias",
    ],
  },
  growth: {
    name: "Growth",
    monthlyPrice: 1490,
    setupFee: 2490,
    analysisLimit: 1000,
    excessCostPerAnalysis: 2.0,
    commissionRate: 0.02,
    maxUsers: 10,
    features: [
      "1.000 analises/mes",
      "Todos os canais",
      "10 usuarios",
      "Relatorio PDF branded",
      "White-label completo",
      "Integracao HubSpot + WhatsApp",
      "SLA 99.5% uptime",
      "Armazenamento PDFs 90 dias",
    ],
  },
  enterprise: {
    name: "Enterprise",
    monthlyPrice: null, // custom
    setupFee: null,
    analysisLimit: 999999,
    excessCostPerAnalysis: 0,
    commissionRate: 0.01,
    maxUsers: 999,
    features: [
      "Analises ilimitadas",
      "Todos os canais + API publica",
      "Usuarios ilimitados",
      "Relatorio PDF customizado",
      "White-label + SSO",
      "Todas integracoes + ERP",
      "SLA 99.9% + suporte dedicado",
      "Armazenamento PDFs 1 ano",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
