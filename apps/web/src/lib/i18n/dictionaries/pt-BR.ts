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
  dashboard: Record<string, string>;
  // Patient-facing analysis flow. Locale = effective patient locale
  // (channel.overrides.locale → tenant.defaultLocale → fallback).
  patient: Record<string, string>;
  // Dashboard page bodies. Locale = User.locale → Tenant.defaultLocale
  // → cookie / header. Visited by B2B staff.
  dashboardPages: Record<string, string>;
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
    location_line1: "São Paulo, Brasil",
    location_line2: "CDMX, México",
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
    link_pharmacies: "Farmácias",
    link_retail: "Varejo",
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

  // ── Dashboard B2B ───────────────────────────────────────────────────
  // Sidebar nav labels + section titles. Page bodies stay in pt-BR for now —
  // migrated incrementally as content stabilizes.
  dashboard: {
    portal_subtitle: "Portal B2B",
    nav_onboarding: "Onboarding",
    nav_dashboard: "Painel",
    nav_catalog: "Catalogo",
    nav_reports: "Relatorios",
    nav_leads: "Leads",
    nav_kits: "Kits",
    nav_analysis: "Analise",
    nav_brand: "Marca",
    nav_channels: "Canais",
    nav_integrations: "Integracoes",
    nav_users: "Usuarios",
    nav_billing: "Faturamento",
    nav_organization: "Organizacao",
    nav_account: "Minha Conta",
    nav_logout: "Sair",
  },

  // ── Patient analysis flow ──────────────────────────────────────────
  patient: {
    // Contact capture
    contact_title: "Para personalizar sua analise",
    contact_default_message:
      "{tenant} gostaria de manter contato para acompanhar sua jornada e enviar o resultado completo da analise.",
    contact_name_label: "Nome (opcional)",
    contact_name_placeholder: "Como podemos te chamar",
    contact_email_label_optional: "E-mail (opcional)",
    contact_email_label_required: "E-mail (obrigatorio)",
    contact_email_placeholder: "seu@email.com",
    contact_phone_label_optional: "WhatsApp (opcional)",
    contact_phone_label_required: "WhatsApp (obrigatorio)",
    contact_phone_placeholder: "(11) 99999-9999",
    contact_consent_text:
      "Concordo em receber contato da {tenant} sobre o resultado da minha analise e recomendacoes de tratamento. Em conformidade com a LGPD (Lei 13.709/2018).",
    contact_error_both_required:
      "Informe seu e-mail E seu WhatsApp para continuar.",
    contact_error_consent_required:
      "Marque o consentimento LGPD para continuar.",
    contact_error_consent_with_contact:
      "Voce informou um contato. Confirme o consentimento LGPD para prosseguir, ou limpe os campos.",
    contact_skip: "Pular",
    contact_continue: "Continuar",

    // Photo capture
    photo_title: "Fotografe seu rosto",
    photo_instruction:
      "Para uma analise precisa, posicione seu rosto dentro da guia oval. Sem maquiagem, sem oculos e de frente para a camera.",
    photo_error_camera:
      "Nao foi possivel acessar a camera. Verifique as permissoes do navegador ou tente fazer upload de uma foto.",
    photo_error_camera_start: "Nao foi possivel iniciar a camera.",
    photo_error_file_type: "Por favor, selecione uma imagem.",
    photo_error_file_size: "Imagem muito grande. Maximo 10MB.",
    photo_position_face: "Posicione seu rosto",
    photo_oval_label: "dentro da guia oval",
    photo_top_hint: "↓ Topo da testa aqui ↓",
    photo_bottom_hint: "↑ Queixo aqui ↑",
    photo_forehead_label: "Testa aqui",
    photo_chin_label: "Queixo aqui",
    photo_take: "Tirar foto",
    photo_upload: "Fazer upload",
    photo_camera_initializing: "Iniciando camera...",
    photo_align_text: "Alinhe o topo da testa e o queixo com a guia oval",
    photo_cancel: "Cancelar",
    photo_capture: "Capturar",
    photo_wait: "Aguarde...",
    photo_retry: "Tirar outra",
    photo_use: "Usar esta foto",
    photo_tips_title: "Para uma analise precisa",
    photo_tip_lighting_title: "Iluminacao",
    photo_tip_lighting_text:
      "Luz natural frontal. Evite sombras no rosto e luz forte atras de voce.",
    photo_tip_position_title: "Posicao",
    photo_tip_position_text:
      "Olhe direto para a camera, rosto reto sem inclinar para os lados.",
    photo_tip_prep_title: "Preparacao",
    photo_tip_prep_text:
      "Sem maquiagem, sem oculos, cabelo preso mostrando a testa.",
    photo_tip_frame_title: "Enquadramento",
    photo_tip_frame_text:
      "Preencha o oval do topo da testa ate o queixo. So o rosto, sem corpo.",

    // Loading screen
    loading_title: "Analisando sua pele",
    loading_did_you_know: "Voce sabia",
    loading_msg_1: "Analisando o tipo da sua pele...",
    loading_msg_2: "Identificando condicoes e preocupacoes...",
    loading_msg_3: "Avaliando a barreira cutanea...",
    loading_msg_4: "Cruzando dados com nossa base dermatologica...",
    loading_msg_5: "Selecionando os melhores produtos para voce...",
    loading_msg_6: "Montando seu plano de acao personalizado...",
    loading_msg_7: "Quase pronto. Finalizando seu relatorio...",
    loading_tip_1: "A pele leva cerca de 28 dias para se renovar completamente.",
    loading_tip_2: "Protetor solar e o anti-aging mais eficaz que existe.",
    loading_tip_3: "Niacinamida e compativel com quase todos os tipos de pele.",
    loading_tip_4: "Hidratacao adequada melhora ate mesmo peles oleosas.",
    loading_tip_5: "Ingredientes ativos devem ser introduzidos gradualmente.",
    loading_preparing: "Preparando analise...",

    // Questionnaire
    quest_progress: "Pergunta {current} de {total}",
    quest_multi_hint: "Selecione ate {max} opcoes",
    quest_text_placeholder: "Digite aqui (opcional)...",
    quest_back: "Voltar",
    quest_next: "Proxima",
    quest_skip: "Pular",
    quest_see_results: "Ver resultados",
  },

  // ── Dashboard page bodies ──────────────────────────────────────────
  dashboardPages: {
    // Organização page
    org_title: "Minha Organizacao",
    org_subtitle:
      "Informacoes gerais da sua clinica e preferencias regionais.",
    org_identifiers: "Identificadores",
    org_id_label: "ID da organizacao",
    org_slug_label: "Slug publico",
    org_slug_hint: "Usado em URLs como app.skinner.lat/analise/{slug}",
    org_plan_label: "Plano atual",
    org_status_label: "Status",
    org_data_section: "Dados da organizacao",
    org_read_only_notice:
      "Apenas administradores podem alterar estes campos. Voce esta em modo de leitura.",
    org_name_label: "Nome comercial",
    org_country_label: "Pais",
    org_country_placeholder: "— Selecione —",
    org_timezone_label: "Fuso horario",
    org_timezone_placeholder: "— Selecione —",
    org_timezone_hint: "Usado para agendamentos e notificacoes.",
    org_locale_label: "Idioma padrao da conta",
    org_locale_hint:
      "Define o idioma do painel B2B, dos relatorios entregues aos pacientes e do flow de analise. Cada canal pode sobrescrever individualmente.",
    org_save: "Salvar dados",
    org_saving: "Salvando...",
    org_saved: "Dados atualizados.",

    // ── Common UI ────────────────────────────────────────────────────
    common_loading: "Carregando...",
    common_all_channels: "Todos os canais",
    common_export_csv: "Exportar CSV",
    common_exporting: "Exportando...",
    common_period_7d: "7 dias",
    common_period_30d: "30 dias",
    common_period_90d: "90 dias",
    common_period_1y: "12 meses",
    common_save: "Salvar",
    common_saving: "Salvando...",
    common_cancel: "Cancelar",
    common_back: "Voltar",
    common_next: "Proxima",
    common_previous: "Anterior",
    common_delete: "Excluir",
    common_edit: "Editar",
    common_new: "Novo",
    common_search: "Buscar...",
    common_no_data: "Nenhum dado para exibir.",
    common_close: "Fechar",
    common_actions: "Acoes",
    common_status: "Status",
    common_date: "Data",
    common_name: "Nome",
    common_contact: "Contato",
    common_active: "Ativo",
    common_inactive: "Inativo",
    common_paused: "Pausado",

    // ── Dashboard home ──────────────────────────────────────────────
    home_title: "Painel",
    home_subtitle: "Visao estrategica do seu negocio.",
    home_temp_password_title: "Sua senha temporaria precisa ser trocada",
    home_temp_password_body:
      "Por seguranca, defina uma senha pessoal antes de continuar usando o painel.",
    home_temp_password_cta: "Definir senha agora",
    home_roi_overview: "ROI da plataforma",
    home_plan_usage: "Uso do plano",
    home_monthly_trend: "Tendencia",
    home_monthly_trend_subtitle: "Volume e receita nos ultimos 6 meses",
    home_geography: "Distribuicao geografica",
    home_profile: "Perfil dos pacientes",
    home_top_conditions: "Condicoes mais comuns",
    home_barrier: "Estado da barreira cutanea",
    home_top_products: "Produtos recomendados",
    home_engagement: "Engajamento",
    home_personas: "Personas",
    home_seasonality: "Sazonalidade",
    home_benchmark: "Benchmark vs plataforma",

    // ── Leads page ───────────────────────────────────────────────────
    leads_title: "Leads",
    leads_subtitle: "Pacientes que autorizaram contato durante a analise.",
    leads_empty: "Nenhuma lead capturada neste periodo.",
    leads_empty_hint:
      "Verifique se a captura de contato esta ativada em \"Analise\" e que pacientes autorizaram o contato durante a analise.",
    leads_th_skin_type: "Tipo de pele",
    leads_th_objective: "Objetivo",
    leads_no_name: "Sem nome",
    leads_consent_notice:
      "Apenas pacientes que marcaram explicitamente o consentimento LGPD aparecem nesta lista.",

    // ── Reports page ─────────────────────────────────────────────────
    reports_title: "Relatorios",
    reports_subtitle: "Historico de analises realizadas pelos seus clientes.",
    reports_empty: "Nenhuma analise realizada ainda.",
    reports_th_channel: "Canal",
    reports_th_client: "Cliente",
    reports_th_skin_type: "Tipo de pele",
    reports_th_conditions: "Condicoes",
    reports_th_products: "Produtos",
    reports_th_latency: "Latencia",
    reports_anonymous: "Anonimo",
    reports_view_pdf: "Ver PDF",

    // ── Catalog page ─────────────────────────────────────────────────
    cat_title: "Catalogo de Produtos",
    cat_summary: "{active} ativos de {total} produtos",
    cat_import_csv: "Importar CSV",
    cat_new_product: "Novo Produto",
    cat_search_placeholder: "Buscar por nome ou SKU...",
    cat_filter_all_concerns: "Todas condicoes",
    cat_filter_all_steps: "Todas etapas",
    cat_filter_all_types: "Todos os tipos",
    cat_filter_products: "Produtos",
    cat_filter_services: "Servicos",
    cat_show_inactive: "Mostrar inativos",
    cat_selected_count_one: "{n} item selecionado",
    cat_selected_count_many: "{n} itens selecionados",
    cat_bulk_deactivate: "Desativar selecionados",
    cat_bulk_deactivating: "Desativando...",
    cat_bulk_reactivate: "Reativar selecionados",
    cat_bulk_reactivating: "Reativando...",
    cat_clear_selection: "Limpar selecao",
    cat_empty: "Nenhum item encontrado.",
    cat_add_first: "Adicionar primeiro produto",
    cat_th_item: "Item",
    cat_th_sku: "SKU",
    cat_th_type_step: "Tipo / Etapa",
    cat_th_concerns: "Condicoes",
    cat_th_intensity: "Intensidade",
    cat_th_price: "Preco",
    cat_intensity_light: "Leve",
    cat_intensity_moderate: "Moderado",
    cat_intensity_intense: "Intenso",
    cat_label_product: "Produto",
    cat_label_service: "Servico",
    cat_deactivate: "Desativar",
    cat_reactivate: "Reativar",
    cat_pagination: "Pagina {page} de {pageCount} — {total} itens",
    cat_coverage_title: "Cobertura por condicao",

    // ── Kits page ────────────────────────────────────────────────────
    kits_title: "Kits",
    kits_subtitle:
      "Combos de produtos recomendados juntos para um objetivo especifico.",
    kits_new: "Novo Kit",
    kits_empty: "Nenhum kit criado ainda.",
    kits_empty_hint: "Crie kits para vender combos com desconto.",

    // ── Brand page ───────────────────────────────────────────────────
    marca_title: "Marca",
    marca_subtitle:
      "Personalize o visual da analise para seus pacientes.",
    marca_logo_section: "Logotipo",
    marca_colors_section: "Cores",
    marca_voice_section: "Tom da marca",
    marca_disclaimer_section: "Aviso legal",

    // ── Channels page ────────────────────────────────────────────────
    chan_title: "Canais",
    chan_subtitle:
      "Crie multiplos links para segmentar campanhas, parceiros ou unidades.",
    chan_new: "Novo canal",
    chan_plan_cap: "{count} de {max} canal(is)",
    chan_paused_label: "Pausado",
    chan_expired_label: "Expirado",
    chan_default_label: "Padrao",
    chan_tab_link: "Link Direto",
    chan_tab_qr: "QR Code",
    chan_tab_widget: "Widget Embed",
    chan_tab_branding: "Personalizacao",

    // ── Integrations page ────────────────────────────────────────────
    int_title: "Integracoes",
    int_subtitle:
      "Conecte sua loja virtual para vendas automaticas e atribuicao de comissao.",

    // ── Users page ───────────────────────────────────────────────────
    usr_title: "Usuarios",
    usr_subtitle: "Gerencie quem tem acesso ao painel da sua organizacao.",
    usr_invite: "Convidar usuario",
    usr_th_email: "E-mail",
    usr_th_role: "Papel",
    usr_th_last_login: "Ultimo acesso",
    usr_role_admin: "Administrador",
    usr_role_analyst: "Analista",
    usr_role_viewer: "Visualizador",

    // ── Billing page ─────────────────────────────────────────────────
    bill_title: "Faturamento",
    bill_subtitle:
      "Plano, uso e historico de pagamentos.",
    bill_current_plan: "Plano atual",
    bill_usage: "Uso do periodo",
    bill_invoices: "Faturas",
    bill_manage: "Gerenciar assinatura",

    // ── Account page ─────────────────────────────────────────────────
    acct_title: "Minha Conta",
    acct_subtitle: "Dados pessoais, senha e preferencias.",
    acct_section_profile: "Dados pessoais",
    acct_section_password: "Alterar senha",
    acct_section_locale: "Idioma do painel",
    acct_section_delete: "Excluir minha conta",
    acct_name_label: "Nome",
    acct_email_label: "E-mail",
    acct_locale_label: "Idioma",
    acct_locale_inherit: "Usar idioma da organizacao",
    acct_locale_hint:
      "Sobrescreve o idioma da organizacao apenas para sua conta. Deixe vazio para herdar.",

    // ── Analysis settings page ───────────────────────────────────────
    analise_title: "Configuracao da Analise",
    analise_subtitle:
      "Personalize o fluxo, copy e comportamento da analise para seus pacientes.",
  },
};

export type Dictionary = DictShape;
