# SKINNER - Roadmap de Desarrollo MVP

## Decisiones Tecnicas Definidas

### Stack Final MVP

| Capa | Tecnologia | Justificacion |
|------|-----------|---------------|
| Monorepo | Turborepo + pnpm workspaces | Orquestacion eficiente, cache inteligente, escala bien |
| Frontend Web | Next.js 14 (App Router) + TypeScript | SSR/SSG, performance, SEO para marketing site |
| Backend API | Next.js API Routes + tRPC | Type-safe end-to-end, mismo deploy, sin overhead de servidor separado |
| API Publica | REST (endpoints separados) | Para webhooks, integraciones B2B, pixel de comision |
| Base de Datos | PostgreSQL (Supabase Cloud) | RLS nativo, auth integrado, realtime |
| ORM | Prisma | Type-safe, migrations automatizadas, excelente DX |
| Autenticacion | Supabase Auth | JWT, multi-tenant, sin infra adicional |
| Storage | Supabase Storage | Fotos temporales, PDFs, catalogos |
| IA - Analisis | Claude API (claude-sonnet-4) | Analisis multimodal: validacion de foto + diagnostico en un solo call |
| Pagos | Stripe Billing + Metered Usage | Suscripciones + excedentes + comisiones |
| Email | Resend + React Email | Transaccional, PDFs, templates con marca |
| PDF | React PDF (@react-pdf/renderer) | Generacion server-side, branding dinamico |
| Cache/Rate Limit | Upstash Redis | Rate limiting, cache de sesiones, serverless-friendly |
| Deploy | Vercel | Frontend + API + cron jobs + edge functions, todo en uno |
| Background Jobs | Vercel Cron + Inngest | Generacion PDF, envio emails, procesamiento async |
| Monitoreo | Sentry + PostHog | Errores + analytics de producto |
| UI Components | shadcn/ui + Tailwind CSS | Consistente, accesible, customizable |
| Validacion | Zod | Schemas compartidos entre frontend y backend via tRPC |

### Decisiones Tecnicas Clave

- **Sin Google Vision API**: Claude maneja validacion de foto + diagnostico en un solo call (simplifica pipeline, reduce costos, elimina dependencia)
- **Todo en Vercel**: Sin Railway. Vercel maneja SSR, API routes, cron jobs e Inngest maneja jobs async pesados (PDF, emails). Simplifica ops.
- **Turborepo monorepo** con packages: `web` (Next.js), `ui` (componentes compartidos), `db` (Prisma schema), `emails` (templates React Email)
- **Idioma MVP**: pt-BR unicamente. i18n se agrega en Fase 2 con next-intl.
- **Comision automatica**: Pixel JS liviano que el B2B instala en su checkout.

---

## Estructura del Monorepo

```
skinner/
├── apps/
│   └── web/                  # Next.js 14 App Router
│       ├── app/
│       │   ├── (marketing)/  # Site publico: home, planos, demo, blog
│       │   ├── (auth)/       # Login, registro, reset password
│       │   ├── (admin)/      # Portal Admin Skinner (master)
│       │   ├── (dashboard)/  # Portal B2B (tenant dashboard)
│       │   ├── (analysis)/   # Flujo B2C: cuestionario + foto + resultado
│       │   └── api/          # API Routes + tRPC router
│       └── ...
├── packages/
│   ├── ui/                   # shadcn/ui components compartidos
│   ├── db/                   # Prisma schema + migrations + seed
│   ├── emails/               # React Email templates
│   ├── analysis-engine/      # SAE: pipeline de analisis Claude
│   ├── pdf-generator/        # React PDF templates + generacion
│   ├── billing/              # Logica Stripe: planes, metered, comisiones
│   ├── pixel/                # Script JS de tracking para B2Bs
│   └── config/               # ESLint, TypeScript, Tailwind configs compartidos
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## Roadmap Sprint por Sprint

### SPRINT 0 — Fundacion (Semanas 1-2)

**Objetivo**: Infraestructura base lista para desarrollar features.

#### Semana 1
| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Setup monorepo Turborepo | pnpm workspaces, turbo.json, scripts base |
| 2 | Next.js 14 App Router | App shell con layout groups, middleware tenant |
| 3 | Supabase proyecto | Crear proyecto, configurar env variables |
| 4 | Prisma schema v1 | Modelos core: tenants, users, tenant_configs |
| 5 | Supabase Auth | Configurar auth, JWT custom claims con tenant_id |
| 6 | CI/CD Vercel | Deploy automatico, preview branches, env vars |
| 7 | Design system base | Tailwind config, shadcn/ui init, theme tokens |

#### Semana 2
| # | Tarea | Detalles |
|---|-------|---------|
| 8 | tRPC setup | Router base, context con tenant, middleware auth |
| 9 | RLS Supabase | Politicas por tenant_id en todas las tablas core |
| 10 | Sentry + PostHog | Error tracking + analytics basico |
| 11 | Upstash Redis | Rate limiting middleware, config por tenant |
| 12 | React Email setup | Template base, integracion Resend |
| 13 | Seed script | Datos de prueba: 1 tenant, productos mock, usuario admin |
| 14 | Git workflow | Branch strategy, PR templates, husky + lint-staged |

**Entregable Sprint 0**: Monorepo deployado en Vercel, auth funcionando, un tenant de prueba creado, CI/CD operativo.

**Dependencias bloqueantes**: Ninguna tecnica. Pendiente del usuario: dominio, identidad visual (pueden resolverse en paralelo).

---

### SPRINT 1 — Auth Multi-tenant + Portal Admin (Semanas 3-4)

**Objetivo**: Skinner admin puede crear y gestionar tenants B2B.

#### Semana 3
| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Modelo de roles | Roles: skinner_admin, b2b_admin, b2b_analyst, b2b_viewer |
| 2 | Middleware multi-tenant | Resolucion tenant por subdominio o header, inyeccion en contexto |
| 3 | Portal Admin - Layout | Sidebar nav, header, breadcrumbs, responsive |
| 4 | CRUD Tenants | Crear, editar, pausar, eliminar B2Bs |
| 5 | Config de planes | Asignar plan (Starter/Growth/Enterprise) + limites |

#### Semana 4
| # | Tarea | Detalles |
|---|-------|---------|
| 6 | Portal B2B - Auth | Login B2B, invitacion de usuarios, roles |
| 7 | Portal B2B - Layout | Dashboard shell, nav, tenant branding dinamico |
| 8 | Config de marca B2B | Upload logo, colores, voz de marca, disclaimer |
| 9 | Gestion de usuarios B2B | CRUD usuarios del tenant, asignacion de roles |
| 10 | Admin - Dashboard basico | Metricas placeholder: total tenants, status |

**Entregable Sprint 1**: Admin Skinner crea un B2B, el B2B hace login, configura su marca y gestiona usuarios.

---

### SPRINT 2 — Catalogo de Productos (Semanas 5-6)

**Objetivo**: B2B puede cargar, mapear y gestionar su catalogo completo.

#### Semana 5
| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Schema productos | Prisma: products, product_tags, concern_tags, skin_type_tags |
| 2 | CRUD productos | Crear, editar, eliminar productos con imagen |
| 3 | Sistema de tags | Tags predefinidos: concerns, skin_types, objectives, severity |
| 4 | Mapeamento producto → condicion | UI drag-drop o multi-select para mapear tags |
| 5 | Upload de imagenes | Supabase Storage, resize automatico, validacion formato |

#### Semana 6
| # | Tarea | Detalles |
|---|-------|---------|
| 6 | Upload masivo CSV/XLSX | Parser con mapeo de columnas, validacion, preview antes de importar |
| 7 | Validacion de catalogo | Alertas: productos sin tags, sin imagen, campos faltantes |
| 8 | Busqueda y filtros | Buscar por nombre, filtrar por tag, ordenar por fecha |
| 9 | Versionamiento | Historial de cambios en productos, rollback |
| 10 | Base dermatologica v1 | Crear datos maestros: conditions, ingredients activos, rutinas base |

**Entregable Sprint 2**: B2B tiene catalogo cargado y mapeado. Base dermatologica inicial creada.

**Nota critica**: La base dermatologica (tarea 10) es un esfuerzo de contenido significativo. Necesita investigacion clinica para definir:
- 15-20 condiciones de piel principales con descripciones
- Ingredientes activos clave y sus indicaciones
- Rutinas base por tipo de piel y condicion
- Contraindicaciones comunes

Esto puede requerir consulta con un profesional dermatologico. Para el MVP, creamos una base funcional que se refine iterativamente.

---

### SPRINT 3 — Motor de Analisis SAE (Semanas 7-8)

**Objetivo**: Pipeline completo de analisis facial funcionando end-to-end.

#### Semana 7
| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Cuestionario adaptativo | 7 preguntas max, logica condicional, progress bar, mobile-first |
| 2 | Captura de foto | Camara nativa + upload, preview, instrucciones visuales |
| 3 | Validacion de foto (Claude) | Prompt que valida: rostro detectado, calidad > 60%, iluminacion |
| 4 | Prompt de analisis | Prompt estructurado: foto + cuestionario + base dermatologica |
| 5 | Pipeline SAE core | Orquestacion: recepcion → validacion → analisis → parse JSON |

#### Semana 8
| # | Tarea | Detalles |
|---|-------|---------|
| 6 | Scoring engine | Extraer conditions[], severity_tier[], barrier_status del response |
| 7 | Matching engine | Filtrar catalogo por concern_tags + scoring de adherencia |
| 8 | UI de resultados | Cards visuales: tipo piel, condiciones, productos recomendados |
| 9 | Inyeccion de contexto tenant | TCL: brand_voice, restricted_conditions, catalogo en el prompt |
| 10 | Loading UX | Animacion con mensajes educativos durante analisis (≤ 15s target) |
| 11 | Cache de analisis | Upstash Redis: cache de analisis similares para reducir costos Claude |

**Entregable Sprint 3**: Un usuario puede hacer cuestionario + foto → recibir diagnostico + recomendaciones personalizadas del catalogo del B2B.

**Este es el sprint mas critico del MVP. El SAE es el nucleo del producto.**

---

### SPRINT 4 — Reportes PDF + Canales (Semanas 9-10)

**Objetivo**: Generacion de reportes PDF branded y canales de distribucion.

#### Semana 9
| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Template PDF base | React PDF: capa, diagnostico, radar chart, plan de accion |
| 2 | Branding dinamico | Logo, colores, disclaimer del tenant inyectados en PDF |
| 3 | Productos en PDF | Foto, nombre, justificacion, QR code con link de producto |
| 4 | Generacion async | Inngest job: generar PDF en background, guardar en Storage |
| 5 | Envio por email | Resend: email branded con PDF adjunto, template React Email |

#### Semana 10
| # | Tarea | Detalles |
|---|-------|---------|
| 6 | Historial de reportes | Dashboard B2B: lista de reportes generados, reenviar, descargar |
| 7 | Link directo por tenant | URL unica: skinner.com.br/analise/[tenant-slug] |
| 8 | Generador de QR | Portal B2B: generar QR code que apunta al link directo |
| 9 | Landing B2C | Pagina de bienvenida branded del tenant → iniciar analisis |
| 10 | Consentimiento LGPD | Banner pre-analisis: consentimiento explicito, link a politica |

**Entregable Sprint 4**: Flujo completo B2C → analisis → PDF branded → envio por email. Links y QR funcionando.

---

### SPRINT 5 — Billing + Comisiones (Semana 11)

**Objetivo**: Monetizacion completa: suscripciones, creditos, comisiones.

| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Stripe Billing setup | Productos y precios: Starter, Growth, Enterprise |
| 2 | Checkout flow | Stripe Payment Links para Starter/Growth, self-service |
| 3 | Metered usage | Conteo de analisis por tenant, cobro de excedentes |
| 4 | Creditos dashboard | B2B ve: analisis usadas/restantes, alertas de limite |
| 5 | Pixel de comision | Script JS liviano (<10 lineas) para instalar en checkout B2B |
| 6 | Tracking de conversiones | Registro: click en producto → compra confirmada via pixel |
| 7 | Calculo de comision | BCE: % segun plan x valor venta, registro en usage_events |
| 8 | Customer Portal Stripe | B2B gestiona pagos, facturas, upgrade/downgrade autonomamente |
| 9 | Webhooks Stripe | invoice.paid, payment_failed, subscription.deleted |
| 10 | Portal Admin - Billing | Vision de facturas, MRR, disputas, creditos manuales |

**Entregable Sprint 5**: B2B se suscribe, usa creditos, comisiones se rastrean automaticamente.

---

### SPRINT 6 — Site Marketing + QA + Launch (Semana 12)

**Objetivo**: Site publico, demo interactiva, QA final, lanzamiento.

| # | Tarea | Detalles |
|---|-------|---------|
| 1 | Home page | Hero, propuesta de valor, demo animado placeholder, CTA |
| 2 | Pagina de planos | Tabla comparativa, CTAs a checkout Stripe |
| 3 | Como funciona | Diagrama visual del flujo, screenshots del producto |
| 4 | Paginas verticales | /laboratorios, /clinicas, /farmacias — contenido SEO |
| 5 | Demo interactiva | /demo: analisis facial publica sin tenant configurado (branding Skinner) |
| 6 | Legal | /privacidade, /termos — templates LGPD (pendiente revision legal) |
| 7 | SEO tecnico | sitemap.xml, robots.txt, Open Graph, Schema.org |
| 8 | Formulario de lead | Nombre, email, empresa, segmento → almacenar en DB (HubSpot en Fase 1) |
| 9 | Cookie consent | Banner LGPD con opt-in/out granular |
| 10 | QA E2E | Tests criticos: flujo analisis, billing, multi-tenant isolation |
| 11 | Security review | Headers CSP/HSTS, validacion inputs, RLS audit |
| 12 | Onboarding primer B2B | Setup real con primer cliente, feedback loop |

**Entregable Sprint 6**: Plataforma live, site marketing publicado, demo funcional, primer B2B onboardeado.

---

## Diagrama de Dependencias

```
Sprint 0 (Fundacion)
    │
    ├──→ Sprint 1 (Auth + Portales)
    │        │
    │        ├──→ Sprint 2 (Catalogo)
    │        │        │
    │        │        └──→ Sprint 3 (SAE - Analisis) ★ CRITICO
    │        │                 │
    │        │                 └──→ Sprint 4 (PDF + Canales)
    │        │                          │
    │        │                          └──→ Sprint 6 (Marketing + Launch)
    │        │
    │        └──→ Sprint 5 (Billing) [parallelizable con Sprint 4]
    │                 │
    │                 └──→ Sprint 6 (Marketing + Launch)
```

**Nota**: Sprint 5 (Billing) puede desarrollarse en paralelo con Sprint 4 si hay mas de un desarrollador.

---

## Riesgos Tecnicos y Mitigaciones

| Riesgo | Mitigacion |
|--------|-----------|
| Prompt Claude no retorna JSON consistente | Usar structured output con Zod schema, retry con fallback, tests de regresion de prompts |
| Latencia SAE > 15s | Cache Redis de analisis similares, optimizar prompt size, streaming de resultados parciales |
| Fotos de baja calidad frecuentes | UI con guia visual clara (overlay de ovalo), validacion pre-envio, re-take automatico |
| Base dermatologica incompleta | Lanzar con 15-20 condiciones core, iterar con feedback de B2Bs y profesionales |
| RLS mal configurado (data leak) | Tests automatizados de aislamiento, audit en cada sprint |
| Costos Claude API altos | Monitoring de uso, cache agresivo, alertas de budget, optimizacion de tokens |

---

## Items Bloqueantes (Pendientes del Usuario)

Estos items de la seccion 13 del PRD necesitan respuesta antes de las semanas indicadas:

| # | Decision | Impacta Sprint | Deadline |
|---|----------|---------------|----------|
| 1 | Dominio final | Sprint 0 (deploy) | Semana 1 |
| 2 | Identidad visual (logo, colores) | Sprint 1 (portales) | Semana 2 |
| 3 | Disclaimer medico | Sprint 4 (PDF, B2C) | Semana 8 |
| 4 | Politica de fotos (descartar vs opt-in) | Sprint 3 (SAE) | Semana 6 |
| 5 | Primer cliente B2B target | Sprint 6 (onboarding) | Semana 10 |

---

## Post-MVP: Fase 1 (Meses 4-6)

- App mobile (Expo React Native)
- Widget embed JS para sitios B2B
- Integracion HubSpot/Salesforce
- WhatsApp Business API (Twilio)
- Tablet kiosk mode (PWA)
- Analytics avanzado con funnel de conversion

## Post-MVP: Fase 2 (Meses 7-12)

- Plugin Shopify + WooCommerce
- API publica (plan Enterprise)
- Analisis longitudinal (comparacion temporal)
- i18n: espanol (LATAM expansion)
- Skinner Score (indice propietario de salud de piel)
- Teleconsulta integrada
