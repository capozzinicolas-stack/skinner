# Analisis de Brechas de Funcionalidad - Skinner MVP

**Fecha**: 2026-04-05
**Autor**: Product Manager
**Veredicto**: El producto NO esta listo para produccion. El motor de analisis funciona con datos simulados, no hay integracion real con Claude AI, Stripe, Resend ni Redis. La estructura esta bien disenada pero el nucleo del valor del producto es un mock.

---

## 1. Verificacion de Completitud del MVP (Roadmap vs Realidad)

### Sprint 0 - Fundacion: ~80% completado
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Monorepo Turborepo | HECHO | pnpm workspaces, packages/db, packages/ui, packages/config |
| Next.js 14 App Router | HECHO | Layout groups (marketing, auth, admin, dashboard, analysis) |
| Prisma schema | HECHO | Modelo completo: tenants, users, products, analyses, billing, dermatologia |
| Auth | PARCIAL | NextAuth implementado, roles funcionan, PERO se planeo Supabase Auth y se uso NextAuth |
| CI/CD Vercel | SIN VERIFICAR | No hay evidencia de configuracion en el codigo |
| Design system | HECHO | Tailwind + shadcn/ui, tokens de color propios (carbone, pierre, sable, etc.) |
| tRPC setup | HECHO | Router con context, middleware auth |
| Sentry + PostHog | NO HECHO | Cero integracion. Ni un import. Ni un wrapper de error. NADA. |
| Upstash Redis | NO HECHO | Cero rate limiting. Cero cache. La API esta completamente abierta. |
| React Email / Resend | NO HECHO | Ni el package emails/ existe. El package planificado nunca se creo. |
| Seed script | SIN VERIFICAR | No encontrado en el analisis |

### Sprint 1 - Auth Multi-tenant + Portales: ~75% completado
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Modelo de roles | HECHO | skinner_admin, b2b_admin, b2b_analyst, b2b_viewer |
| Middleware multi-tenant | PARCIAL | Valida rol y tenantId, pero NO resuelve tenant por subdominio |
| Portal Admin - Layout | HECHO | Sidebar con Dashboard, Tenants, Dermatologia |
| CRUD Tenants | HECHO | Crear, pausar, activar. Falta: editar detalles completos, eliminar |
| Config de planes | PARCIAL | Se asigna plan al crear, pero no hay edicion de limites individuales |
| Portal B2B - Auth | HECHO | Login funciona, creacion de usuarios del tenant |
| Portal B2B - Layout | HECHO | Sidebar con 7 secciones navegables |
| Config de marca B2B | HECHO | Logo URL, colores, brand voice, disclaimer con preview |
| Gestion de usuarios B2B | HECHO | CRUD basico, asignacion de roles |
| Admin - Dashboard basico | HECHO | Metricas: tenants activos, total, analisis, usuarios |

### Sprint 2 - Catalogo de Productos: ~70% completado
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Schema productos | HECHO | Modelo completo con tags, severity, step routine |
| CRUD productos | HECHO | Crear, editar, desactivar/reactivar |
| Sistema de tags | HECHO | concernTags, skinTypeTags, objectiveTags como JSON |
| Mapeamento producto-condicion | HECHO | Tag selector visual en formulario |
| Upload de imagenes | NO HECHO | Solo acepta URL. No hay upload a Supabase Storage. |
| Upload masivo CSV | HECHO | Parser CSV con validacion y preview |
| Validacion de catalogo | PARCIAL | Stats de cobertura por condicion, pero no hay alertas de productos sin tags |
| Busqueda y filtros | HECHO | Por nombre, condicion, etapa, activos/inactivos |
| Versionamiento | NO HECHO | Sin historial de cambios ni rollback |
| Base dermatologica v1 | PARCIAL | CRUD funciona, pero la base esta VACIA. No hay datos pre-cargados. |

### Sprint 3 - Motor de Analisis SAE: ~40% completado (CRITICO)
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Cuestionario adaptativo | PARCIAL | Existe pero no revisado en profundidad; 7 preguntas fijas, sin logica condicional |
| Captura de foto | PARCIAL | Componente PhotoCapture existe, pero no hay overlay de guia facial |
| Validacion de foto (Claude) | NO HECHO | La foto se envia pero NUNCA SE VALIDA. No hay check de calidad. |
| Prompt de analisis | NO HECHO | Usa mockAnalyze() que retorna datos hardcoded basados en el cuestionario |
| Pipeline SAE core | NO HECHO | El pipeline completo es un MOCK. No hay llamada real a Claude API. |
| Scoring engine | PARCIAL | Mock retorna scores fijos, no hay scoring real basado en vision IA |
| Matching engine | HECHO | matcher.ts funciona bien: scoring por concern, skin type, objective, severity |
| UI de resultados | HECHO | Pantalla completa: tipo piel, condiciones, plan de accion, productos |
| Inyeccion de contexto tenant | NO HECHO | No se inyecta brand_voice ni restricted_conditions al prompt |
| Loading UX | HECHO | LoadingScreen con mensajes educativos |
| Cache de analisis | NO HECHO | Sin Redis, sin cache |

### Sprint 4 - Reportes PDF + Canales: ~60% completado
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Template PDF base | HECHO | report-template.tsx con React PDF |
| Branding dinamico | PARCIAL | Nombre del tenant, pero no se inyectan colores ni logo en PDF |
| Productos en PDF | HECHO | Productos recomendados en el PDF |
| Generacion async | NO HECHO | Se genera sincronamente en el request. Sin Inngest, sin jobs en background |
| Envio por email | NO HECHO | El boton "Enviar" en ResultsScreen solo cambia un estado local, NO envia nada |
| Historial de reportes | HECHO | Tabla de analisis con fecha, cliente, tipo piel, condiciones, latencia |
| Link directo por tenant | HECHO | /analise/[slug] funciona |
| Generador de QR | HECHO | Usa API externa qrserver.com |
| Landing B2C | HECHO | Welcome screen branded con logo del tenant |
| Consentimiento LGPD | PARCIAL | Pantalla de consentimiento existe, pero sin checkbox explicito ni registro |

### Sprint 5 - Billing + Comisiones: ~25% completado
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Stripe Billing setup | NO HECHO | stripe-mock.ts con TODOs. Funcion isStripeConfigured() siempre false en dev. |
| Checkout flow | NO HECHO | createCheckoutUrl() retorna redirect mock |
| Metered usage | PARCIAL | Conteo de analysisUsed funciona, pero no reporta a Stripe |
| Creditos dashboard | HECHO | B2B ve creditos usados/restantes y barra de progreso |
| Pixel de comision | HECHO | /api/pixel funciona para POST y GET, registra conversiones |
| Tracking de conversiones | HECHO | Conversion model funciona, se registran clicks y purchases |
| Calculo de comision | HECHO | calculateMonthlyBill() funciona localmente |
| Customer Portal Stripe | NO HECHO | createPortalUrl() retorna URL local |
| Webhooks Stripe | NO HECHO | No existe endpoint /api/billing/webhook |
| Portal Admin - Billing | NO HECHO | Admin no puede ver facturas, MRR, disputas |

### Sprint 6 - Marketing + QA + Launch: ~50% completado
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Home page | SIN VERIFICAR | No encontrada en el analisis (puede existir como page.tsx raiz) |
| Pagina de planos | HECHO | /planos existe |
| Como funciona | HECHO | /como-funciona existe |
| Paginas verticales | HECHO | /laboratorios, /clinicas, /farmacias existen |
| Demo interactiva | HECHO | /demo existe |
| Legal | HECHO | /privacidade y /termos existen |
| SEO tecnico | SIN VERIFICAR | No hay evidencia de sitemap.xml, robots.txt |
| Formulario de lead | HECHO | /contato + /api/leads funciona |
| Cookie consent | NO HECHO | No hay banner de cookies |
| QA E2E | NO HECHO | CERO tests. Ni unitarios, ni integracion, ni E2E. |
| Security review | NO HECHO | Sin headers CSP/HSTS, sin audit de RLS |
| Onboarding primer B2B | NO APLICA | Aun no hay producto listo |

---

## 2. Brechas Criticas - Portal B2B

### Lo que el cliente B2B NO PUEDE hacer hoy:

1. **Recibir analisis reales de piel** - El motor es un mock que ignora la foto y retorna datos fijos basados en el cuestionario. Esto es el NUCLEO del producto y no funciona.

2. **Subir imagenes de productos** - Solo puede pegar URLs. No hay upload nativo. Para un cliente no tecnico, esto es un bloqueador.

3. **Recibir reportes por email** - El boton "Enviar" en la pantalla de resultados es un placeholder que cambia estado local. No se envia nada. El cliente B2C nunca recibe su PDF.

4. **Ver metricas de conversion** - El dashboard muestra un numero total pero no hay graficos, tendencias, funnel de conversion, ni periodo seleccionable.

5. **Gestionar su facturacion real** - Todo el billing es mock. No puede suscribirse, pagar, ver facturas, ni cambiar de plan con cobro real.

6. **Invitar usuarios por email** - La creacion de usuarios requiere definir password manualmente. No hay flujo de invitacion por email con link de setup.

7. **Ver detalle de una analisis individual** - La tabla de reportes no tiene vista de detalle. Solo puede descargar el PDF.

8. **Exportar datos** - No puede exportar reportes, lista de analisis, ni metricas en CSV/Excel.

9. **Recibir alertas de limites** - No hay notificaciones cuando se acercan al limite de creditos (80%, 100%).

10. **Personalizar el cuestionario** - TenantConfig tiene maxQuestions y restrictedConditions pero no hay UI para configurarlos.

---

## 3. Brechas Criticas - Portal Admin

### Lo que el equipo Skinner NO PUEDE hacer hoy:

1. **Ver billing global** - No hay vista de MRR, facturas, disputas, revenue por tenant.

2. **Editar un tenant en profundidad** - Solo puede crear con nombre/slug/plan y cambiar status. No puede editar limites, comisiones, configuracion de analisis.

3. **Gestionar la base dermatologica eficazmente** - CRUD funciona pero no hay: importacion masiva, relaciones entre condiciones e ingredientes, datos pre-cargados.

4. **Monitorear la salud de la plataforma** - Sin Sentry, sin PostHog, sin metricas de latencia, sin dashboard de errores.

5. **Ver analisis cross-tenant** - No puede auditar analisis de todos los tenants, ver distribuciones de condiciones, o detectar patrones.

6. **Gestionar leads** - Los leads se guardan en la base de datos pero no hay UI para verlos ni exportarlos. No hay integracion con CRM.

7. **Crear usuarios admin** - No hay forma desde la UI de crear otro usuario skinner_admin.

8. **Auditar seguridad multi-tenant** - No hay logs de acceso ni herramientas para verificar aislamiento de datos.

---

## 4. Brechas del Flujo B2C

1. **Analisis falso** - La foto que el usuario sube es IGNORADA. El analisis se basa unicamente en las respuestas del cuestionario. Esto es fundamentalmente deshonesto.

2. **Email no se envia** - El usuario ingresa su email para recibir el reporte y no recibe nada. Expectativa rota.

3. **Sin consentimiento registrado** - El usuario acepta el consentimiento LGPD pero esto no se registra en la base de datos. En caso de auditoria, no hay evidencia de consentimiento.

4. **Foto no se valida** - No hay feedback si la foto es oscura, borrosa, sin rostro, o inapropiada.

5. **Sin compartir resultados** - No puede compartir sus resultados en redes sociales o generar un link permanente.

6. **Sin rehacer analisis** - Despues de ver resultados, el unico flujo es descargar PDF. No puede reiniciar el analisis.

---

## 5. Brechas de Integracion

| Integracion Planificada | Estado | Impacto |
|------------------------|--------|---------|
| Claude API (Anthropic) | NO INTEGRADO | El producto entero es un mock sin esto |
| Stripe Billing | NO INTEGRADO | No se puede cobrar. Cero revenue. |
| Resend (email) | NO INTEGRADO | No se envian emails. Ni reportes, ni invitaciones, ni alertas. |
| Upstash Redis | NO INTEGRADO | Sin rate limiting, sin cache, API abierta al abuso. |
| Supabase Storage | NO INTEGRADO | Sin upload de imagenes (productos ni fotos de analisis). |
| Supabase Auth | REEMPLAZADO | Se uso NextAuth en vez de Supabase Auth. Decision valida pero diverge del plan. |
| Inngest (background jobs) | NO INTEGRADO | PDF se genera sincronamente. No hay jobs async. |
| PostHog (analytics) | NO INTEGRADO | Cero analytics de producto. |
| Sentry (errores) | NO INTEGRADO | Cero monitoreo de errores. |
| HubSpot / Salesforce CRM | NO INTEGRADO | Planificado para Fase 1, aceptable que no este. |
| WhatsApp Business | NO INTEGRADO | Planificado para Fase 1, aceptable. |

---

## 6. Brechas de Seguridad y Compliance

### LGPD (Lei Geral de Protecao de Dados)
- **CRITICO**: El consentimiento del usuario no se registra en la base de datos. Solo existe como paso visual en la UI.
- **CRITICO**: No hay mecanismo para que el usuario solicite eliminacion de sus datos (derecho al olvido).
- **CRITICO**: No hay politica de retencion de datos implementada. pdfRetentionDays existe en el schema pero no hay cron job que limpie datos viejos.
- **MEDIO**: Cookie consent banner no existe.
- **MEDIO**: No hay registro de cuando se procesaron fotos ni confirmacion de su eliminacion.

### Autenticacion y Autorizacion
- **CRITICO**: La password se almacena como campo "password" en el schema. Necesita confirmacion de que se usa bcrypt/argon2 en el server.
- **CRITICO**: No hay rate limiting en login. Vulnerable a brute force.
- **CRITICO**: No hay rate limiting en /api/pixel. Cualquiera puede inflar metricas de conversion.
- **CRITICO**: El endpoint de analisis es publico (publicProcedure). Cualquiera puede generar analisis y consumir creditos de un tenant.
- **MEDIO**: No hay 2FA para usuarios admin.
- **MEDIO**: No hay expiracion de sesion configurable.

### Aislamiento Multi-tenant
- **CRITICO**: No hay RLS (Row Level Security) en Supabase. El plan era usar RLS nativo, pero se usa Prisma directo. El aislamiento depende 100% de que el codigo filtre por tenantId correctamente.
- **MEDIO**: No hay tests automatizados de aislamiento.

### Headers de Seguridad
- **CRITICO**: No hay headers CSP, HSTS, X-Frame-Options, X-Content-Type-Options configurados.

---

## 7. Brechas Operacionales

### Logging y Monitoreo
- Sin Sentry = errores en produccion son invisibles
- Sin PostHog = no sabemos si alguien usa el producto
- Sin metricas de latencia de Claude API (cuando se integre)
- Sin alertas de limites de creditos por tenant
- Solo console.error() para errores en API routes

### Error Handling
- Errores genericos en API routes: catch generico con "Erro interno" / "Erro ao gerar relatorio"
- No hay retry logic para llamadas externas (Claude, email)
- No hay circuit breaker para API de Claude

### Rate Limiting
- NINGUNO. La API esta completamente abierta.
- /api/pixel sin rate limit = metricas falseables
- /api/leads sin rate limit = spam
- Endpoint de analisis sin rate limit = consumo de creditos abusivo

### Background Jobs
- PDF se genera sincronamente = timeout en Vercel si el PDF es grande
- No hay job para limpieza de datos viejos (LGPD)
- No hay job para reseteo mensual de creditos
- No hay job para envio de emails de reporte

### Testing
- CERO tests en todo el proyecto
- No hay tests unitarios
- No hay tests de integracion
- No hay tests E2E
- No hay tests de aislamiento multi-tenant

---

## 8. Backlog Priorizado

### P0 - Debe resolverse ANTES del primer cliente

| # | Item | Justificacion | Esfuerzo |
|---|------|--------------|----------|
| 1 | Integrar Claude API real | El producto es literalmente un mock sin esto. El analisis de piel es la propuesta de valor central. | XL |
| 2 | Validacion de foto con Claude | Usuarios van a subir fotos de gatos, selfies oscuras, screenshots. Sin validacion = resultados basura. | M |
| 3 | Rate limiting con Upstash | La API esta completamente abierta. Un script puede consumir todos los creditos de un tenant en segundos. | M |
| 4 | Proteger endpoint de analisis | Es publicProcedure. Necesita al menos validacion de que el tenant esta activo y tiene creditos, mas rate limit por IP. | S |
| 5 | Integrar Resend para emails | El flujo de "enviar reporte por email" es la promesa central al usuario final. Hoy no envia nada. | M |
| 6 | Registrar consentimiento LGPD | Sin esto, el producto es ilegal en Brasil. Registrar fecha, IP, version del consentimiento en la base de datos. | S |
| 7 | Headers de seguridad basicos | CSP, HSTS, X-Frame-Options. Configuracion de Next.js en next.config.js. | S |
| 8 | Hash de password verificado | Confirmar que bcrypt/argon2 se usa. Si no, implementar. | S |
| 9 | Poblar base dermatologica | La base esta VACIA. Sin 15-20 condiciones y ingredientes pre-cargados, el motor no tiene conocimiento para dar buenas recomendaciones. | L |
| 10 | Tests minimos criticos | Al menos: flujo de analisis E2E, aislamiento multi-tenant, creacion de tenant + usuario + producto. | L |

### P1 - Debe resolverse en el PRIMER MES

| # | Item | Justificacion | Esfuerzo |
|---|------|--------------|----------|
| 11 | Integrar Stripe Billing | Sin esto no hay revenue. El producto es gratis indefinidamente. | XL |
| 12 | Webhooks Stripe | invoice.paid, payment_failed, subscription.deleted. Sin esto el estado de suscripcion se desincroniza. | L |
| 13 | Upload de imagenes de productos | Integracion con Supabase Storage o Uploadthing. Los clientes no tecnico no tienen URLs de imagenes. | M |
| 14 | Sentry para monitoreo de errores | Un dia de integracion que previene semanas de debugging a ciegas. | S |
| 15 | Generacion async de PDF con Inngest | Timeout de Vercel es 10s en hobby, 30s en pro. PDFs grandes van a fallar. | M |
| 16 | Dashboard B2B con graficos | El cliente paga por insights. 4 numeros en tarjetas no es suficiente. Tendencias, periodo seleccionable, funnel. | L |
| 17 | Invitacion de usuarios por email | Hoy se crea usuario con password manual. Necesita flujo de invitacion con link. | M |
| 18 | PostHog para analytics de producto | Necesitamos saber si los usuarios completan el flujo, donde abandonan, cuanto tiempo toman. | S |
| 19 | Branding completo en PDF | El PDF no usa los colores ni logo del tenant. Es el entregable que el cliente final recibe; tiene que ser branded. | M |
| 20 | Cookie consent banner | Requisito LGPD para el sitio de marketing. | S |

### P2 - Nice-to-have para crecimiento

| # | Item | Justificacion | Esfuerzo |
|---|------|--------------|----------|
| 21 | Edicion avanzada de tenants (admin) | Editar limites, comision, configuracion de analisis desde el admin. | M |
| 22 | Vista de leads en admin | Los leads se guardan pero nadie los puede ver ni exportar. | S |
| 23 | Exportacion de datos B2B (CSV) | Reportes, analisis, productos. Tabla stakes para B2B SaaS. | M |
| 24 | Alertas de limites de creditos | Notificar al tenant cuando llega a 80% y 100% de uso. | S |
| 25 | Derecho al olvido (LGPD) | Endpoint para que el usuario solicite eliminacion de sus datos. | M |
| 26 | Cache de analisis similares | Redis cache para reducir costos de Claude en analisis similares. | L |
| 27 | Config de cuestionario por tenant | UI para que el B2B configure maxQuestions, restrictedConditions. | M |
| 28 | Vista de detalle de analisis | Desde la tabla de reportes, poder ver el detalle completo sin descargar PDF. | M |
| 29 | Versionamiento de productos | Historial de cambios con rollback. | L |
| 30 | Resolucion de tenant por subdominio | clinica.skinner.com.br en vez de solo slug en la URL. | M |

### P3 - Consideracion futura

| # | Item | Justificacion | Esfuerzo |
|---|------|--------------|----------|
| 31 | Widget embed JS para B2Bs | Package pixel/ planificado pero no creado. | XL |
| 32 | Integracion HubSpot/Salesforce | Campos ya existen en TenantConfig pero sin logica. | L |
| 33 | WhatsApp Business API | Envio de reportes por WhatsApp. | L |
| 34 | App mobile (Expo) | Fase 1 del roadmap post-MVP. | XL |
| 35 | Tablet kiosk mode (PWA) | Para clinicas y farmacias. | L |
| 36 | API publica (plan Enterprise) | Sin package api/ creado. | XL |
| 37 | 2FA para admins | Seguridad adicional para cuentas con acceso privilegiado. | M |
| 38 | Analisis longitudinal | Comparacion temporal entre analisis del mismo usuario. | XL |
| 39 | i18n (espanol para LATAM) | Expansion regional. | L |
| 40 | Plugin Shopify / WooCommerce | Integracion e-commerce directa. | XL |

---

## Resumen Ejecutivo

### Lo que esta BIEN construido:
- Arquitectura multi-tenant solida (schema, middleware, layout groups)
- Flujo B2C completo de punta a punta (welcome -> consent -> questionnaire -> photo -> loading -> results)
- Catalogo de productos robusto con CRUD, import CSV, filtros, tags
- Motor de matching de productos bien disenado (matcher.ts)
- UI/UX elegante y consistente con design system propio
- Pixel de tracking de comisiones funcional

### Lo que esta CRITICAMENTE incompleto:
1. **El motor de IA es un mock** - El producto promete analisis de piel por IA. Hoy retorna datos fijos del cuestionario ignorando la foto. Esto invalida toda la propuesta de valor.
2. **Cero integraciones externas** - Claude, Stripe, Resend, Redis, Sentry, PostHog: ninguna esta conectada.
3. **Cero tests** - Un solo cambio puede romper el aislamiento multi-tenant y nadie lo sabria.
4. **Seguridad insuficiente** - Sin rate limiting, sin headers, endpoint critico publico.
5. **LGPD incumplida** - Consentimiento no registrado, sin derecho al olvido, sin cookie consent.

### Estimacion para estar listo para primer cliente:
- **Items P0**: 4-6 semanas con 1 desarrollador full-time
- **Items P0 + P1 criticos (11-15)**: 8-10 semanas adicionales
- **Total estimado a produccion con primer cliente**: 3-4 meses

La estructura es buena. Los cimientos estan ahi. Pero el edificio todavia no tiene electricidad, plomeria ni cerraduras en las puertas.
