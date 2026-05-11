// Spanish translation. REVIEW_TRANSLATION_HUMAN: validate medical /
// dermatological terminology with a native speaker before going live to real
// clients. Translation done by AI, reviewed only for grammar.

import type { Dictionary } from "./pt-BR";

export const es: Dictionary = {
  nav: {
    product: "Producto",
    segments: "Segmentos",
    results: "Resultados",
    plans: "Planes",
    login: "Ingresar",
    cta: "Solicitar demo",
  },
  footer: {
    tagline_line1: "La piel son datos.",
    tagline_line2: "Nosotros los leemos.",
    location_line1: "São Paulo, Brasil",
    location_line2: "CDMX, México",
    section_product: "Producto",
    section_segments: "Segmentos",
    section_company: "Empresa",
    section_legal: "Legal",
    link_how_it_works: "Como funciona",
    link_results: "Resultados",
    link_plans: "Planes",
    link_demo: "Demo",
    link_labs: "Laboratorios",
    link_clinics: "Clinicas",
    link_pharmacies: "Farmacias",
    link_retail: "Retail",
    link_contact: "Contacto",
    link_press: "Prensa",
    link_privacy: "Privacidad",
    link_terms: "Terminos",
    link_lgpd: "LGPD",
    copyright: "2026 Skinner Tecnologia",
  },
  language: {
    label: "Idioma",
  },

  home: {
    hero_eyebrow: "PLATAFORMA SAAS B2B · TECNOLOGIA DE PIEL",
    hero_title_line1: "Diagnostico de piel",
    hero_title_line2: "que vende.",
    hero_subtitle:
      "La primera plataforma SAAS B2B que combina IA dermatologica con economia de plataforma. Tu clinica, laboratorio o farmacia ejecuta analisis, recomienda productos y genera ingresos recurrentes.",
    hero_cta_primary: "Ver planes",
    hero_cta_secondary: "Como funciona",
    pillar_eyebrow: "TRES PILARES, UNA PLATAFORMA",
    pillar1_title: "Analisis IA",
    pillar1_text:
      "Evaluacion dermatologica basada en foto + cuestionario. Resultados en segundos, con nivel clinico.",
    pillar2_title: "Recomendacion",
    pillar2_text:
      "Catalogo propio del tenant. Match score por concern, tipo de piel, ingredientes y contraindicaciones.",
    pillar3_title: "Conversion",
    pillar3_text:
      "Carrito integrado a Nuvemshop, Shopify o WhatsApp. Atribucion de comision automatica.",
  },

  auth: {
    login_title: "Ingresar",
    login_subtitle: "Accede al panel de tu organizacion",
    login_email: "Correo electronico",
    login_password: "Contrasena",
    login_submit: "Ingresar",
    login_forgot: "Olvide mi contrasena",
    login_error_invalid: "Correo o contrasena invalidos.",
    login_error_no_tenant: "Cuenta sin organizacion asociada.",
    login_error_unauthorized: "Acceso no autorizado en este portal.",
    login_error_wrong_portal: "Usa el portal correcto para tu cuenta.",
    forgot_title: "Recuperar contrasena",
    forgot_subtitle:
      "Ingresa tu correo y te enviaremos un enlace para crear una nueva contrasena.",
    forgot_email: "Correo electronico",
    forgot_submit: "Enviar enlace",
    forgot_back: "Volver al login",
    forgot_success_title: "Revisa tu correo",
    forgot_success_text:
      "Si la cuenta existe, te enviamos un enlace para crear una nueva contrasena. Puede tardar unos minutos.",
    reset_title: "Nueva contrasena",
    reset_subtitle: "Define una nueva contrasena de acceso.",
    reset_password: "Nueva contrasena",
    reset_confirm: "Confirma la nueva contrasena",
    reset_submit: "Guardar nueva contrasena",
    reset_error_mismatch: "Las contrasenas no coinciden.",
    reset_error_short: "La contrasena debe tener al menos 8 caracteres.",
    reset_error_token: "Enlace invalido o expirado.",
    reset_success: "Contrasena actualizada. Redirigiendo al login...",
  },

  dashboard: {
    portal_subtitle: "Portal B2B",
    nav_onboarding: "Onboarding",
    nav_dashboard: "Panel",
    nav_catalog: "Catalogo",
    nav_reports: "Reportes",
    nav_leads: "Leads",
    nav_kits: "Kits",
    nav_analysis: "Analisis",
    nav_brand: "Marca",
    nav_channels: "Canales",
    nav_integrations: "Integraciones",
    nav_users: "Usuarios",
    nav_billing: "Facturacion",
    nav_organization: "Organizacion",
    nav_account: "Mi cuenta",
    nav_logout: "Salir",
  },

  patient: {
    contact_title: "Para personalizar tu analisis",
    contact_default_message:
      "{tenant} le gustaria mantenerse en contacto para acompanar tu proceso y enviarte el resultado completo del analisis.",
    contact_name_label: "Nombre (opcional)",
    contact_name_placeholder: "Como podemos llamarte",
    contact_email_label_optional: "Correo electronico (opcional)",
    contact_email_label_required: "Correo electronico (obligatorio)",
    contact_email_placeholder: "tu@email.com",
    contact_phone_label_optional: "WhatsApp (opcional)",
    contact_phone_label_required: "WhatsApp (obligatorio)",
    contact_phone_placeholder: "+52 55 1234 5678",
    contact_consent_text:
      "Acepto recibir contacto de {tenant} sobre el resultado de mi analisis y recomendaciones de tratamiento. En conformidad con la proteccion de datos personales aplicable.",
    contact_error_both_required:
      "Ingresa tu correo Y tu WhatsApp para continuar.",
    contact_error_consent_required:
      "Marca el consentimiento de privacidad para continuar.",
    contact_error_consent_with_contact:
      "Ingresaste un contacto. Confirma el consentimiento de privacidad para continuar, o limpia los campos.",
    contact_skip: "Omitir",
    contact_continue: "Continuar",

    photo_title: "Toma una foto de tu rostro",
    photo_instruction:
      "Para un analisis preciso, posiciona tu rostro dentro de la guia oval. Sin maquillaje, sin lentes y de frente a la camara.",
    photo_error_camera:
      "No se pudo acceder a la camara. Revisa los permisos del navegador o intenta subir una foto.",
    photo_error_camera_start: "No se pudo iniciar la camara.",
    photo_error_file_type: "Por favor, selecciona una imagen.",
    photo_error_file_size: "Imagen demasiado grande. Maximo 10MB.",
    photo_position_face: "Posiciona tu rostro",
    photo_oval_label: "dentro de la guia oval",
    photo_top_hint: "↓ Parte superior de la frente aqui ↓",
    photo_bottom_hint: "↑ Menton aqui ↑",
    photo_forehead_label: "Frente aqui",
    photo_chin_label: "Menton aqui",
    photo_take: "Tomar foto",
    photo_upload: "Subir foto",
    photo_camera_initializing: "Iniciando camara...",
    photo_align_text:
      "Alinea la parte superior de la frente y el menton con la guia oval",
    photo_cancel: "Cancelar",
    photo_capture: "Capturar",
    photo_wait: "Espera...",
    photo_retry: "Tomar otra",
    photo_use: "Usar esta foto",
    photo_tips_title: "Para un analisis preciso",
    photo_tip_lighting_title: "Iluminacion",
    photo_tip_lighting_text:
      "Luz natural frontal. Evita sombras en el rostro y luz fuerte detras de ti.",
    photo_tip_position_title: "Posicion",
    photo_tip_position_text:
      "Mira directo a la camara, rostro recto sin inclinar a los lados.",
    photo_tip_prep_title: "Preparacion",
    photo_tip_prep_text:
      "Sin maquillaje, sin lentes, cabello recogido mostrando la frente.",
    photo_tip_frame_title: "Encuadre",
    photo_tip_frame_text:
      "Llena el oval desde la parte superior de la frente hasta el menton. Solo el rostro, sin el cuerpo.",

    loading_title: "Analizando tu piel",
    loading_did_you_know: "Sabias que",
    loading_msg_1: "Analizando tu tipo de piel...",
    loading_msg_2: "Identificando condiciones y preocupaciones...",
    loading_msg_3: "Evaluando la barrera cutanea...",
    loading_msg_4: "Cruzando datos con nuestra base dermatologica...",
    loading_msg_5: "Seleccionando los mejores productos para ti...",
    loading_msg_6: "Armando tu plan de accion personalizado...",
    loading_msg_7: "Casi listo. Finalizando tu reporte...",
    loading_tip_1:
      "La piel tarda alrededor de 28 dias en renovarse completamente.",
    loading_tip_2: "El protector solar es el anti-edad mas eficaz que existe.",
    loading_tip_3:
      "La niacinamida es compatible con casi todos los tipos de piel.",
    loading_tip_4: "Una buena hidratacion mejora hasta las pieles grasas.",
    loading_tip_5:
      "Los ingredientes activos deben introducirse de forma gradual.",
    loading_preparing: "Preparando analisis...",

    quest_progress: "Pregunta {current} de {total}",
    quest_multi_hint: "Selecciona hasta {max} opciones",
    quest_text_placeholder: "Escribe aqui (opcional)...",
    quest_back: "Volver",
    quest_next: "Siguiente",
    quest_skip: "Omitir",
    quest_see_results: "Ver resultados",
  },

  dashboardPages: {
    org_title: "Mi Organizacion",
    org_subtitle:
      "Informacion general de tu clinica y preferencias regionales.",
    org_identifiers: "Identificadores",
    org_id_label: "ID de la organizacion",
    org_slug_label: "Slug publico",
    org_slug_hint: "Usado en URLs como app.skinner.lat/analise/{slug}",
    org_plan_label: "Plan actual",
    org_status_label: "Estado",
    org_data_section: "Datos de la organizacion",
    org_read_only_notice:
      "Solo los administradores pueden modificar estos campos. Estas en modo de lectura.",
    org_name_label: "Nombre comercial",
    org_country_label: "Pais",
    org_country_placeholder: "— Selecciona —",
    org_timezone_label: "Zona horaria",
    org_timezone_placeholder: "— Selecciona —",
    org_timezone_hint: "Usado para agendas y notificaciones.",
    org_locale_label: "Idioma predeterminado de la cuenta",
    org_locale_hint:
      "Define el idioma del panel B2B, de los reportes entregados a los pacientes y del flow de analisis. Cada canal puede sobrescribirlo individualmente.",
    org_save: "Guardar datos",
    org_saving: "Guardando...",
    org_saved: "Datos actualizados.",
    common_loading: "Cargando...",
  },
};
