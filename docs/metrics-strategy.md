# Estrategia de Metricas y Analytics — Skinner

**Fecha:** Abril 2026  
**Plataforma:** Skinner — B2B SaaS de Analisis de Piel con IA  
**Audiencias:** Equipo de Producto, Tenants B2B, Equipo Interno Skinner

---

## 1. Brechas Actuales — Que Existe Pero No Se Esta Mostrando

### 1.1 Dashboard del Tenant (`/dashboard`)

El dashboard actual (`dashboard.ts` + `dashboard/page.tsx`) expone solamente **4 numeros planos** sin contexto temporal ni tendencia:

| Lo que existe en el schema | Lo que se muestra hoy | Brecha |
|---|---|---|
| `Analysis.createdAt`, `startedAt`, `completedAt` | Solo conteo total | Sin series de tiempo, sin tendencia diaria/semanal |
| `Analysis.status` (pending, processing, completed, failed) | Solo analisis completados | Tasa de fallo y analisis en progreso invisibles |
| `Analysis.skinType`, `conditions`, `fitzpatrick`, `clientAge` | No se muestra nada | Perfil demografico del cliente final completamente oculto |
| `Recommendation.clickedAt` | No se muestra | CTR de productos es calculable pero no se presenta |
| `Recommendation.matchScore` | No se muestra | Calidad de las recomendaciones es invisible |
| `Conversion.type`, `saleValue`, `commission` | Solo conteo de compras (sin valor $) | Revenue atribuido a Skinner no se muestra al tenant |
| `Analysis.latencyMs` | No se muestra | El tenant no sabe si el SAE esta lento |
| `Report.channel`, `sentAt` | No se muestra | Cuantos reportes se enviaron por email vs WhatsApp es invisible |
| `UsageEvent` (history completo) | Solo creditos restantes | Consumo dia a dia, pico de uso, proyeccion de agotamiento no se calculan |
| `Product.concernTags`, `skinTypeTags` | No se muestra | Que tipo de piel domina en su base de clientes no se cruza con su catalogo |

### 1.2 Dashboard Admin (`/admin`)

El admin dashboard (`tenant.ts > stats` + `admin/page.tsx`) expone **4 numeros planos** de toda la plataforma:

| Lo que existe | Lo que se muestra | Brecha |
|---|---|---|
| `Subscription.status`, `currentPeriodEnd` | No se muestra | Suscripciones en riesgo de cancelacion invisibles |
| `Tenant.plan` distribucion | Solo MRR total en `billing.ts > adminOverview` | No se visualiza en el admin UI |
| `Analysis.latencyMs` en toda la plataforma | No se muestra | Salud del SAE (latencia p50/p95/p99) no esta en pantalla |
| `Tenant.analysisUsed / analysisLimit` | No se computa ratio | Tenants cerca del limite (riesgo de fricccion) no se identifican |
| `Conversion` totales y saleValue | No se muestra | Valor economico generado por la plataforma en su totalidad es invisible |
| `Lead` table completa | No se muestra en admin | Pipeline de ventas no esta integrado al dashboard |
| Analisis fallidos (`status = "failed"`) | No se muestra | Error rate del SAE no se monitorea visualmente |

### 1.3 Router de Reportes (`report.ts`)

- Solo devuelve los ultimos 100 analisis completados con un `take: 100` fijo, sin paginacion.
- No agrega ni calcula nada: no hay distribucion de `skinType`, ni conteo de condiciones, ni promedio de `matchScore`.
- `Recommendation.clickedAt` se guarda en el schema pero el router de reportes no lo selecciona ni expone.
- `Conversion.saleValue` no se agrega por producto para mostrar revenue atribuido.

### 1.4 Billing (`billing.ts`)

- `adminOverview` calcula `totalMRR` correctamente desde `PLANS[plan].monthlyPrice`, pero no lo muestra en el UI de admin.
- No existe calculo de churn: tenants con `subscription.status = "canceled"` o `tenant.status = "paused"` no se contabilizan como churn.
- No hay expansion revenue: cambios de plan de starter a growth no se rastrean historicamente (no hay tabla de cambios de plan).
- `UsageEvent` tiene `type: "excess_analysis"` y `type: "commission"` pero `usageHistory` solo lista los eventos sin sumarlos por tipo o por periodo.

---

## 2. KPIs del Dashboard B2B (Vision del Tenant)

Este es el conjunto de metricas que cada tenant debe ver **diariamente** para entender el valor que Skinner genera para su negocio.

### 2.1 Embudo de Conversion (Funnel)

**Concepto:** Cada analisis inicia un micro-embudo que termina (o no) en una venta atribuida a Skinner.

```
Analisis Iniciado
      |
      v
Analisis Completado  (tasa de completitud)
      |
      v
Reporte Enviado/Descargado  (tasa de entrega)
      |
      v
Click en Producto  (CTR del recomendador)
      |
      v
Compra Confirmada  (tasa de conversion final)
```

**Calculo de cada etapa:**

| Etapa | Formula SQL/Prisma | Fuente |
|---|---|---|
| Iniciados | `COUNT(analyses WHERE tenantId = X)` | `Analysis` |
| Completados | `COUNT(analyses WHERE status = 'completed')` | `Analysis.status` |
| Reportes entregados | `COUNT(reports WHERE sentAt IS NOT NULL)` | `Report.sentAt` |
| Clicks | `COUNT(recommendations WHERE clickedAt IS NOT NULL)` | `Recommendation.clickedAt` |
| Compras | `COUNT(conversions WHERE type = 'purchase')` | `Conversion.type` |

**Tasa de completitud:** `completados / iniciados * 100`  
**CTR del recomendador:** `clicks / completados * 100`  
**Tasa de conversion final:** `compras / completados * 100`  
**Revenue atribuido:** `SUM(conversions.saleValue WHERE type = 'purchase')`  
**Comision generada para Skinner:** `SUM(conversions.commission)`

**Donde mostrar:** Bloque superior del dashboard, grafico de embudo tipo funnel (Sankey simplificado o funnel vertical con barras decrecientes), con el porcentaje de caida entre cada etapa en rojo si cae mas del 20% de la etapa anterior.

**Frecuencia de actualizacion:** Tiempo real (query al cargar la pagina, con cache de 5 minutos).

---

### 2.2 Revenue Atribuido por Producto

**Concepto:** Cual de los productos del catalogo del tenant genera mas ventas gracias a las recomendaciones de Skinner.

**Calculo:**
```sql
SELECT
  p.name,
  p.sku,
  COUNT(DISTINCT r.id) AS veces_recomendado,
  COUNT(DISTINCT r.id) FILTER (WHERE r.clickedAt IS NOT NULL) AS clicks,
  COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'purchase') AS compras,
  SUM(c.saleValue) FILTER (WHERE c.type = 'purchase') AS revenue_atribuido,
  (COUNT(DISTINCT r.id) FILTER (WHERE r.clickedAt IS NOT NULL)) / 
    NULLIF(COUNT(DISTINCT r.id), 0) * 100 AS ctr_pct,
  (COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'purchase')) /
    NULLIF(COUNT(DISTINCT r.id), 0) * 100 AS conv_rate_pct
FROM recommendations r
JOIN products p ON r.productId = p.id
LEFT JOIN conversions c ON c.recommendationId = r.id
WHERE p.tenantId = :tenantId
GROUP BY p.id, p.name, p.sku
ORDER BY revenue_atribuido DESC
```

**Metricas por producto:**
- **Veces recomendado:** cuantas veces el SAE incluyo este producto en una rutina
- **CTR:** `clicks / veces_recomendado` — si es bajo, el producto puede tener problema de precio o presentacion
- **Tasa de conversion:** `compras / veces_recomendado` — indica la calidad del match entre producto y cliente
- **Revenue total atribuido:** suma de `saleValue` de todas las conversiones
- **Ticket promedio:** `revenue_atribuido / compras`
- **Match Score promedio:** `AVG(recommendations.matchScore)` — indica si el SAE considera este producto un buen fit

**Donde mostrar:** Tabla ordenable en la pestana "Productos" del dashboard, con columnas para cada metrica. Complementar con un grafico de barras horizontales mostrando top-10 productos por revenue atribuido.

---

### 2.3 Perfil Demografico del Cliente Final

**Concepto:** El tenant debe entender a quien le esta vendiendo para ajustar su catalogo, comunicacion y estrategia.

**Metricas de distribucion:**

**Tipo de piel (`Analysis.skinType`):**
```
Calculo: COUNT(analyses) GROUP BY skinType WHERE tenantId = X AND status = 'completed'
Resultado esperado: { oily: 35%, combination: 28%, dry: 20%, normal: 12%, sensitive: 5% }
```

**Condiciones mas frecuentes (`Analysis.conditions` — JSON array):**
```
Requiere unnest del campo JSON conditions para agregar por nombre de condicion.
Calculo: Para cada analysis completado, parsear el array conditions y contar frecuencia de cada nombre.
Resultado esperado: { acne: 42%, hyperpigmentation: 31%, aging: 27%, sensitivity: 18% }
```

**Rangos de edad (`Analysis.clientAge`):**
```
Calculo: COUNT(analyses) GROUP BY clientAge WHERE tenantId = X AND clientAge IS NOT NULL
Valores del schema: age_range del cuestionario (ej: '18-24', '25-34', '35-44', '45-54', '55+')
```

**Objetivo primario mas frecuente (`Analysis.primaryObjective`):**
```
Calculo: COUNT(analyses) GROUP BY primaryObjective WHERE tenantId = X AND status = 'completed'
```

**Fitzpatrick mas frecuente (`Analysis.fitzpatrick`):**
```
Calculo: COUNT(analyses) GROUP BY fitzpatrick WHERE tenantId = X AND status = 'completed'
Util para laboratorios con productos segmentados por fototipo
```

**Donde mostrar:** Seccion "Conoce a tu Cliente" con graficos de dona (pie/doughnut) para tipo de piel, edad y objetivo primario. Grafico de barras horizontales para condiciones mas frecuentes. Estos graficos son estaticos (no cambian en tiempo real) y se pueden actualizar 1 vez por dia.

---

### 2.4 Tendencias Temporales

**Concepto:** El tenant necesita ver si su volumen de analisis esta creciendo o cayendo, y si la tasa de conversion mejora con el tiempo.

**Series de tiempo a calcular:**

**Analisis por dia/semana/mes:**
```sql
SELECT
  DATE_TRUNC('day', createdAt) AS periodo,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'completed') AS completados,
  COUNT(*) FILTER (WHERE status = 'failed') AS fallidos
FROM analyses
WHERE tenantId = :tenantId
  AND createdAt >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', createdAt)
ORDER BY periodo ASC
```

**Tasa de conversion semanal:**
```sql
SELECT
  DATE_TRUNC('week', a.createdAt) AS semana,
  COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'purchase') AS compras,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS analisis_completados,
  (COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'purchase'))::float /
    NULLIF(COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed'), 0) * 100 AS tasa_conversion
FROM analyses a
LEFT JOIN recommendations r ON r.analysisId = a.id
LEFT JOIN conversions c ON c.recommendationId = r.id
WHERE a.tenantId = :tenantId
  AND a.createdAt >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', a.createdAt)
ORDER BY semana ASC
```

**Revenue atribuido acumulado mensual:**
```sql
SELECT
  DATE_TRUNC('month', c.createdAt) AS mes,
  SUM(c.saleValue) AS revenue_mes,
  SUM(c.commission) AS comision_mes,
  COUNT(DISTINCT c.id) AS compras
FROM conversions c
JOIN recommendations r ON c.recommendationId = r.id
JOIN analyses a ON r.analysisId = a.id
WHERE a.tenantId = :tenantId
  AND c.type = 'purchase'
GROUP BY DATE_TRUNC('month', c.createdAt)
ORDER BY mes ASC
```

**Donde mostrar:** Grafico de lineas con selector de periodo (7d / 30d / 90d) mostrando analisis diarios. Segunda linea superpuesta con tasa de conversion (eje Y secundario). El periodo por defecto es 30 dias. Debajo, grafico de barras agrupadas por semana mostrando analisis totales vs completados.

---

### 2.5 Performance de Productos (Tabla de Recomendaciones)

**Concepto:** Que productos recomienda mas el SAE, y cuales son los mas efectivos en generar conversiones.

**Metricas adicionales a las de la seccion 2.2:**

**Posicion promedio en la rutina (`AVG(recommendations.rank)`):**
- Un producto con rank promedio 1 es el que el SAE siempre pone primero
- Un producto con rank promedio 5-6 casi nunca es protagonista de la rutina

**Distribucion por tipo de piel que recibe la recomendacion:**
```
Para el producto X: de los 150 analisis donde fue recomendado,
¿que porcentaje era piel grasa vs seca vs mixta?
Esto revela si el producto esta siendo correctamente targetizado por el SAE.
```

**Latencia hasta primer click (`clickedAt - analysis.completedAt` en horas):**
- Indica si los clientes hacen click de inmediato (experiencia fluida) o dias despues (email reminder efectivo)
- Calculable pero requiere un nuevo campo en `Recommendation` o un `UsageEvent` de tipo `product_click` con timestamp

**Donde mostrar:** Tabla en pestana "Productos" con columnas ordenables. Filtro por periodo. Un badge de color verde/amarillo/rojo para el CTR (verde: >10%, amarillo: 5-10%, rojo: <5%).

---

## 3. KPIs del Dashboard Admin (Vision Interna de Skinner)

### 3.1 Revenue y Facturacion (Metricas Financieras)

**MRR (Monthly Recurring Revenue):**
```
Calculo actual (billing.ts > adminOverview):
  SUM(PLANS[tenant.plan].monthlyPrice) WHERE tenant.status = 'active'
  
Calculo correcto para expansion revenue:
  Separar por plan:
  - MRR Starter:    COUNT(tenants WHERE plan='starter' AND status='active') * 490
  - MRR Growth:     COUNT(tenants WHERE plan='growth' AND status='active') * 1490
  - MRR Enterprise: Valor manual por contrato (campo nuevo necesario)
  
MRR Total = MRR Starter + MRR Growth + MRR Enterprise
```

**Churn MRR:**
```
Calculo: SUM(PLANS[plan].monthlyPrice) de tenants que pasaron a status='paused' o 'deleted'
         en el mes calendario actual, o cuya subscription.status='canceled'

Churn Rate = Churn MRR / MRR inicio del mes * 100

PROBLEMA: El schema actual no tiene tabla de cambios de estado del tenant.
Ver Seccion 4 para campo nuevo recomendado.
```

**Expansion Revenue:**
```
Calculo: Revenue generado por tenants que hicieron upgrade de plan en el mes actual
         = (PLANS[nuevo_plan].monthlyPrice - PLANS[plan_anterior].monthlyPrice)

PROBLEMA: No existe historial de cambios de plan. Ver Seccion 4.
```

**Revenue por Exceso de Analisis:**
```
Calculo: SUM(usageEvents.total) WHERE type='excess_analysis' AND 
         createdAt >= inicio_mes_actual
```

**Comisiones a Cobrar:**
```
Calculo: SUM(usageEvents.total) WHERE type='commission' AND
         createdAt >= inicio_mes_actual
         
O alternativamente: SUM(conversions.commission) WHERE
         createdAt >= inicio_mes_actual
```

**Revenue Total del Mes:**
```
MRR + Exceso de Analisis + Comisiones + Setup Fees (campo nuevo en Lead/Tenant)
```

**Donde mostrar:** Seccion "Financiero" del admin dashboard. KPI cards en la parte superior: MRR, Churn MRR, Net New MRR (= nuevos tenants - churn + expansion). Grafico de lineas mostrando evolucion del MRR mensual en los ultimos 12 meses. Grafico de area apilada descomponiendo el MRR por plan.

---

### 3.2 Salud de la Plataforma (SAE y Operaciones)

**Latencia del SAE:**
```
Fuente: Analysis.latencyMs (se guarda en cada analisis en analysis.ts)

Metricas:
- p50 (mediana): percentile_cont(0.5) WITHIN GROUP (ORDER BY latencyMs)
- p95: percentile_cont(0.95) WITHIN GROUP (ORDER BY latencyMs)
- p99: percentile_cont(0.99) WITHIN GROUP (ORDER BY latencyMs)

Por periodo: ultimas 24h, 7 dias, 30 dias
Umbral de alerta: p95 > 10,000ms = amarillo | p95 > 20,000ms = rojo
```

**Tasa de Error del SAE:**
```
Calculo: COUNT(analyses WHERE status='failed') / COUNT(analyses) * 100
Por periodo: ultimas 24h, 7 dias, 30 dias
Umbral: > 1% en 24h = amarillo | > 5% = rojo
```

**Volumen de Analisis por Hora (carga del sistema):**
```
SELECT DATE_TRUNC('hour', createdAt), COUNT(*)
FROM analyses
WHERE createdAt >= NOW() - INTERVAL '48 hours'
GROUP BY DATE_TRUNC('hour', createdAt)
ORDER BY 1 ASC

Util para identificar picos de carga y planear capacidad
```

**Analisis por Tenant (heatmap de uso):**
```
SELECT tenantId, DATE_TRUNC('day', createdAt), COUNT(*)
FROM analyses
WHERE createdAt >= NOW() - INTERVAL '30 days'
GROUP BY tenantId, DATE_TRUNC('day', createdAt)
```

**Distribucion de Match Score:**
```
AVG(matchScore), MIN, MAX, STDDEV por tenantId y por periodo
Un match score bajo (< 0.5 en promedio) indica que el catalogo de ese tenant
tiene poca cobertura para las condiciones de sus clientes finales
```

**Donde mostrar:** Seccion "Salud de la Plataforma" con semaforos de estado (verde/amarillo/rojo) para latencia y error rate. Grafico de lineas para latencia p50 y p95 en el tiempo. Grafico de barras para volumen por hora (ultimas 48h). Tabla de distribucion de match score por tenant.

---

### 3.3 Tenant Health Scores (Identificacion de Riesgo)

**Concepto:** Un score compuesto por tenant que permite al equipo de Customer Success de Skinner identificar quienes estan en riesgo de churnar y quienes son candidatos a upgrade.

**Componentes del Health Score (0-100 puntos):**

| Componente | Peso | Calculo | Rango |
|---|---|---|---|
| Uso relativo al limite | 30 pts | `(analysisUsed / analysisLimit) * 30` | 0-30 |
| Crecimiento MoM de analisis | 20 pts | `(analisis_mes_actual / analisis_mes_anterior - 1) * 20` | 0-20 |
| Tasa de conversion > 2% | 20 pts | Si conversion_rate >= 2% → 20pts, 1-2% → 10pts, <1% → 0pts | 0-20 |
| Login de usuarios en ultimos 14 dias | 15 pts | Requiere tabla de sesiones (ver Sec. 4) | 0-15 |
| Productos activos configurados | 15 pts | Si productos >= 20 → 15pts, 10-19 → 8pts, <10 → 0pts | 0-15 |

**Clasificacion:**
- **Verde (70-100):** Tenant saludable, candidato a upsell
- **Amarillo (40-69):** Tenant con friccion, seguimiento proactivo de CS
- **Rojo (0-39):** Tenant en riesgo de churn, intervencion urgente

**Senales de alerta especificas (independientes del score):**
- `analysisUsed / analysisLimit > 0.9` en los primeros 20 dias del mes → candidato a upgrade de plan
- `analysisUsed / analysisLimit < 0.1` en los primeros 20 dias del mes → riesgo de no renovacion
- `subscription.status = 'past_due'` → alerta de pago
- Ningun analisis en los ultimos 7 dias (para tenants con plan activo) → riesgo de abandono
- `tasa de error > 5%` en analisis del tenant → friccion tecnica, posible churneo

**Donde mostrar:** Tabla de "Tenant Radar" en el admin dashboard. Una fila por tenant con columnas: nombre, plan, health score (numero + color), analisis del mes, % uso del limite, conversion rate, ultima actividad. Ordenada por health score ascendente (los de mayor riesgo primero). Filtros: por plan, por riesgo (rojo/amarillo/verde).

---

### 3.4 Metricas de Adquisicion (Pipeline de Ventas)

```
Fuente: tabla Lead del schema

Metricas:
- Leads nuevos esta semana / este mes
- Leads por segmento (laboratorio, clinica, farmacia, spa, outro)
- Leads por fuente (website, demo, landing)
- Tasa de conversion Lead → Tenant activo (requiere vincular Lead con Tenant, ver Sec. 4)
- Tiempo promedio Lead-to-Activation (dias entre Lead.createdAt y Tenant.createdAt)
```

**Donde mostrar:** Seccion "Pipeline" del admin dashboard. Funnel de ventas: Leads → Demos → Activados → Pagando. Tabla de leads recientes con estado.

---

## 4. Nuevos Campos de Base de Datos Necesarios

### 4.1 Tabla `TenantStatusHistory` (CRITICA para churn y expansion)

```prisma
model TenantStatusHistory {
  id         String   @id @default(cuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  
  field      String   // "plan", "status"
  oldValue   String
  newValue   String
  changedBy  String?  // userId que hizo el cambio
  reason     String?  // "upgrade", "downgrade", "churn", "reactivation"
  
  createdAt  DateTime @default(now())
  
  @@map("tenant_status_history")
}
```

**Por que es critica:** Sin esta tabla es imposible calcular churn MRR, expansion revenue ni LTV de forma precisa. Hoy `billing.ts > changePlan` actualiza el tenant pero no deja historial.

---

### 4.2 Campo `Tenant.contractMrr` (Para Enterprise)

```prisma
// En el modelo Tenant, agregar:
contractMrr     Float?   // Para Enterprise con precio negociado
contractNotes   String?  // Notas del contrato
salesOwnerId    String?  // Usuario de Skinner responsable de la cuenta
```

**Por que:** `PLANS.enterprise.monthlyPrice = null` hace que el calculo de MRR total sea incorrecto para cuentas enterprise. Necesitamos guardar el MRR acordado por contrato.

---

### 4.3 Campo `Lead.tenantId` (Para vincular pipeline con activacion)

```prisma
// En el modelo Lead, agregar:
tenantId        String?  // Si el lead se convirtio en tenant
tenant          Tenant?  @relation(fields: [tenantId], references: [id])
status          String   @default("new") // new, contacted, demo_scheduled, activated, lost
activatedAt     DateTime?
lostAt          DateTime?
lostReason      String?
```

**Por que:** Sin esto, no se puede medir Lead-to-Activation ni calcular CAC por canal.

---

### 4.4 Tabla `UserSession` (Para engagement y health score)

```prisma
model UserSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  tenantId  String?
  
  startedAt  DateTime @default(now())
  endedAt    DateTime?
  durationMs Int?
  pagesViewed Int?
  
  @@map("user_sessions")
}
```

**Por que:** El health score del tenant requiere saber si los usuarios B2B estan activos en la plataforma. Sin sesiones, este componente del score no se puede calcular.

---

### 4.5 Campo `Analysis.channel` (Origen del analisis)

```prisma
// En el modelo Analysis, agregar:
channel  String @default("link") // link, qr, widget, tablet, api
```

**Por que:** El tenant tiene 4 canales habilitables (`linkEnabled`, `qrEnabled`, `widgetEnabled`, `tabletEnabled`) pero no sabemos por cual canal llega cada analisis. Fundamental para que el tenant sepa donde invertir.

---

### 4.6 Tabla `RecommendationEvent` (Tracking granular de interacciones)

```prisma
model RecommendationEvent {
  id               String         @id @default(cuid())
  recommendationId String
  recommendation   Recommendation @relation(fields: [recommendationId], references: [id])
  
  eventType   String   // "viewed", "clicked", "shared", "purchase_confirmed"
  metadata    String?  // JSON: { source: "pdf", "report_page", device: "mobile" }
  occurredAt  DateTime @default(now())
  
  @@map("recommendation_events")
}
```

**Por que:** Hoy `Recommendation.clickedAt` solo captura el primer click (un unico DateTime). No captura: multiples clicks del mismo usuario, vista del reporte vs click en el link, compras confirmadas por webhook de ecommerce. Una tabla de eventos permite analytics mucho mas ricos.

---

### 4.7 Campo `Tenant.mrr` Calculado / Cache

```prisma
// En el modelo Tenant, agregar:
cachedMrr          Float?
cachedHealthScore  Float?
cachedStatsAt      DateTime?  // Cuando fue el ultimo calculo del cache
```

**Por que:** Los calculos de health score y MRR son costosos. Cachearlos en la tabla evita queries lentos en el admin dashboard. Un job de background los recalcula cada hora.

---

## 5. Eventos de Analytics (PostHog o Similar)

La siguiente lista de eventos debe implementarse tanto en el frontend (navegador) como en el backend (server-side via PostHog Node SDK para eventos confiables).

### 5.1 Eventos del Flujo de Analisis (Captura del Cliente Final — Anonimos)

| Nombre del Evento | Donde se dispara | Propiedades clave |
|---|---|---|
| `analysis_page_loaded` | Frontend — pagina publica del tenant | `tenant_slug`, `channel`, `device_type` |
| `questionnaire_started` | Frontend — primer campo completado | `tenant_slug`, `channel` |
| `questionnaire_completed` | Frontend — submit del formulario | `tenant_slug`, `skin_type_self_reported`, `primary_objective`, `age_range` |
| `photo_uploaded` | Frontend — foto adjuntada | `tenant_slug`, `has_photo: true/false` |
| `analysis_submitted` | Backend — `analysis.ts > run` inicio | `tenant_slug`, `tenant_id` |
| `analysis_completed` | Backend — `analysis.ts > run` fin exitoso | `tenant_id`, `analysis_id`, `latency_ms`, `skin_type`, `conditions_count`, `products_matched` |
| `analysis_failed` | Backend — `analysis.ts > run` con error | `tenant_id`, `error_code`, `latency_ms` |
| `report_viewed` | Frontend — pagina de resultados cargada | `analysis_id`, `tenant_id`, `channel` |
| `product_recommendation_viewed` | Frontend — scroll hasta seccion de productos | `analysis_id`, `product_id`, `rank`, `match_score` |
| `product_link_clicked` | Backend — endpoint de tracking con `skr_ref` | `recommendation_id`, `product_id`, `analysis_id`, `tenant_id`, `rank` |
| `report_pdf_downloaded` | Frontend o Backend | `analysis_id`, `tenant_id`, `channel: 'download'` |
| `report_email_sent` | Backend | `analysis_id`, `tenant_id`, `channel: 'email'` |
| `report_whatsapp_sent` | Backend | `analysis_id`, `tenant_id`, `channel: 'whatsapp'` |
| `conversion_purchase` | Backend — webhook del ecommerce del tenant | `recommendation_id`, `product_id`, `sale_value`, `commission`, `tenant_id` |

---

### 5.2 Eventos del Dashboard B2B (Usuarios del Tenant)

| Nombre del Evento | Propiedades clave |
|---|---|
| `tenant_login` | `user_id`, `tenant_id`, `plan`, `role` |
| `dashboard_viewed` | `tenant_id`, `plan`, `date_range_selected` |
| `product_catalog_viewed` | `tenant_id`, `product_count` |
| `product_created` | `tenant_id`, `product_id`, `concern_tags`, `skin_type_tags` |
| `product_updated` | `tenant_id`, `product_id`, `fields_changed` |
| `report_list_viewed` | `tenant_id`, `filters_applied` |
| `billing_page_viewed` | `tenant_id`, `current_plan`, `credits_remaining` |
| `plan_upgrade_initiated` | `tenant_id`, `from_plan`, `to_plan` |
| `plan_upgrade_completed` | `tenant_id`, `from_plan`, `to_plan`, `new_mrr` |
| `api_key_copied` | `tenant_id` (señal de integracion) |
| `webhook_configured` | `tenant_id` |
| `credits_low_warning_viewed` | `tenant_id`, `credits_remaining`, `days_left_in_period` |

---

### 5.3 Eventos Internos de Skinner (Admin)

| Nombre del Evento | Propiedades clave |
|---|---|
| `admin_login` | `user_id` |
| `tenant_created` | `tenant_id`, `plan`, `segment` (si viene del campo Lead.segment) |
| `tenant_plan_changed` | `tenant_id`, `from_plan`, `to_plan`, `mrr_delta` |
| `tenant_paused` | `tenant_id`, `reason` |
| `tenant_deleted` | `tenant_id`, `plan`, `tenure_days` |
| `lead_created` | `lead_id`, `segment`, `source` |
| `sae_latency_alert` | `p95_latency_ms`, `period` |
| `sae_error_rate_alert` | `error_rate_pct`, `period` |

---

### 5.4 Propiedades Globales (Super Properties en PostHog)

Estas propiedades deben estar presentes en **todos** los eventos del contexto autenticado:

```javascript
// Para usuarios B2B autenticados:
posthog.identify(userId, {
  tenant_id: tenantId,
  tenant_plan: plan,
  tenant_status: status,
  user_role: role,
  analysis_used: analysisUsed,
  analysis_limit: analysisLimit,
  usage_pct: analysisUsed / analysisLimit,
})

// Para clientes finales (anonimos):
posthog.capture('event_name', {
  tenant_slug: slug,
  channel: 'link' | 'qr' | 'widget' | 'tablet',
  $device_type: 'mobile' | 'desktop' | 'tablet',
})
```

---

## 6. Wireframes del Dashboard Mejorado

### 6.1 Dashboard B2B — Layout General

```
┌─────────────────────────────────────────────────────────────────────┐
│  SKINNER  [Logo Tenant]    Dashboard    Reportes    Productos    Billing │
│           Clínica Pele Bella                                [Avatar] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Bienvenida, 5 de Abril 2026                    [Últimos 30d ▼]     │
│                                                                       │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│ │  ANÁLISIS    │ │  CONVERSIÓN  │ │  REVENUE     │ │  CRÉDITOS   │ │
│ │  347         │ │  6.8%        │ │  R$ 12,430   │ │  653 / 1000 │ │
│ │  +12% MoM ↑  │ │  +1.2pp ↑   │ │  +18% MoM ↑  │ │  347 usados │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
│                                                                       │
│ ┌─────────────────────────────────┐ ┌────────────────────────────┐  │
│ │   EMBUDO DE CONVERSIÓN          │ │   ANÁLISIS POR DÍA         │  │
│ │   [Funnel Chart — vertical]     │ │   [Line Chart — 30 días]   │  │
│ │                                 │ │                             │  │
│ │   Análisis iniciados   347 ████ │ │   ^                         │  │
│ │   Completados          331 ███▌ │ │   |   /\    /\             │  │
│ │   Reportes entregados  298 ███  │ │   |  /  \  /  \  /\        │  │
│ │   Clicks en productos  143 ██   │ │   | /    \/    \/  \       │  │
│ │   Compras confirmadas   24 █    │ │   +────────────────────→    │  │
│ │                                 │ │   Mar 6          Abr 5      │  │
│ │   6.8% tasa conv. final         │ │                             │  │
│ │   41% CTR de recomendación      │ │   — Completados  -- Fallidos│  │
│ └─────────────────────────────────┘ └────────────────────────────┘  │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │   PERFIL DE TUS CLIENTES                                         │ │
│ │                                                                   │ │
│ │  [Donut — Tipo de Piel]   [Donut — Edad]   [Bars — Condiciones] │ │
│ │                                                                   │ │
│ │  Grasa  35%                18-24  18%       Acné        ████ 42% │ │
│ │  Mixta  28%                25-34  34%       Hiperpig    ███  31% │ │
│ │  Seca   20%                35-44  27%       Envejecim.  ██   27% │ │
│ │  Normal 12%                45-54  15%       Sensibil.   █    18% │ │
│ │  Sensib  5%                55+     6%       Acné Rosacea █   12% │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │   TOP 10 PRODUCTOS — PERFORMANCE                                  │ │
│ │                                                                   │ │
│ │   Producto         Recomendado  CTR    Conversión  Revenue        │ │
│ │   ─────────────────────────────────────────────────────────────  │ │
│ │   Sérum Vitamina C   89x       48%    9.0%        R$ 3,200 ████  │ │
│ │   FPS 50+ Fluido     76x       52%    7.9%        R$ 2,890 ████  │ │
│ │   Ácido Glicólico    64x       38%    6.3%        R$ 1,740 ███   │ │
│ │   Hidratante Barrera 58x       31%    5.2%        R$ 1,120 ██    │ │
│ │   ...                                                             │ │
│ │                            [Ver todos los productos →]            │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │   CONVERSIÓN SEMANAL (últimas 12 semanas)                         │ │
│ │   [Line Chart — eje izquierdo: analisis/semana, eje derecho: %]  │ │
│ │                                                                   │ │
│ │   ^ Analisis  ^ Conv%                                             │ │
│ │   |  ████     | 8%       /\                                       │ │
│ │   |  ████     | 6%      /  \   /\    /\                          │ │
│ │   |  ████     | 4%     /    \_/  \  /  \  /                      │ │
│ │   |  ████     | 2%    /          \/    \/                         │ │
│ │   +──────────────────────────────────────────────→                │ │
│ │   Sem 1  Sem 2  Sem 3  Sem 4  Sem 5  ...  Sem 12                 │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Notas de UX del Dashboard B2B:**
- El selector de periodo (7d / 30d / 90d) en la esquina superior derecha afecta todos los graficos simultaneamente.
- Los KPI cards superiores muestran el delta vs periodo anterior (flecha verde arriba = mejora, roja abajo = caida).
- El funnel usa barras horizontales con el porcentaje de caida entre etapas en texto pequeno rojo.
- El grafico de lineas de analisis por dia usa una banda de color suave (area chart) para dar peso visual sin saturar.
- Los donuts de perfil de cliente tienen tooltips con numero absoluto al hacer hover.
- La tabla de productos es el unico elemento con scroll horizontal en mobile.

---

### 6.2 Dashboard Admin — Layout General

```
┌─────────────────────────────────────────────────────────────────────┐
│  SKINNER ADMIN                               [Admin User]  [Salir]  │
├─────────────────────────────────────────────────────────────────────┤
│  Tabs: [Resumen] [Tenants] [Financiero] [Plataforma] [Pipeline]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TAB: RESUMEN                                                         │
│                                                                       │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ │
│ │  MRR        │ │  TENANTS    │ │  ANÁLISIS   │ │  HEALTH SAE    │ │
│ │  R$ 23,840  │ │  12 activos │ │  1,842/mes  │ │  ● p95: 4.2s   │ │
│ │  +R$1,490 ↑ │ │  1 en riesgo│ │  +8% MoM    │ │  ● Error: 0.4% │ │
│ │  Expansion  │ │  0 churns   │ │             │ │  ● VERDE       │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └────────────────┘ │
│                                                                       │
│ ┌───────────────────────────────┐ ┌──────────────────────────────┐  │
│ │   MRR EVOLUCIÓN (12 meses)    │ │   DISTRIBUCIÓN POR PLAN      │  │
│ │   [Area Chart apilada]        │ │   [Stacked Bar o Donut]      │  │
│ │                               │ │                               │  │
│ │   ^ R$                        │ │   Enterprise  2  ████  R$??? │  │
│ │   |    ████████████████       │ │   Growth      5  ████ R$7,450│  │
│ │   |    ████████████████       │ │   Starter     5  ███  R$2,450│  │
│ │   |    ██████████             │ │                               │  │
│ │   +──────────────────────→    │ │   MRR Recurrente: R$ 23,840  │  │
│ │   May 25          Abr 26      │ │                               │  │
│ │   — Enterprise  — Growth      │ └──────────────────────────────┘  │
│ │   — Starter     — Exceso      │                                    │
│ └───────────────────────────────┘                                    │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │   TENANT RADAR — Todos los Tenants (ordenados por Health Score)   │ │
│ │                                                                   │ │
│ │  Tenant         Plan       Score   Uso%   Conv%  Última actividad │ │
│ │  ──────────────────────────────────────────────────────────────  │ │
│ │  ● Clinica Abc  Starter    28/100  12%    0.3%   hace 14 días    │ │
│ │  ● Farmacia XYZ Growth     41/100  34%    1.1%   hace 5 días     │ │
│ │  ◑ Lab Cosm.    Growth     65/100  67%    3.2%   ayer            │ │
│ │  ◑ Spa Beleza   Starter    71/100  78%    4.1%   hoy             │ │
│ │  ● Pele & Cia   Enterprise 89/100  45%    6.8%   hoy             │ │
│ │                                                                   │ │
│ │  ● Rojo = riesgo  ◑ Amarillo = atención  ● Verde = saludable     │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  TAB: PLATAFORMA                                                      │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │   LATENCIA DEL SAE (últimas 48 horas)                             │ │
│ │   [Line Chart — p50 azul / p95 naranja / p99 rojo]               │ │
│ │                                                                   │ │
│ │   ^ ms                                                            │ │
│ │   |  20k ─────────────────── umbral alerta p95 (rojo punteado)   │ │
│ │   |  10k ─────────────────── umbral warning p95 (naranja punteado│ │
│ │   |   5k    p99 /\    /\                                          │ │
│ │   |   3k    p95 /  \  / \  /                                      │ │
│ │   |   1k    p50 ─────────────────────                             │ │
│ │   +────────────────────────────────────────────────────────────→  │ │
│ │   Abr 3 00h         Abr 4 00h              Abr 5 00h              │ │
│ │                                                                   │ │
│ │   [Bar Chart aparte]  VOLUMEN DE ANÁLISIS POR HORA               │ │
│ │   Pico: Sábado 15h-18h (64 análisis)                             │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │   DISTRIBUCIÓN DE MATCH SCORE POR TENANT                          │ │
│ │   [Box Plot o Bar Chart con rango IQR]                            │ │
│ │                                                                   │ │
│ │   Pele & Cia    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ avg 0.82 (excelente cobertura)  │ │
│ │   Lab Cosm.     ▓▓▓▓▓▓▓▓▓▓▓▓    avg 0.71                         │ │
│ │   Spa Beleza    ▓▓▓▓▓▓▓▓        avg 0.59                         │ │
│ │   Clinica Abc   ▓▓▓▓▓           avg 0.44 ⚠ catálogo insuficiente │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Notas de UX del Admin Dashboard:**
- Los tabs permiten separar las audiencias: "Resumen" para liderazgo, "Plataforma" para ingenieria, "Pipeline" para ventas.
- El Tenant Radar es la pantalla mas importante de CS: permite ver de un vistazo quien necesita atencion.
- Los alertas de plataforma (latencia, error rate) usan colores de semaforo con thresholds claros.
- El grafico de MRR por 12 meses es area chart apilada para ver composicion del revenue por plan.
- Los iconos de estado (verde/amarillo/rojo) en la tabla de tenants se calculan en el backend, no en el frontend, para evitar logica duplicada.

---

### 6.3 Seccion de Productos — Vista Detallada del Tenant

```
┌─────────────────────────────────────────────────────────────────────┐
│  Productos — Performance                              [Exportar CSV] │
│  Periodo: [Últimos 30 días ▼]   Filtrar por: [Tipo de piel ▼]      │
├──────────────────────┬────────┬──────┬──────┬──────────┬──────────┤
│  Producto            │ Recom. │ CTR  │ Conv │ Revenue  │ Rank avg │
├──────────────────────┼────────┼──────┼──────┼──────────┼──────────┤
│  Sérum Vitamina C    │  89    │ 48%  │ 9.0% │ R$ 3,200 │ 1.8      │
│  FPS 50+ Fluido      │  76    │ 52%  │ 7.9% │ R$ 2,890 │ 2.1      │
│  Ác. Glicólico 10%   │  64    │ 38%  │ 6.3% │ R$ 1,740 │ 3.2      │
│  Hidrat. Barreira    │  58    │ 31%  │ 5.2% │ R$ 1,120 │ 4.5      │
│  Retinol 0.3%        │  41    │ 29%  │ 4.8% │ R$ 980   │ 3.8      │
│  Niacinamida 10%     │  38    │ 44%  │ 3.2% │ R$ 620   │ 2.9      │
│  Tônico AHA/BHA      │  22    │ 18%  │ 1.1% │ R$ 89    │ 5.7 ⚠    │
└──────────────────────┴────────┴──────┴──────┴──────────┴──────────┘

El ⚠ indica rank promedio alto (el producto casi nunca es prioritario)
y conversion baja. Posible accion: revisar el catalogo de ese producto.
```

---

## 7. Prioridad de Implementacion

### Fase 1 — Quick Wins (1-2 semanas, no requieren nuevos campos en DB)

1. **Ampliar `dashboard.ts > stats`** para incluir: analisis completados en los ultimos 30 dias, revenue atribuido del mes, CTR promedio de recomendaciones, distribucion de `skinType`.
2. **Agregar serie temporal de 30 dias** al dashboard query: `GROUP BY DATE_TRUNC('day', createdAt)` sobre la tabla `analyses`.
3. **Agregar tabla de performance de productos** al router: join `recommendations` + `conversions` + `products` con agregaciones por producto.
4. **Mostrar MRR en el admin UI**: `billing.ts > adminOverview` ya lo calcula, solo falta renderizarlo en `admin/page.tsx`.
5. **Agregar `Analysis.channel`** al schema (migration simple, campo con default) y capturarlo en `analysis.ts > run`.
6. **Implementar eventos PostHog** para `analysis_completed`, `product_link_clicked` y `conversion_purchase` en el backend.

### Fase 2 — Metricas Estructurales (3-4 semanas, requieren migraciones)

1. Crear tabla `TenantStatusHistory` y actualizarla en `billing.ts > changePlan` y `tenant.ts > update`.
2. Crear tabla `RecommendationEvent` y migrar el tracking existente de `Recommendation.clickedAt`.
3. Agregar `Lead.tenantId`, `Lead.status` y `Lead.activatedAt`.
4. Agregar `Tenant.contractMrr` y `Tenant.salesOwnerId` para enterprise.
5. Construir el Health Score calculado con un job de background (cron cada hora).
6. Implementar el Tenant Radar en el admin dashboard.

### Fase 3 — Analytics Avanzados (5-8 semanas)

1. Crear tabla `UserSession` y medir engagement de usuarios B2B.
2. Construir el funnel de conversion como grafico interactivo en el dashboard del tenant.
3. Implementar cohort analysis: tenants activados en el mismo mes, como evoluciona su uso en los siguientes 6 meses.
4. Implementar alertas proactivas por email al equipo de CS cuando un tenant entra en zona roja del health score.
5. Exportacion de datos para el tenant (CSV de analisis, CSV de conversiones) respetando LGPD (sin PII si el cliente opto por anonimato).

---

## 8. Decisiones de Diseno Criticas

### 8.1 Granularidad del Revenue Atribuido

**Problema:** `Conversion.saleValue` se llena unicamente si hay una integracion de ecommerce configurada (`TenantConfig.shopifyDomain`, `webhookUrl`). Para tenants sin integracion, `saleValue` es siempre null.

**Recomendacion:** Usar `Product.price` como proxy cuando `saleValue` es null:
```
revenue_estimado = COUNT(conversions WHERE type='purchase') * AVG(product.price)
```
Marcar claramente en el UI que el revenue es "estimado" vs "confirmado" para no crear confusion.

### 8.2 Anonimato vs. Insights

**Problema:** `Analysis.clientEmail` y `clientName` son opcionales. Muchos analisis seran completamente anonimos, lo que limita el analisis de cohortes de clientes finales.

**Recomendacion:** Presentar los datos demograficos siempre como distribuciones agregadas (%, no individuos). Nunca mostrar una fila de la tabla de reportes que diga "cliente anonimo" sin dar opcion de filtrar — esto confunde al tenant. Agregar un badge "X% de analisis con email capturado" como incentivo para que el tenant active la captura de email en su flujo.

### 8.3 Latencia del Dashboard

**Problema:** Algunas queries (especialmente la distribucion de condiciones que requiere unnest de JSON) pueden ser lentas con volumen alto.

**Recomendacion:** Implementar una tabla de `AnalyticsSummary` con snapshots diarios calculados por un job de background (cron a las 2am). El dashboard del tenant muestra datos del snapshot (con timestamp "actualizado hace X horas") excepto los KPI cards del dia actual que se calculan en tiempo real.

---

*Documento generado en base al estado del codigo al 5 de Abril de 2026.*  
*Schema fuente: `/packages/db/prisma/schema.prisma`*  
*Routers analizados: `dashboard.ts`, `billing.ts`, `report.ts`, `analysis.ts`, `tenant.ts`*
