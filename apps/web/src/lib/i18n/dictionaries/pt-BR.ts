// Portuguese (Brazil) — source-of-truth language. Keep keys identical
// across all dictionaries; CI could enforce this later via a typecheck.
//
// Style:
//   - No trailing periods on labels.
//   - Sentence case for paragraphs.
//   - No emojis (per brand guidelines).
//   - Match existing copy on each page when migrating from hardcoded strings
//     so no visual regression.

// Explicit typing instead of `as const` so es/en can override values
// without TS complaining that "Product" isn't assignable to "Produto".
type DictShape = {
  nav: Record<string, string>;
  footer: Record<string, string>;
  language: Record<string, string>;
  home: Record<string, string>;
  auth: Record<string, string>;
};
export const ptBR: DictShape = {
  // ── Marketing header / footer / switcher ───────────────────────────
  nav: {
    product: "Produto",
    segments: "Segmentos",
    results: "Resultados",
    plans: "Planos",
    login: "Entrar",
    cta: "Solicitar demo",
  },
  footer: {
    tagline_line1: "A pele e dados.",
    tagline_line2: "Nos lemos.",
    location: "Sao Paulo, Brasil",
    section_product: "Produto",
    section_segments: "Segmentos",
    section_company: "Empresa",
    section_legal: "Legal",
    link_how_it_works: "Como funciona",
    link_results: "Resultados",
    link_plans: "Planos",
    link_demo: "Demo",
    link_labs: "Laboratorios",
    link_clinics: "Clinicas",
    link_pharmacies: "Farmacias",
    link_contact: "Contato",
    link_press: "Imprensa",
    link_privacy: "Privacidade",
    link_terms: "Termos",
    link_lgpd: "LGPD",
    copyright: "2026 Skinner Tecnologia",
  },
  language: {
    label: "Idioma",
  },

  // ── Home (/) ────────────────────────────────────────────────────────
  home: {
    hero_eyebrow: "PLATAFORMA SAAS B2B · TECNOLOGIA DE PELE",
    hero_title_line1: "Diagnostico de pele",
    hero_title_line2: "que vende.",
    hero_subtitle:
      "A primeira plataforma SAAS B2B que combina IA dermatologica com economia de plataforma. Sua clinica, laboratorio ou farmacia executa analises, recomenda produtos e gera receita recorrente.",
    hero_cta_primary: "Ver planos",
    hero_cta_secondary: "Como funciona",
    pillar_eyebrow: "TRES PILARES, UMA PLATAFORMA",
    pillar1_title: "Analise IA",
    pillar1_text:
      "Avaliacao dermatologica baseada em foto + questionario. Resultados em segundos, com nivel clinico.",
    pillar2_title: "Recomendacao",
    pillar2_text:
      "Catalogo proprio do tenant. Match score por concern, tipo de pele, ingredientes e contraindicacoes.",
    pillar3_title: "Conversao",
    pillar3_text:
      "Carrinho integrado a Nuvemshop, Shopify ou WhatsApp. Atribuicao de comissao automatica.",
  },

  // ── Auth pages ─────────────────────────────────────────────────────
  auth: {
    login_title: "Entrar",
    login_subtitle: "Acesse o painel da sua organizacao",
    login_email: "E-mail",
    login_password: "Senha",
    login_submit: "Entrar",
    login_forgot: "Esqueci minha senha",
    login_error_invalid: "E-mail ou senha invalidos.",
    login_error_no_tenant: "Conta sem organizacao vinculada.",
    login_error_unauthorized: "Acesso nao autorizado neste portal.",
    login_error_wrong_portal: "Use o portal correto para a sua conta.",
    forgot_title: "Recuperar senha",
    forgot_subtitle:
      "Digite seu e-mail e enviaremos um link para criar uma nova senha.",
    forgot_email: "E-mail",
    forgot_submit: "Enviar link",
    forgot_back: "Voltar para login",
    forgot_success_title: "Verifique seu e-mail",
    forgot_success_text:
      "Se a conta existir, enviamos um link para criar nova senha. Pode levar alguns minutos.",
    reset_title: "Nova senha",
    reset_subtitle: "Defina uma nova senha de acesso.",
    reset_password: "Nova senha",
    reset_confirm: "Confirme a nova senha",
    reset_submit: "Salvar nova senha",
    reset_error_mismatch: "As senhas nao coincidem.",
    reset_error_short: "A senha deve ter ao menos 8 caracteres.",
    reset_error_token: "Link invalido ou expirado.",
    reset_success: "Senha alterada. Redirecionando para login...",
  },
};

export type Dictionary = DictShape;
