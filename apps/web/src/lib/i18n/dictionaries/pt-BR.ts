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

    // Welcome screen (inline in analise/[slug] + embed/[slug])
    welcome_title: "Analise de Pele",
    welcome_description:
      "Descubra o tipo da sua pele e receba recomendacoes personalizadas de tratamento em menos de 3 minutos.",
    welcome_cta: "Iniciar Analise",
    welcome_subtext: "Gratuito e sem cadastro",

    // Consent screen
    consent_title: "Consentimento",
    consent_body:
      "Para realizar a analise, precisaremos de uma foto do seu rosto. Essa foto sera processada por inteligencia artificial para identificar caracteristicas da sua pele.",
    consent_data_protected: "Seus dados sao protegidos:",
    consent_li_1: "A foto e processada e descartada imediatamente",
    consent_li_2: "Nao armazenamos imagens faciais",
    consent_li_3: "A analise e anonima por padrao",
    consent_li_4: "Voce pode fornecer e-mail opcionalmente para receber o relatorio",
    consent_lgpd: "Em conformidade com a LGPD (Lei 13.709/2018).",
    consent_back: "Voltar",
    consent_cta: "Concordo e continuar",

    // Results screen
    results_header_eyebrow: "Resultado da Analise",
    results_your_skin_is: "Sua pele e",
    results_observation_label: "Observacao sobre seu tipo de pele",
    results_observation_intro:
      "Voce informou que sua pele e {self}, porem nossa analise identificou que sua pele e {detected}.",
    results_face_map: "Mapa Facial",
    results_skin_radar: "Radar da Pele",
    results_attention: "Atencao",
    results_healthy: "Saudavel",
    results_care: "Cuidado",
    results_zone_tap_hint: "Toque nos marcadores para ver detalhes de cada zona",
    results_zone_forehead: "Testa",
    results_zone_nose: "Nariz",
    results_zone_left_cheek: "Boch. Esq.",
    results_zone_right_cheek: "Boch. Dir.",
    results_zone_chin: "Queixo",
    results_zone_under_eyes: "Olheiras",
    results_zone_jawline: "Maxilar",
    results_phases_title: "Seu cuidado em 3 fases",
    results_phase_starting: "Comecando",
    results_phase_progressing: "Avancando",
    results_phase_maintaining: "Mantendo",
    results_phase_weeks_1_2: "Semanas 1-2",
    results_phase_weeks_3_8: "Semanas 3-8",
    results_phase_month_3: "Mes 3+",
    results_close: "fechar",
    results_section_conditions: "O que observamos na sua pele",
    results_section_products: "Produtos Recomendados",
    results_section_services: "Servicos Recomendados",
    results_section_alert: "Quando consultar um dermatologista",
    results_alert_closing: "Se apresentar qualquer um destes sinais, consulte um dermatologista.",
    results_section_kit: "Kit de tratamento",
    results_kit_title: "Todos os seus produtos em um link",
    results_kit_description: "Compartilhe seu kit personalizado ou acesse-o a qualquer momento.",
    results_kit_share: "Compartilhar Kit",
    results_kit_view: "Ver Kit Completo",
    results_email_section: "Receba o relatorio completo",
    results_email_placeholder: "seu@email.com",
    results_email_send: "Enviar",
    results_email_sending: "Enviando...",
    results_email_sent: "E-mail enviado.",
    results_download_pdf: "Baixar relatorio em PDF",
    results_downloading_pdf: "Gerando PDF...",
    results_disclaimer_default:
      "Esta analise e apenas informativa e nao substitui a consulta com um dermatologista.",
    results_powered_by: "POWERED BY SKINNER",
    results_step_label: "Etapa",
    results_recommended_badge: "Recomendado",
    results_alternative_badge: "Alternativa",
    results_match_score: "Match",
    results_cart_add: "Adicionar",
    results_cart_added: "No carrinho",
    results_buy_default: "Comprar",
    results_buy_whatsapp: "Comprar via WhatsApp",
    results_buy_mercadopago: "Pagar com MercadoPago",
    results_buy_external: "Comprar",
    results_book_service: "Agendar",
    results_step_cleanser: "Limpeza",
    results_step_toner: "Tonico",
    results_step_serum: "Serum",
    results_step_moisturizer: "Hidratante",
    results_step_spf: "Protetor Solar",
    results_step_treatment: "Tratamento",
    results_step_mask: "Mascara",
    results_step_exfoliant: "Esfoliante",
    results_step_eye_cream: "Area dos olhos",
    results_use_morning: "manha",
    results_use_night: "noite",
    results_use_morning_night: "manha e noite",
    results_use_apply:
      "Aplicar conforme instrucao do produto.",
    results_use_template: "Usar na etapa de {step}, {time}. {apply}",
    results_indicated_for: "Indicado para pele",
    results_aligned_objective: "Alinhado com seu objetivo:",
    results_severity_light: "Leve",
    results_severity_moderate: "Moderado",
    results_severity_severe: "Severo",
    results_barrier_section: "Estado da sua pele",

    // Cart floater
    cart_count_one: "{n} item",
    cart_count_many: "{n} itens",
    cart_total: "Total",
    cart_add_routine: "Adicionar rotina completa",
    cart_finalize: "Finalizar",
    cart_clear: "Limpar carrinho",
    cart_clear_confirm:
      "Voce ja tem itens de {current}. Adicionar este item de {target} vai substituir o carrinho. Confirmar?",
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

    // Section titles (full bodies)
    home_section_overview: "Visao geral",
    home_section_overview_sub: "Resultados financeiros e operacionais",
    home_section_plan: "Plano e capacidade",
    home_section_plan_sub: "Consumo do plano vs limite",
    home_section_trend: "Tendencia",
    home_section_trend_sub: "Volume e receita nos ultimos 6 meses",
    home_section_geo: "Distribuicao geografica",
    home_section_geo_sub: "De onde vem seus pacientes (capturado automaticamente)",
    home_section_profile: "Perfil de paciente",
    home_section_profile_sub: "Quem sao seus pacientes e o que precisam",
    home_section_personas: "Personas dominantes",
    home_section_personas_sub:
      "Perfis dominantes do seu publico — use para campanhas, estoque e comunicacao",
    home_section_conditions: "Condicoes mais frequentes",
    home_section_conditions_sub:
      "O que a IA esta detectando na pele dos seus pacientes",
    home_section_discrepancy: "Discrepancia de auto-percepcao",
    home_section_discrepancy_sub:
      "Quantos pacientes tem um tipo de pele diferente do que percebem",
    home_section_catalog: "Performance do catalogo",
    home_section_catalog_sub:
      "O que esta sendo recomendado e onde estao as oportunidades",
    home_section_lift: "Conversao por perfil",
    home_section_lift_sub:
      "Quais perfis convertem mais que a media — util para segmentar campanhas",
    home_section_seasonality: "Sazonalidade das condicoes",
    home_section_seasonality_sub:
      "Como cada condicao varia ao longo do ano — antecipe campanhas e estoque",
    home_section_benchmark: "Benchmark da plataforma",
    home_section_benchmark_sub:
      "Compare seus indicadores com a media de outros clientes Skinner (anonimo, agregado)",
    home_section_engagement: "Engajamento",
    home_section_engagement_sub:
      "Como pacientes estao interagindo com o resultado da analise",

    // KPI cards
    home_kpi_completed: "Analises completas",
    home_kpi_completed_hint: "{pct} de {total} iniciadas",
    home_kpi_conversions: "Conversoes em vendas",
    home_kpi_conversions_hint: "{pct} do total completas",
    home_kpi_revenue: "Receita atribuida",
    home_kpi_revenue_hint: "Ticket medio {avg}",
    home_kpi_pdf: "Downloads de PDF",
    home_kpi_pdf_hint: "{pct} de engajamento",

    // Plan usage card
    home_plan_label: "Plano {plan}",
    home_plan_count: "{used} / {limit} analises",
    home_plan_consumed: "{pct} consumido.",
    home_plan_near_limit: "Limite proximo — considere fazer upgrade.",
    home_plan_above_70: "Atencao: voce esta acima de 70% do limite.",
    home_plan_healthy: "Uso saudavel.",

    // Geography section
    home_geo_brazil_title: "Mapa do Brasil — analises por estado",
    home_geo_by_region: "Por estado / regiao",
    home_geo_top_cities: "Top 10 cidades",
    home_geo_empty_region:
      "Sem dados geograficos no periodo. Analises feitas em redes locais ou sem deteccao de IP aparecem como \"Desconhecido\".",
    home_geo_empty_city: "Sem dados de cidade.",

    // Profile section
    home_profile_skin_type: "Tipo de pele detectado",
    home_profile_age_range: "Faixa etaria",
    home_profile_objective: "Objetivo principal",
    home_profile_empty_skin: "Sem analises completas no periodo.",
    home_profile_empty_age: "Sem dados de faixa etaria.",
    home_profile_empty_objective: "Sem objetivos registrados.",

    // Conditions section
    home_conditions_empty: "Sem condicoes detectadas no periodo.",
    home_conditions_severity_light: "Leve",
    home_conditions_severity_moderate: "Moderada",
    home_conditions_severity_severe: "Severa",
    home_conditions_severity_label: "gravidade media",
    home_barrier_empty: "Sem dados.",

    // Discrepancy section
    home_discrepancy_rate: "Taxa de discrepancia",
    home_discrepancy_count_hint: "{mismatch} de {total} analises",
    home_discrepancy_why_title: "Por que isso importa",
    home_discrepancy_why_body:
      "Em {pct} dos casos, a analise da IA identificou um tipo de pele diferente do que o paciente acreditava ter. Use esse dado em campanhas: \"nossa analise revela em media informacoes que voce nao percebe sobre sua propria pele\".",

    // Catalog section
    home_catalog_top: "Top 8 produtos recomendados",
    home_catalog_top_rec_suffix: "rec.",
    home_catalog_top_empty: "Sem recomendacoes no periodo.",
    home_catalog_gaps: "Lacunas no catalogo",
    home_catalog_gaps_intro:
      "Condicoes detectadas em pacientes para as quais voce ainda nao tem produto:",
    home_catalog_gaps_patients: "{count} pacientes ({pct})",
    home_catalog_gaps_empty:
      "Seu catalogo cobre todas as condicoes detectadas. Excelente.",

    // Lift section
    home_lift_baseline: "Linha de base do tenant:",
    home_lift_baseline_count: "({converted} de {total} pacientes converteram).",
    home_lift_explanation:
      "Lift = quanto cada segmento converte vs essa media (1.50x = 50% acima).",
    home_lift_by_skin: "Por tipo de pele",
    home_lift_by_age: "Por faixa etaria",
    home_lift_by_objective: "Por objetivo",
    home_lift_by_region: "Por regiao",

    // Benchmark section
    home_benchmark_opt_out_intro: "Voce ainda nao esta participando do benchmark. Ative em",
    home_benchmark_opt_out_link: "Configuracao da analise → Benchmark da plataforma",
    home_benchmark_opt_out_tail:
      "para comparar seus numeros com a media anonima dos demais clientes.",
    home_benchmark_low_sample:
      "Voce esta participando do benchmark, mas ainda nao temos clientes suficientes opt-in para gerar numeros agregados confiaveis ({count} de {min} minimos). Conforme mais clientes ativarem, os indicadores aparecerao aqui automaticamente.",
    home_benchmark_basis:
      "Baseado em {count} clientes opt-in (media agregada — nenhum cliente individual exposto).",
    home_benchmark_completion: "Taxa de conclusao",
    home_benchmark_conversion: "Taxa de conversao",
    home_benchmark_avg_ticket: "Ticket medio",

    // Engagement section
    home_engagement_pdf: "Downloads de PDF",
    home_engagement_email: "Envio por e-mail",
    home_engagement_pdf_rate: "Taxa de download de PDF",
    home_engagement_pdf_count: "{count} downloads",
    home_engagement_email_rate: "Taxa de envio por email",
    home_engagement_email_count: "{count} emails",
    home_engagement_completed: "Analises completas",
    home_engagement_completed_hint: "No periodo selecionado",
    home_analyses_one: "analise",
    home_analyses_many: "analises",
    home_patients_label: "pacientes",
    home_persona_rank: "Persona #{rank}",
    home_persona_min_sample: "Sem segmentos com amostra suficiente (minimo 3 pacientes).",
    home_seasonality_explanation:
      "Cada celula mostra o numero de pacientes com essa condicao naquele mes. Cor mais escura = mais casos.",

    // Low sample notice
    home_low_sample_one:
      "Amostra pequena ({sample} analise) — colete mais dados para insights confiaveis.",
    home_low_sample_many:
      "Amostra pequena ({sample} analises) — colete mais dados para insights confiaveis.",

    // Temp password banner (existing keys kept above are replaced by these
    // more accurate strings — the originals were too generic).
    home_temp_password_warn: "Voce ainda esta usando uma senha temporaria.",
    home_temp_password_hint:
      "Por seguranca, recomendamos altera-la agora em Minha Conta.",
    home_temp_password_change: "Alterar senha",

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
    kits_new_manual: "Novo kit manual",
    kits_tab_auto: "Kits Automaticos",
    kits_tab_manual: "Kits Manuais",
    kits_auto_empty: "Nenhuma analise com kit gerado ainda.",
    kits_th_total: "Valor Total",
    kits_anonymous: "Anonimo",
    kits_copy_link: "Copiar link",
    kits_copied: "Copiado",
    kits_view_kit: "Ver kit",
    kits_showing_50: "Mostrando 50 de {total} kits.",
    kits_manual_empty: "Nenhum kit manual criado ainda.",
    kits_create_first: "Criar primeiro kit",
    kits_inactive: "Inativo",
    kits_off_suffix: "% off",
    kits_with_discount: "com desconto",
    kits_product_one: "produto",
    kits_product_many: "produtos",
    kits_confirm_deactivate: "Desativar este kit?",

    // ── Brand page ───────────────────────────────────────────────────
    marca_title: "Marca",
    marca_subtitle:
      "Personalize o visual da analise para seus pacientes.",
    marca_logo_section: "Logotipo",
    marca_colors_section: "Cores",
    marca_voice_section: "Tom da marca",
    marca_disclaimer_section: "Aviso legal",
    marca_logo_label: "URL do Logo",
    marca_logo_placeholder: "https://exemplo.com/logo.png",
    marca_logo_hint: "Recomendado: PNG transparente, 200x60px.",
    marca_primary_color: "Cor primaria",
    marca_secondary_color: "Cor secundaria",
    marca_voice_label: "Voz de marca",
    marca_voice_placeholder:
      "Ex: Profissional, acolhedor e educativo. Use linguagem acessivel...",
    marca_voice_hint: "Instrucoes de tom para a IA ao gerar relatorios.",
    marca_disclaimer_label: "Disclaimer medico",
    marca_disclaimer_placeholder:
      "Ex: Esta analise e apenas informativa e nao substitui a consulta com um dermatologista.",
    marca_save: "Salvar marca",
    marca_saved: "Salvo.",

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
    chan_your_channels: "Seus canais",
    chan_new_button: "+ Novo canal",
    chan_limit_intro:
      "Voce atingiu o limite de canais do plano {plan}. Faca upgrade em",
    chan_limit_tail: "para criar mais.",
    chan_status_active: "ativo",
    chan_status_paused: "pausado",
    chan_status_expired: "expirado",
    chan_default: "padrao",
    chan_analyses_count: "{count} analises",
    chan_expires_label: "expira {date}",
    chan_selected: "Canal selecionado",
    chan_pause: "Pausar",
    chan_reactivate: "Reativar",
    chan_delete: "Excluir",
    chan_confirm_delete:
      "Excluir o canal \"{label}\"? Esta acao nao pode ser desfeita.",
    chan_link_intro:
      "Compartilhe este link com seus clientes para iniciar a analise.",
    chan_copy: "Copiar",
    chan_copied: "Copiado",
    chan_qr_intro:
      "Imprima e coloque no balcao, vitrine ou material promocional.",
    chan_qr_download: "Baixar QR Code",
    chan_embed_intro:
      "Cole o snippet abaixo onde quiser que a analise apareca no seu site. Funciona em qualquer plataforma.",
    chan_embed_personalize: "Personalizacao",
    chan_embed_skip_contact: "Pular tela de captura de contato",
    chan_embed_compact: "Modo compacto",
    chan_embed_height: "Altura inicial (px):",
    chan_embed_snippet: "Snippet",
    chan_embed_copy_code: "Copiar codigo",
    chan_embed_helper_title: "Auto-resize (opcional)",
    chan_embed_helper_intro:
      "Cole UMA vez no seu site para que o iframe redimensione automaticamente.",
    chan_modal_title: "Novo canal",
    chan_modal_label: "Nome interno",
    chan_modal_label_placeholder: "Ex.: Unidade Centro, Black Friday, Loja Shopify",
    chan_modal_slug: "Slug (URL)",
    chan_modal_url_preview: "URL:",
    chan_modal_expires: "Expira em (opcional)",
    chan_modal_max: "Limite de analises",
    chan_modal_max_placeholder: "ilimitado",
    chan_modal_creating: "Criando...",
    chan_modal_create: "Criar canal",

    // ── Integrations page ────────────────────────────────────────────
    int_title: "Integracoes",
    int_subtitle:
      "Conecte sua loja virtual para vendas automaticas e atribuicao de comissao.",
    int_storefront_title: "Storefront Lite",
    int_storefront_intro:
      "Ative para usar as opcoes de venda abaixo. Quando desativado, os produtos so exibem CTA se tiverem link externo cadastrado.",
    int_storefront_enable_label: "Habilitar Storefront Lite",
    int_storefront_enable_hint:
      "Permite vender diretamente via WhatsApp ou MercadoPago sem loja virtual.",
    int_cta_mode_title: "Modo de Venda",
    int_cta_mode_intro:
      "Escolha como o botao de compra aparece para os consumidores nas telas de resultado e kit.",
    int_cta_mode_external: "Link externo",
    int_cta_mode_external_desc:
      "Usa o link de ecommerce cadastrado em cada produto. Comportamento atual.",
    int_cta_mode_whatsapp: "WhatsApp",
    int_cta_mode_whatsapp_desc:
      "Cada produto exibe um botao que abre o WhatsApp com uma mensagem pre-preenchida.",
    int_cta_mode_mercadopago: "MercadoPago",
    int_cta_mode_mercadopago_desc:
      "Cada produto exibe um botao para pagar via MercadoPago.",
    int_cta_mode_both: "WhatsApp + MercadoPago",
    int_cta_mode_both_desc:
      "Exibe os dois botoes lado a lado em cada produto recomendado.",
    int_whatsapp_title: "Configuracao do WhatsApp",
    int_whatsapp_intro:
      "Defina o numero e a mensagem enviada quando o consumidor clicar em Comprar via WhatsApp.",
    int_whatsapp_number: "Numero do WhatsApp",
    int_whatsapp_number_hint:
      "Formato recomendado: +55 11 99999-9999. Inclua o codigo do pais e DDD.",
    int_whatsapp_message: "Modelo de mensagem",
    int_whatsapp_variables: "Variaveis disponiveis:",
    int_whatsapp_preview: "Preview da mensagem",
    int_whatsapp_preview_to: "Enviado para:",
    int_mp_title: "Configuracao do MercadoPago",
    int_mp_intro: "Configure o recebimento de pagamentos via MercadoPago.",
    int_mp_enable_label: "Habilitar MercadoPago",
    int_mp_enable_hint: "Exibe o botao de pagamento nos produtos recomendados.",
    int_mp_email_label: "Email do MercadoPago",
    int_mp_email_hint:
      "Email associado a sua conta MercadoPago para receber os pagamentos.",
    int_mp_disclaimer:
      "O sistema gera um link de pagamento MercadoPago por produto no momento do clique. Integracao completa com checkout disponivel em breve.",
    int_save: "Salvar configuracoes",
    int_saved: "Salvo.",
    int_section_integrations: "Integracoes",
    int_section_integrations_sub: "Conexoes diretas com plataformas de ecommerce e ERP.",

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
    bill_per_month: "/mes",
    bill_credits: "Creditos",
    bill_credits_remaining: "{count} restantes",
    bill_estimated: "Fatura estimada",
    bill_base: "Base",
    bill_excess: "Excedente ({count} analises)",
    bill_commission: "Comissao ({pct}%)",
    bill_custom_plan_title: "Voce possui um plano personalizado ({name}).",
    bill_custom_plan_contact:
      "Para alteracoes no seu plano, entre em contato com nossa equipe comercial.",
    bill_available_plans: "Planos disponiveis",
    bill_on_request: "Sob consulta",
    bill_setup_label: "Setup: R$ {price}",
    bill_redirecting: "Redirecionando...",
    bill_subscribe: "Inscrever-se",
    bill_active: "Plano ativo",
    bill_history: "Historico de uso",
    bill_th_type: "Tipo",
    bill_th_qty: "Qtd",
    bill_th_value: "Valor",
    bill_type_analysis: "Analise",
    bill_type_commission: "Comissao",

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
    acct_locale_default_org: "Padrao da organizacao",
    acct_locale_section_text:
      "Defina o idioma do seu painel administrativo. Esta preferencia e individual e nao afeta o que seus pacientes veem nas analises.",
    acct_pwd_temp_warning:
      "Voce ainda esta usando uma senha temporaria. Recomendamos altera-la agora.",
    acct_pwd_current: "Senha atual",
    acct_pwd_new: "Nova senha",
    acct_pwd_confirm: "Confirmar nova senha",
    acct_pwd_min: "Minimo 8 caracteres.",
    acct_pwd_changing: "Alterando...",
    acct_pwd_change: "Alterar senha",
    acct_delete_body:
      "Esta acao remove o acesso da sua clinica ao Skinner e anonimiza todos os dados dos pacientes (fotos, respostas e localizacao sao apagados; metricas agregadas sao preservadas para conformidade contabil). Usuarios da equipe sao despersonalizados.",
    acct_delete_warn: "A acao nao pode ser desfeita por voce.",
    acct_delete_confirm_intro: "Para confirmar, digite",
    acct_delete_processing: "Processando...",
    acct_delete_cta: "Excluir conta definitivamente",

    // ── Analysis settings page ───────────────────────────────────────
    analise_title: "Configuracao da Analise",
    analise_subtitle:
      "Personalize o fluxo, copy e comportamento da analise para seus pacientes.",
    analise_plan_atual: "Plano atual",
    analise_pre: "Pre-Analise",
    analise_capture: "Captura",
    analise_results: "Resultado",
    analise_sec_welcome: "Tela de Boas-vindas",
    analise_sec_welcome_desc:
      "Personalize os textos exibidos antes do cliente iniciar a analise.",
    analise_sec_consent: "Tela de Consentimento",
    analise_sec_consent_desc:
      "Adicione texto extra ou personalize o botao de confirmacao.",
    analise_sec_photo: "Tela de Foto",
    analise_sec_photo_desc:
      "Instrucoes exibidas ao cliente no momento da captura da foto.",
    analise_sec_quest: "Questionario",
    analise_sec_quest_desc:
      "Ative ou desative perguntas opcionais.",
    analise_sec_photo_only: "Modo Somente Foto",
    analise_sec_contact: "Captura de contato",
    analise_sec_contact_desc:
      "Decida se voce quer capturar o nome, e-mail ou telefone do paciente.",
    analise_sec_delivery: "Entrega e notificacoes",
    analise_sec_delivery_desc:
      "Como entregar o resultado e quem deve receber notificacoes.",
    analise_sec_tone: "Tom da analise",
    analise_sec_tone_desc:
      "Define como a IA escreve o resultado para o paciente. Tecnico ou humanizado.",
    analise_sec_benchmark: "Benchmark da plataforma",
    analise_sec_benchmark_desc:
      "Compartilhe dados agregados (anonimizados) e veja como sua clinica se compara.",
    analise_sec_results_texts: "Textos dos Resultados",
    analise_sec_visible: "Secoes Visiveis",
    analise_sec_visible_desc: "Controle quais sessoes aparecem na tela final do paciente.",
    analise_sec_limits: "Limites de Recomendacao",

    // ── Admin panel (skinner_admin role) ─────────────────────────────
    admin_portal_subtitle: "Admin",
    admin_nav_dashboard: "Painel",
    admin_nav_tenants: "Tenants",
    admin_nav_plans: "Planos",
    admin_nav_users: "Usuarios",
    admin_nav_leads: "Leads",
    admin_nav_analytics: "Analytics",
    admin_nav_dermatology: "Dermatologia",
    admin_nav_form: "Formulario",
    admin_nav_prompt_ai: "Prompt IA",

    // Admin dashboard
    admin_dash_title: "Painel Administrativo",
    admin_dash_subtitle: "Visao geral da plataforma Skinner.",
    admin_dash_active_tenants: "Tenants ativos",
    admin_dash_active_tenants_hint: "{count} no total",
    admin_dash_mrr: "MRR",
    admin_dash_mrr_hint: "Receita recorrente mensal",
    admin_dash_analyses_month: "Analises (mes)",
    admin_dash_analyses_month_hint: "Em todos os tenants",
    admin_dash_active_users: "Usuarios ativos (30d)",
    admin_dash_signups: "Novos signups (30d)",
    admin_dash_section_recent: "Tenants recentes",
    admin_dash_section_recent_sub: "Ultimos 5 signups na plataforma.",
    admin_dash_section_top: "Top tenants por volume",
    admin_dash_section_top_sub: "Maiores consumidores de analises este mes.",
    admin_dash_mrr_sub: "planos ativos",
    admin_dash_analyses_month_label: "Analises este mes",
    admin_dash_tenants_active_sub: "de {total} total",
    admin_dash_users_label: "Usuarios B2B",
    admin_dash_risk_label: "Risco de uso",
    admin_dash_risk_sub: "tenants acima de 80%",
    admin_dash_recent_analyses: "Ultimas analises",
    admin_dash_empty_analyses: "Nenhuma analise realizada ainda.",
    admin_dash_at_risk: "Tenants em risco",
    admin_dash_at_risk_empty: "Nenhum tenant acima de 80% do limite.",
    admin_dash_critical_title: "Configuracoes criticas",
    admin_dash_critical_sub: "Tenants com configuracoes de seguranca desativadas.",
    admin_dash_critical_empty:
      "Nenhum tenant com configuracoes criticas desativadas.",

    // Admin tenants list
    admin_tenants_title: "Tenants",
    admin_tenants_subtitle: "Gerencie organizacoes ativas na plataforma.",
    admin_tenants_new: "Novo Tenant",
    admin_tenants_new_custom: "Novo Plano Custom",
    admin_tenants_search: "Buscar por nome, slug ou e-mail...",
    admin_tenants_th_name: "Nome",
    admin_tenants_th_slug: "Slug",
    admin_tenants_th_plan: "Plano",
    admin_tenants_th_status: "Status",
    admin_tenants_th_usage: "Uso",
    admin_tenants_th_signup: "Cadastro",
    admin_tenants_status_active: "Ativo",
    admin_tenants_status_paused: "Pausado",
    admin_tenants_status_deleted: "Removido",
    admin_tenants_empty: "Nenhum tenant cadastrado ainda.",
    admin_tenants_open: "Abrir",
    admin_tenants_create_title: "Criar Tenant",
    admin_tenants_field_name: "Nome",
    admin_tenants_field_name_ph: "Clinica Exemplo",
    admin_tenants_field_slug: "Slug",
    admin_tenants_field_slug_ph: "clinica-exemplo",
    admin_tenants_field_plan: "Plano",
    admin_tenants_creating: "Criando...",
    admin_tenants_create: "Criar",
    admin_tenants_subtitle_old: "Gerencie clientes B2B da plataforma.",
    admin_tenants_th_users: "Usuarios",
    admin_tenants_th_products: "Produtos",
    admin_tenants_th_analyses: "Analises",
    admin_tenants_actions_details: "Detalhes",
    admin_tenants_action_pause: "Pausar",
    admin_tenants_action_activate: "Ativar",
    admin_tenants_status_active_label: "Ativo",
    admin_tenants_status_paused_label: "Pausado",
    admin_tenants_status_deleted_label: "Deletado",
    admin_tenants_no_register: "Nenhum tenant cadastrado.",

    // Admin plans
    admin_plans_title: "Planos",
    admin_plans_subtitle:
      "Pricing, limites e features dos planos disponiveis na plataforma.",
    admin_plans_new: "Novo Plano",
    admin_plans_th_id: "ID",
    admin_plans_th_name: "Nome",
    admin_plans_th_price: "Preco",
    admin_plans_th_limit: "Limite",
    admin_plans_th_visible: "Visivel",
    admin_plans_th_tenants: "Tenants",
    admin_plans_archive: "Arquivar",
    admin_plans_unarchive: "Reativar",
    admin_plans_deprecated: "Descontinuado",
    admin_plans_custom_allowed: "Custom permitido",

    // Admin users
    admin_users_title: "Usuarios",
    admin_users_subtitle:
      "Lista de todos os usuarios cadastrados na plataforma.",
    admin_users_th_email: "E-mail",
    admin_users_th_name: "Nome",
    admin_users_th_role: "Papel",
    admin_users_th_tenant: "Tenant",
    admin_users_th_last_login: "Ultimo acesso",
    admin_users_role_skinner_admin: "Skinner Admin",
    admin_users_role_b2b_admin: "Admin B2B",
    admin_users_role_b2b_analyst: "Analista",
    admin_users_role_b2b_viewer: "Visualizador",

    // Admin leads
    admin_leads_title: "Leads",
    admin_leads_subtitle:
      "Leads capturados em todos os tenants da plataforma.",
    admin_leads_empty: "Nenhuma lead capturada ainda.",
    admin_leads_th_tenant: "Tenant",
    admin_leads_th_origin: "Origem",

    // Admin analytics
    admin_analytics_title: "Analytics",
    admin_analytics_subtitle:
      "Metricas agregadas da plataforma (todos os tenants).",
    admin_analytics_section_growth: "Crescimento",
    admin_analytics_section_health: "Saude da plataforma",
    admin_analytics_section_top_brands: "Top marcas",

    // Admin dermatology
    admin_derm_title: "Dermatologia",
    admin_derm_subtitle:
      "Base de conhecimento clinico usada pela IA.",

    // Admin form / prompt
    admin_form_title: "Formulario",
    admin_form_subtitle:
      "Configure as perguntas do questionario que o paciente responde antes da analise.",
    admin_prompt_title: "Prompt IA",
    admin_prompt_subtitle:
      "Regras e instrucoes globais que a IA segue ao gerar relatorios.",
  },
};

export type Dictionary = DictShape;
