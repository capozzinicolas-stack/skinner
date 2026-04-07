# Skinner — Estrategia de Lanzamiento
**Fecha de referencia**: Abril 2026  
**Mercado**: Brasil (dermocosméticos B2B)  
**Objetivo 6 meses**: 10 clientes B2B activos, R$50K MRR al mes 12

---

## 1. Pre-Lanzamiento (2 Semanas)

### 1.1 Plan de Beta Testing con 2–3 Clientes Amigos

El objetivo del beta no es validar el mercado — es encontrar los bugs que destruyen conversiones antes de que llegue un prospecto real. Seleccionar clientes que sean tolerantes al error pero exigentes con el feedback.

**Perfil de beta partner ideal:**
- Alguien que ya confía en el fundador (contacto directo, no cold outreach)
- Operación pequeña-mediana: 1–3 dermatólogos o encargados de ventas en el punto de contacto
- Con catálogo de productos activo y ganas de probar tecnología
- Sin expectativa de SLA ni soporte 24/7

**Candidatos prioritarios por segmento:**

| Slot | Segmento | Razón |
|------|----------|-------|
| Beta 1 | Clínica dermatológica (2–5 médicos) | Mayor disposición a probar herramientas de diagnóstico, feedback técnico de calidad |
| Beta 2 | Farmacia dermocosmética independiente | Caso de uso de alto volumen (tráfico diario), valida el flujo de recomendación en el punto de venta |
| Beta 3 | Laboratorio o marca propia pequeña | Valida la funcionalidad de catálogo + PDF branded + tracking de comisiones |

**Protocolo de activación:**
- Semana -2 (Día 1): Llamada de 30 min con cada beta partner. Explicar qué se está probando, qué NO está listo, y qué se espera de ellos.
- Semana -2 (Día 2–3): Onboarding manual asistido por el fundador. Configurar tenant, subir catálogo, personalizar marca.
- Semana -2 (Día 4–7): Beta partner usa la plataforma con 5–10 usuarios reales (clientes de su negocio).
- Semana -1 (Día 1–5): Segunda ronda de uso independiente (sin asistencia). El fundador solo observa.
- Semana -1 (Día 6–7): Sesión de feedback estructurado (ver sección 1.2).

**Métricas a monitorear durante beta:**
- Tiempo de análisis end-to-end (objetivo: ≤15 segundos)
- Tasa de error en validación de foto (objetivo: <20% de reintentos)
- Tasa de completado del cuestionario (objetivo: >85%)
- ¿El PDF se genera correctamente con el branding del tenant?
- ¿El link de análisis funciona en mobile? (WhatsApp es el canal principal en Brasil)

---

### 1.2 Framework de Recolección de Feedback

**No usar formularios genéricos. Usar sesiones estructuradas de 45 minutos.**

**Estructura de la sesión de feedback (por beta partner):**

**Parte A — Observación (15 min)**  
Pedirle al encargado que realice un análisis completo de un cliente mientras el fundador observa en silencio. No intervenir. Anotar cada momento de fricción, duda, o pausa.

**Parte B — Entrevista (20 min)**  
Preguntas no-leading:
1. ¿Qué fue lo más confuso del proceso de configuración inicial?
2. ¿En qué momento dudaste si la plataforma estaba funcionando bien?
3. ¿Cuándo se lo mostrarías a un cliente? ¿Cuándo NO se lo mostrarías?
4. ¿Qué le falta para que puedas cobrar más por tus servicios gracias a esto?
5. ¿Qué le mostrarías primero a un colega para convencerlo de usarlo?
6. Si tuvieras que describir Skinner en una frase para tu cliente, ¿cómo lo harías?

**Parte C — Test de precio (10 min)**  
- "El plan que usarías costaría R$490/mes. ¿Te parece caro, justo o barato?"
- "¿A qué precio se convertiría en una decisión obvia para ti?"
- "¿A qué precio empezarías a dudar?"

**Herramienta de captura:**  
Crear una hoja en Notion o Google Sheets con columnas: `Feedback bruto | Categoría (UX/Bug/Feature/Precio/Mensaje) | Impacto (Alto/Medio/Bajo) | Sprint que lo resuelve`.

---

### 1.3 Lista de Fixes Críticos — Priorización

**Criterio de clasificación:**  
- P0 = Bloquea la venta o el uso. Fix antes de lanzar.
- P1 = Genera fricción significativa. Fix en primera semana post-launch.
- P2 = Nice-to-have. Backlog.

**P0 — Bloquean el lanzamiento:**
1. Flujo de análisis se interrumpe en mobile (iOS Safari y Chrome Android)
2. PDF no se genera o llega vacío por email
3. El link del tenant no carga con branding personalizado
4. Error de validación de foto sin mensaje claro al usuario
5. Fallo en checkout de Stripe (plan Starter o Growth)
6. Aislamiento multi-tenant roto (un B2B ve datos de otro)

**P1 — Fix en primera semana:**
1. Instrucciones de captura de foto poco claras (alta tasa de reintentos)
2. El dashboard B2B no muestra métricas de uso en tiempo real
3. Tiempo de respuesta del análisis >20 segundos sin feedback visual
4. Email de resultados cae en spam (configurar SPF/DKIM en dominio)
5. Sin mensaje de error amigable cuando Claude falla o retorna JSON malformado

**P2 — Backlog:**
1. Búsqueda y filtros en el catálogo de productos
2. Historial de análisis para el usuario final (B2C)
3. Exportación de reportes en bulk

---

## 2. Secuencia de Lanzamiento (Mes 1)

### 2.1 ¿A qué segmento atacar primero?

**Segmento prioritario: Clínicas dermatológicas (2–10 médicos)**

**Justificación:**

| Criterio | Clínicas | Laboratorios | Farmacias |
|----------|----------|--------------|-----------|
| Ciclo de venta | 1–2 semanas | 4–8 semanas | 2–3 semanas |
| Decisión de compra | 1 persona (dueño-médico) | Comité | Gerente farmacia |
| Ticket percibido por herramienta SaaS | Alto (ya pagan software clínico) | Alto (pero proceso lento) | Bajo (márgenes apretados) |
| Caso de uso natural | Análisis como parte de consulta o protocolo estético | Demo en feria / e-commerce | Punto de venta digital |
| Prueba de valor rápida | Alta: primer día hay resultados visibles | Baja: requiere integrar catálogo grande | Media |
| Potencial de referido | Alto (comunidad dermatológica es pequeña) | Medio | Bajo |
| Resistencia al precio | Baja (R$490/mes = costo de 1 consulta) | Media | Alta |

**Las clínicas dermatológicas son el segmento de menor fricción para el primer cierre y el de mayor efecto de red.** Un dermatólogo que adopta Skinner se lo cuenta a sus colegas. Un laboratorio que adopta Skinner no.

**Subsegmentos dentro de clínicas:**
1. Clínicas estéticas con foco en dermocosméticos (no solo procedimientos)
2. Dermatólogos con tienda de productos propia o alianza con marca
3. Clínicas que ya usan algún software de gestión (indicio de receptividad a SaaS)

---

### 2.2 Plan Semana a Semana — Mes 1

**Semana 1 (7–13 Abril 2026) — Setup de pipeline comercial**

| Día | Acción | Resultado esperado |
|-----|--------|-------------------|
| Lunes | Crear lista de 50 clínicas dermatológicas en São Paulo y Belo Horizonte. Fuente: Google Maps, Instagram, CFM (Conselho Federal de Medicina). | Lista CRM lista |
| Lunes | Configurar CRM simple: HubSpot free o Notion DB con columnas Stage / Próximo paso / Fecha / Notas | CRM operativo |
| Martes | Identificar 10 contactos con conexión de 1er o 2do grado (LinkedIn, WhatsApp, conocidos). Estos son los primeros 10 outreach. | Lista warm leads |
| Miércoles | Preparar demo online funcional en skinner.com.br/demo (branding Skinner, sin tenant) | Demo pública activa |
| Jueves | Crear deck de ventas (5 slides max): Problema → Solución → Demo → Caso beta → Precio. Ver sección 2.4. | Deck listo |
| Viernes | Enviar primeros 10 mensajes WhatsApp warm (ver plantilla en sección 2.3) | 10 outreach enviados |

**Semana 2 (14–20 Abril) — Primeras demos**

| Día | Acción | Resultado esperado |
|-----|--------|-------------------|
| Lunes–Martes | Follow-up a los 10 warm. Empezar cold outreach a 20 clínicas de la lista (email + LinkedIn). | 30 contactados en total |
| Miércoles–Jueves | Hacer 3–5 demos online (Google Meet / Zoom). Usar el script de la sección 2.4. | 3–5 demos realizadas |
| Viernes | Enviar propuesta comercial a quienes mostraron interés. Deadline claro: "Precio beta válido hasta el 30 de Abril." | 1–3 propuestas enviadas |

**Semana 3 (21–27 Abril) — Cierre del primer cliente**

| Día | Acción | Resultado esperado |
|-----|--------|-------------------|
| Lunes | Follow-up a propuestas enviadas. Llamada de 15 min para resolver objeciones. | Avanzar en pipeline |
| Martes–Miércoles | Ampliar outreach: 20 nuevos contactos. Sumar farmacias dermatológicas al mix (10 contactos). | 50 contactados en total acumulado |
| Jueves | Onboarding del primer cliente si hay cierre. Usar checklist de sección 2.5. | Primer cliente activo |
| Viernes | Solicitar testimonio o caso de uso del beta. Documentar para usar en el siguiente outreach. | Social proof inicial |

**Semana 4 (28 Abril – 4 Mayo) — Escalar lo que funciona**

| Día | Acción | Resultado esperado |
|-----|--------|-------------------|
| Lunes | Revisar qué canal tuvo mejor respuesta (WhatsApp warm vs email vs LinkedIn). Doblar en ese canal. | Insight de canal |
| Martes–Miércoles | 3–5 demos adicionales con nuevos prospectos | Pipeline caliente con 5–8 oportunidades activas |
| Jueves | Cerrar 2do cliente si hay oportunidad o confirmar fecha de cierre con los más avanzados. | 2 clientes activos o en proceso |
| Viernes | Retrospectiva de mes 1: ¿Qué objeciones aparecen más? ¿Qué parte de la demo convence más? Ajustar deck y script. | Playbook ajustado |

**Objetivo de mes 1**: 2 clientes activos pagando + 3 oportunidades calientes en pipeline.

---

### 2.3 Plantillas de Outreach

**WhatsApp — Warm Lead (contacto de 1er grado)**

```
Oi [Nombre], tudo bem?

Trabalhei nestes últimos meses num projeto que acho que pode ser 
interessante pra sua clínica.

Criamos uma plataforma que faz análise de pele com IA e gera 
recomendações de produtos personalizadas pro seu catálogo — com 
relatório em PDF com a sua marca.

Funciona direto pelo celular do paciente, em 2 minutos.

Posso te mostrar em 20 minutos como funciona? Tenho horário 
essa semana.
```

**WhatsApp — Warm Lead (contacto de 2do grado)**

```
Oi [Nombre]! A [nombre del contacto en común] me passou seu contato.

Tenho uma plataforma de análise de pele com IA que estou lançando 
no Brasil — focada em clínicas e dermatologistas.

A ideia é simples: o paciente faz uma análise rápida pelo celular, 
recebe um relatório PDF com recomendações dos seus produtos, e 
você aumenta o ticket médio sem consulta adicional.

Posso te mostrar em 20 minutos?
```

**Email — Cold Outreach (clínicas)**

```
Assunto: Análise de pele com IA para [Nome da Clínica]

Olá [Nombre],

Vi que a [Nome da Clínica] tem foco em tratamentos dermatológicos 
e queria apresentar algo relevante.

Lançamos o Skinner — uma plataforma B2B que permite que seus 
pacientes façam uma análise de pele personalizada pelo celular, 
com recomendações dos seus produtos e relatório PDF com a sua marca.

Resultado: ticket médio maior, mais aderência ao protocolo, 
e diferencial competitivo na consulta.

Clínicas em fase beta estão vendo aumento de 20–35% nas vendas 
de produtos recomendados.

Posso te mostrar em 20 minutos essa semana?

[Nombre del fundador]
skinner.com.br
```

**LinkedIn — Connection Request + Mensaje**

```
Mensagem de conexão:
"Dermatologista com foco em dermocosméticos — tenho algo 
relevante pra você. Posso conectar?"

Mensagem após aceitar:
"Obrigado pela conexão, [Nombre].

Trabalho com uma plataforma de análise de pele com IA para 
clínicas — o paciente recebe recomendações dos seus produtos 
em 2 minutos, com relatório PDF personalizado.

Faz sentido mostrar como funciona? 20 minutos, sem compromisso."
```

**Reglas de outreach:**
- Máximo 1 follow-up por canal si no hay respuesta en 3 días.
- No enviar el mismo mensaje por 2 canales simultáneamente al mismo contacto.
- Si no responde a WhatsApp + email, intentar LinkedIn. Si no responde a los 3, descartar por 30 días.

---

### 2.4 Script de Demo para Llamadas de Ventas

**Duración objetivo: 25–30 minutos**

**Estructura:**

**Minutos 0–5 — Descubrimiento**  
No mostrar el producto todavía. Hacer preguntas:
- "Como funciona hoje a recomendação de produtos na sua clínica?"
- "Você tem produtos próprios ou de marcas parceiras que vende?"
- "Qual é o desafio maior: fazer o paciente saber o que precisa, ou convencê-lo a comprar?"
- "Você já tentou algo parecido — quiz, análise, consultoria de produto?"

Escuchar. Identificar el pain principal antes de hablar de Skinner.

**Minutos 5–8 — Contexto del problema (adaptado al pain que mencionaron)**  
"O que você me descreveu é exatamente o que a maioria das clínicas enfrenta: o paciente sai da consulta com uma lista de produtos mas não tem contexto suficiente pra priorizar. Resultado: não compra, ou compra errado e não volta."

**Minutos 8–20 — Demo en vivo**  
Secuencia de la demo:
1. Mostrar el link del tenant en mobile (o demo pública). "Isso é o que o seu paciente vê."
2. Hacer el cuestionario en pantalla compartida. "São 7 perguntas, leva 2 minutos."
3. Subir una foto. "A IA valida a qualidade antes de analisar."
4. Mostrar los resultados: tipo de piel, condiciones detectadas, productos recomendados. "Esses produtos são do catálogo que você configura."
5. Mostrar el PDF generado. "Esse relatório sai com a sua marca — logo, cores, disclaimer."
6. Mostrar el dashboard B2B. "Aqui você vê todas as análises, métricas de uso, e rastreamento de vendas."

**Minutos 20–25 — Precio y siguientes pasos**  
"Temos três planos. Para uma clínica do seu tamanho, o Starter a R$490/mes faz sentido — inclui até [X] análises/mês e relatórios ilimitados. Se você quiser escalar, o Growth a R$1.490 inclui [diferenciales]."

"Qual seria o próximo passo mais fácil pra você — testar com 5 pacientes esta semana?"

**Cierre siempre con acción concreta:**  
- "Posso te mandar o link de cadastro agora pelo WhatsApp."
- "Posso montar seu tenant em 30 minutos enquanto a gente está em chamada."
- "Se você quiser, faço o onboarding com você amanhã — leva 45 minutos."

---

### 2.5 Checklist de Onboarding del Primer Cliente

**Fase 1 — Setup del tenant (Responsable: Fundador, ~30 min)**
- [ ] Crear tenant en panel admin
- [ ] Configurar nombre, subdominio y slug del tenant
- [ ] Subir logo (PNG con fondo transparente, mínimo 400px)
- [ ] Configurar colores primario y secundario de marca
- [ ] Ingresar disclaimer médico / legal del cliente
- [ ] Crear usuario admin del cliente y enviar invitación por email

**Fase 2 — Catálogo de productos (Responsable: Cliente asistido, ~45 min)**
- [ ] Exportar catálogo del cliente en CSV o XLSX
- [ ] Validar formato de columnas (nombre, descripción, precio, imagen, URL)
- [ ] Importar productos a la plataforma
- [ ] Asignar tags de condición y tipo de piel a cada producto (mínimo 5 productos para una demo funcional)
- [ ] Verificar que las imágenes se subieron correctamente

**Fase 3 — Test end-to-end (Responsable: Fundador + Cliente, ~20 min)**
- [ ] Hacer un análisis completo con el link del tenant
- [ ] Verificar que los productos recomendados son relevantes
- [ ] Verificar que el PDF llega por email con branding correcto
- [ ] Verificar que el análisis aparece en el dashboard del cliente

**Fase 4 — Activación de pagos (Responsable: Cliente, ~15 min)**
- [ ] Cliente completa checkout en Stripe (plan elegido)
- [ ] Confirmar que el tenant tiene el plan asignado y los créditos disponibles
- [ ] Enviar instrucciones del Customer Portal Stripe para autogestión de pagos

**Fase 5 — Entrega de materiales (Responsable: Fundador)**
- [ ] Enviar QR code listo para imprimir (apunta al link de análisis del tenant)
- [ ] Enviar instrucciones de uso en PDF (1 página, en portugués)
- [ ] Agendar check-in de 15 min para el Día 7 post-onboarding

**KPI de onboarding exitoso**: El cliente hace el primer análisis real con un paciente/cliente suyo en las primeras 48 horas del onboarding.

---

## 3. Motor de Crecimiento (Meses 2–6)

### 3.1 Plan de Contenido y SEO

**Idioma**: Portugués (pt-BR). El blog es el canal de educación de mercado, no de ventas directas.

**Objetivo del blog**: Posicionar a Skinner como la referencia en "análise de pele com IA para profissionais" en Brasil. El visitante del blog es el B2B decision-maker (dermatólogo, gerente de farmácia, marketing manager de laboratório).

**Frecuencia**: 2 artículos por semana (Meses 2–3), 1 por semana (Meses 4–6).

**Palabras clave objetivo (portugués, con volumen estimado Brasil):**

| Keyword | Intención | Dificultad | Prioridad |
|---------|-----------|------------|-----------|
| análise de pele com inteligência artificial | Informacional | Media | Alta |
| personalização de produtos skincare | Informacional | Baja | Alta |
| como aumentar vendas de cosméticos na clínica | Comercial | Baja | Alta |
| software para clínica dermatológica | Comercial | Media | Alta |
| recomendação de produtos para pele oleosa | Informacional | Baja | Alta |
| dermocosméticos recomendação personalizada | Informacional | Baja | Alta |
| análise de pele para farmácia | Comercial | Muy baja | Alta |
| como fidelizar paciente clínica de pele | Informacional | Baja | Media |
| inteligência artificial dermatologia | Informacional | Alta | Media |
| skincare personalizado tecnologia | Informacional | Media | Media |

**Temas de blog por mes:**

**Mes 2 — Educación del problema:**
1. "Por que 70% dos pacientes não seguem as recomendações de produtos depois da consulta" (SEO: fidelização paciente)
2. "O que é análise de pele por IA e como funciona na prática" (SEO: análise de pele IA)
3. "Como a personalização aumenta a aderência ao protocolo dermatológico" (SEO: personalização skincare)
4. "5 erros que farmácias cometem ao recomendar dermocosméticos" (SEO: recomendação dermocosméticos farmácia)
5. "O impacto da tecnologia no setor de dermocosméticos no Brasil em 2026" (SEO: mercado dermocosméticos Brasil)
6. "Como laboratórios de cosmética estão usando IA para aumentar conversão" (SEO: laboratório cosmético IA)
7. "Guia completo: tipos de pele e cuidados essenciais" (SEO: tipos de pele)
8. "Por que o relatório de pele personalizado aumenta o ticket médio da consulta" (SEO: ticket médio clínica dermatológica)

**Mes 3 — Casos de uso y diferenciación:**
1. "Como uma clínica dermatológica pode vender mais produtos sem contratar mais pessoas"
2. "Análise de pele: checklist para escolher a melhor ferramenta para sua farmácia"
3. "O guia do dermatologista para integrar tecnologia sem perder o toque humano"
4. "Como montar um catálogo de produtos otimizado para recomendação por IA"
5. "Farmácias de manipulação vs. farmácias dermatológicas: estratégias de personalização"
6. "ROI real: quanto uma clínica ganha com análise de pele automatizada"
7. "Consentimento e LGPD em análise de imagem facial: o que você precisa saber"
8. "Como criar uma rotina de skincare personalizada com base em dados"

**Mes 4–6 — SEO de largo plazo + casos reales:**
- Casos de estudio de clientes (con su permiso) → "Como a Clínica X aumentou 30% nas vendas de produtos"
- Guías técnicas: "Ingredientes ativos para pele mista: o que a IA prioriza e por que"
- Entrevistas con dermatólogos sobre tendencias en dermocosméticos
- Comparativas: "Skinner vs. quiz manual vs. análise presencial: qual converte mais?"

**Distribución del contenido:**
- LinkedIn personal del fundador (extracto del artículo + opinión propia)
- Instagram @skinnerapp (carrusel con los puntos clave, diseño de la guía de marca)
- WhatsApp groups de dermatólogos y cosmetólogos (compartir cuando sea genuinamente útil, no spam)
- Newsletter mensual a leads captados

---

### 3.2 Estrategia de Partnerships

**Nivel 1 — Dermatólogos con influencia digital (Quick wins, Mes 2–3)**

Objetivo: 3–5 dermatólogos con 10K+ seguidores en Instagram o LinkedIn que usen Skinner y lo mencionen orgánicamente.

Oferta para ellos:
- Plan Growth gratis por 3 meses a cambio de 1 post honesto en redes sobre su experiencia
- Co-autoría en artículo del blog de Skinner (visibilidad para ellos)
- Early access a features nuevas + crédito en el producto ("Desarrollado con input del Dr. X")

Cómo encontrarlos: Instagram + hashtags #dermatologista #skincare #dermocosmeticos + filtrar por engagement rate >3%.

**Nivel 2 — Eventos del sector (Mes 3–4)**

Eventos clave en Brasil para el sector dermocosmético:

| Evento | Fecha aprox | Relevancia |
|--------|-------------|------------|
| SBD (Congresso Brasileiro de Dermatologia) | Agosto–Septiembre | Alta — dermatólogos |
| Cosmoprof South America (São Paulo) | Julio | Alta — laboratorios y marcas |
| Beauty Fair (São Paulo) | Septiembre | Media — retail y distribuidores |
| Farmácia Show | Mayo | Alta — farmacias |

Estrategia para eventos:
- No pagar stand en Mes 2–3 (demasiado caro para el ROI en esta etapa)
- Asistir como participante, hacer networking directo
- Organizar side event o workshop de 45 min en espacio co-working cercano al venue ("Cómo la IA está cambiando la recomendación de dermocosméticos en Brasil") — bajo costo, alto valor percibido
- Target: conseguir 5–10 tarjetas de prospectos calificados por evento

**Nivel 3 — Asociaciones gremiales (Mes 4–6)**

- SBD (Sociedade Brasileira de Dermatologia): Proponer partnership de contenido, no comercial. Artículo conjunto, webinar.
- ABIHPEC (Asociación Brasileña de la Industria de Higiene Personal, Perfumería y Cosméticos): Visibilidad con laboratorios.
- CFF (Conselho Federal de Farmácia): Canal hacia farmacias dermatológicas.

Oferta: Skinner pone su tecnología al servicio de iniciativas educativas de la asociación (webinars, guías) a cambio de mención y acceso a base de asociados.

**Nivel 4 — Integraciones y distribuidores (Mes 5–6)**

- Distribuidores de dermocosméticos (Dermaclub, Biotrade, etc.): Proponer que Skinner sea parte del paquete de "digitalización" que ofrecen a sus clientes B2B.
- Software de gestión de clínicas (MedPlus, iClinic): Explorar integración o co-marketing. Sus clientes son exactamente el ICP de Skinner.

---

### 3.3 Programa de Referidos

**Mecánica:**
- Cada cliente activo recibe un link de referido único
- Por cada nuevo cliente que se suscriba a través del link: el referidor recibe **1 mes gratis** de su plan actual
- El nuevo cliente recibe **R$200 de descuento** en su primer mes
- No hay límite de referidos — cuantos más, mejor para ambas partes

**Comunicación del programa:**
- Activar en el email de bienvenida (después de onboarding exitoso, no antes)
- Recordatorio en el email del Día 30 (cuando el cliente ya tuvo resultados)
- Dashboard B2B muestra el link de referido y los referidos activos

**Incentivo adicional para top referrers:**
- Cliente que genera 3+ referidos activos: upgrade gratuito al siguiente plan por 3 meses
- Reconocimiento en el sitio web ("Parceiros Skinner") con logo de la clínica/farmacia

**Métricas del programa:**
- Referral rate objetivo: 20% de clientes activos generan al menos 1 referido
- CAC por referido: R$0 (solo costo del mes gratis, valor ~R$490–1490)
- Tiempo de activación del referido: promedio esperado <14 días desde el link

---

### 3.4 Validación de Estrategia de Precios

**Hipótesis actual de precios:**

| Plan | Precio | Análisis incluidos | Comisión sobre ventas |
|------|--------|-------------------|----------------------|
| Starter | R$490/mes | A definir | 3% |
| Growth | R$1.490/mes | A definir | 2% |
| Enterprise | Custom | Ilimitado | 1% |

**Tests de precio a ejecutar en Mes 2–3:**

1. **Test de ancla**: En la página de pricing, mostrar el Enterprise primero (aunque sea "Contactar"). Hace que Growth se perciba como razonable.

2. **Test de límite de análisis**: Testear si los clientes prefieren pagar por análisis adicionales (metered) o un techo mensual fijo. Hipótesis: farmacias prefieren metered (tráfico variable), clínicas prefieren fijo (presupuesto predecible).

3. **Test de valor del Plan Growth**: Identificar 1–2 features "Growth only" que sean genuinamente deseables para clínicas que escalaron (ej: análisis longitudinal, múltiples usuarios, exportación de datos). Si nadie pide upgrade, el Growth no tiene suficiente diferenciación.

4. **Señales de alarma en pricing:**
   - Si >80% de los primeros 10 clientes eligen Starter: el Growth no está bien posicionado o el precio es alto.
   - Si el churn en Mes 3 supera 20%: el precio no está alineado con el valor percibido. Investigar antes de ajustar.
   - Si los prospectos no preguntan por precio sino por "cómo funciona": el mercado todavía está en fase educativa (normal en Mes 1–2).

**Decisión de precio para meses 1–3**: Mantener precios actuales. No hacer descuentos permanentes. Usar "precio beta" con fecha límite como herramienta de urgencia en el cierre, no como política.

---

## 4. Dashboard de Métricas

### 4.1 KPIs Semanales

**Bloque A — Pipeline y Ventas (revisar cada Lunes)**

| Métrica | Descripción | Benchmark objetivo |
|---------|-------------|-------------------|
| Outreach semanal | Número de prospectos contactados por primera vez | 20–30 en Meses 1–2, 10–15 en Meses 3–6 |
| Demo rate | % de outreach que acepta demo | >15% warm, >5% cold |
| Demo-to-Proposal | % de demos que generan propuesta enviada | >50% |
| Proposal-to-Close | % de propuestas que cierran | >30% |
| Pipeline total | Valor total de oportunidades abiertas (MRR potencial) | 3x el objetivo de MRR del mes |
| MRR nuevo | MRR agregado en la semana | Ver metas por mes abajo |
| Churn MRR | MRR perdido en la semana | <2% del MRR total mensual |

**Bloque B — Producto y Uso (revisar cada Miércoles)**

| Métrica | Descripción | Benchmark objetivo |
|---------|-------------|-------------------|
| Análisis completados | Total de análisis end-to-end completados en la plataforma | Crecimiento WoW de 10%+ |
| Tasa de completado del análisis | % de usuarios que inician y completan el flujo | >80% |
| Error rate en foto | % de fotos rechazadas por baja calidad | <15% |
| Tiempo de análisis (p95) | Percentil 95 del tiempo de respuesta del SAE | <20 segundos |
| PDFs generados / análisis | Ratio de PDFs enviados por análisis completado | >90% |
| DAU/MAU por tenant | Frecuencia de uso del dashboard B2B | >30% (activos semanalmente) |

**Bloque C — Retención y Expansión (revisar cada Viernes)**

| Métrica | Descripción | Benchmark objetivo |
|---------|-------------|-------------------|
| Gross churn rate | % de clientes que cancelan en el mes | <5% mensual |
| Net Revenue Retention (NRR) | MRR retenido + expansión / MRR inicial del mes | >110% |
| Clientes en riesgo | Clientes sin uso en últimos 7 días | 0 en Meses 1–3 (base pequeña) |
| NPS (mensual) | Pregunta de 1 pregunta al día 30 y día 90 | >50 |
| Upgrades | Clientes que suben de plan en el mes | 1+ a partir de Mes 4 |
| Referidos generados | Nuevos leads provenientes de link de referido | >20% del pipeline en Mes 4+ |

---

### 4.2 Metas de MRR por Mes

| Mes | Clientes nuevos | MRR nuevo | MRR acumulado | MRR objetivo acumulado |
|-----|----------------|-----------|---------------|------------------------|
| Mes 1 | 2 | R$980 | R$980 | R$1.000 |
| Mes 2 | 2 | R$980 | R$1.960 | R$2.500 |
| Mes 3 | 2 | R$1.960 | R$3.920 | R$5.000 |
| Mes 4 | 3 | R$2.940 | R$6.860 | R$9.000 |
| Mes 5 | 4 | R$5.920 | R$12.780 | R$16.000 |
| Mes 6 | 5 | R$7.450 | R$20.230 | R$25.000 |
| Mes 12 | — | — | R$50.000 | R$50.000 |

*Asumiendo: mezcla 70% Starter (R$490) + 30% Growth (R$1.490), churn <5% mensual, sin Enterprise en primeros 6 meses.*

---

### 4.3 Red Flags y Disparadores de Acción

| Red Flag | Umbral | Acción inmediata |
|----------|--------|-----------------|
| Demo rate <5% (warm) | Semana 2+ | Revisar mensaje de outreach. A/B test 2 versiones nuevas. |
| Proposal-to-Close <20% | Mes 1 | Escuchar grabaciones de demos. Identificar objeción recurrente. Ajustar script. |
| Tasa de completado <70% | Cualquier semana | Revisar en Hotjar / PostHog donde se abandona. Fix de UX en 48h. |
| Cliente sin uso en 7 días | Primer mes del cliente | Llamada de check-in inmediata. No esperar al día 30. |
| Churn en Mes 1–3 | 1 cliente cancela | Llamada de post-mortem. Entender si es precio, producto, o falta de uso. |
| NPS <30 | Encuesta mes 1 | No escalar ventas hasta entender el problema. El boca a boca negativo mata más que el churn. |
| Pipeline coverage <2x MRR objetivo | Cualquier mes | Duplicar outreach esa semana. Activar canal nuevo (ej: sumar LinkedIn si solo se usó WhatsApp). |
| Latencia SAE >20s en p95 | Cualquier semana | Revisar logs de Claude API. Activar cache agresivo. Escalar Redis. |

---

## 5. Sales Playbook

### 5.1 Ideal Customer Profile (ICP) por Segmento

**ICP 1 — Clínica Dermatológica (Segmento Prioritario)**

| Atributo | Descripción |
|----------|-------------|
| Tamaño | 2–8 dermatólogos, 1 encargado comercial o de ventas |
| Ubicación | São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba |
| Modelo | Clínica con venta de productos propia (no solo procedimientos) |
| Señales de fit | Instagram activo con foco en skincare, precios de productos en bio, ya usa algún SaaS (agenda online, software de gestión) |
| Señales de NO fit | Solo procedimientos (botox, laser), sin venta de productos, sin presencia digital |
| Decisor | El médico-dueño o el socio con responsabilidad comercial |
| Trigger de compra | "Mis pacientes no siguen el protocolo" / "Vendo poco comparado con lo que recomiendo" |
| Ticket promedio | R$490–R$1.490/mes (Starter o Growth) |
| CAC objetivo | <R$300 (2 meses de payback en Starter) |

**ICP 2 — Farmacia Dermatológica**

| Atributo | Descripción |
|----------|-------------|
| Tamaño | Farmacia independiente o pequeña red (1–5 unidades) con sección dedicada a dermocosméticos |
| Ubicación | Centros urbanos, barrios de clase media-alta |
| Modelo | Venta de marcas dermatológicas (La Roche-Posay, Vichy, Avène, etc.) + manipulación propia |
| Señales de fit | Tiene farmacéutico o cosmetólogo disponible para atención personalizada, espacio físico con área de consulta de piel |
| Señales de NO fit | Farmacia de conveniencia o genéricos, sin foco en skin |
| Decisor | Dueño de la farmacia o gerente de la sección de dermocosméticos |
| Trigger de compra | "Quiero diferenciarme de las farmácias grandes con tecnología" / "Tengo mucho tráfico pero bajo ticket" |
| Ticket promedio | R$490/mes (Starter) — más sensible al precio |
| CAC objetivo | <R$200 |

**ICP 3 — Laboratorio / Marca de Dermocosméticos**

| Atributo | Descripción |
|----------|-------------|
| Tamaño | Laboratorio pequeño-mediano con catálogo propio de 20–200 productos, venta D2C o a través de canales |
| Ubicación | São Paulo principalmente (polo industrial cosmético) |
| Modelo | B2B2C — venden a través de distribuidores, farmacias, o directo en e-commerce |
| Señales de fit | Tiene e-commerce propio activo, hace comunicación de ingredientes activos, tiene estructura de marketing |
| Señales de NO fit | Solo vende a distribuidores sin contacto con el consumidor final |
| Decisor | Director de marketing, gerente de e-commerce, o dueño en empresas pequeñas |
| Trigger de compra | "Quiero aumentar la conversión en mi e-commerce con personalización" / "Quiero que el distribuidor tenga herramientas de venta digitales" |
| Ticket promedio | R$1.490–Enterprise |
| CAC objetivo | <R$1.500 (LTV alto, contrato anual posible) |
| Ciclo de venta | 4–8 semanas (requiere aprobación de múltiples personas) |

---

### 5.2 Manejo de Objeciones

**Objeción 1: "Já temos uma solução parecida / usamos um quiz manual"**

Respuesta:
"Entendo. A diferença principal é que um quiz manual recomenda categorias — Skinner recomenda os seus produtos específicos, com justificativa clínica, e gera um PDF com sua marca que o paciente guarda. Além disso, você vê no dashboard qual produto foi mais recomendado e qual efetivamente foi vendido — rastreamento que um quiz manual não oferece. Posso mostrar a diferença em 10 minutos?"

**Objeción 2: "R$490 por mês é caro para o que faz"**

Respuesta:
"Faz sentido questionar. Vamos calcular juntos: se um paciente compra em média R$150 em produtos por visita, e a Skinner ajuda a converter 3 clientes extras por semana — são R$600 de receita nova. No mês, R$2.400. O custo do Starter é R$490. O ROI já cobre no primeiro mês com menos de 4 vendas incrementais. Isso parece razoável para o seu volume?"

**Objeción 3: "Não tenho tempo para implementar isso agora"**

Respuesta:
"O onboarding leva 45 minutos — eu faço com você. Depois disso, você não precisa fazer nada: o paciente acessa pelo celular sozinho. O que mais você está gerenciando hoje que toma mais de 45 minutos e gera menos resultado? Posso reservar uma sessão para esta semana ou a próxima — qual horário funciona?"

**Objeción 4: "Tenho medo de que a IA dê uma recomendação errada ao paciente"**

Respuesta:
"É uma preocupação legítima e importante. A Skinner não diagnostica doenças — recomenda produtos do seu catálogo com base nas características da pele do paciente. O disclaimer médico que aparece no relatório deixa claro que é uma sugestão, não uma prescrição. Você configura quais condições a plataforma pode mencionar e quais ficam restritas. O controle é seu, não da IA. Posso mostrar como funciona essa configuração?"

**Objeción 5: "Como sei que os dados dos meus pacientes estão seguros?"**

Respuesta:
"Boa pergunta. As fotos são processadas e descartadas após a análise — não são armazenadas. Os dados ficam em servidores no Brasil (Supabase, certificado ISO 27001), e a plataforma é compliant com LGPD. Cada paciente dá consentimento explícito antes de iniciar. Posso enviar nossa política de privacidade e um resumo técnico de segurança se quiser revisar com calma."

**Objeción 6: "Prefiro esperar que tenga más clientes / sea más estable"**

Respuesta:
"Entendo a cautela. O que posso dizer é que os clientes que entram agora estão moldando o produto — seu feedback vai diretamente para o roadmap. Além disso, o preço atual é o mais baixo que vai existir. Não é pressão — mas vale considerar: o que você precisa ver funcionando para se sentir confortável em começar?"

---

### 5.3 Framework de Calculadora de ROI para Prospectos

Usar esta calculadora durante la demo o enviarla en el email post-demo. Pedirle al prospecto que complete sus propios números.

**Variables de entrada (el prospecto completa):**
- A = Número de pacientes/clientes atendidos por semana
- B = % de pacientes que actualmente compran algún producto recomendado (estimado)
- C = Ticket promedio de compra de productos (R$)
- D = Plan elegido de Skinner (R$490 o R$1.490/mes)

**Cálculo:**

```
Clientes que compran hoy (por semana)     = A × B
Clientes que compran hoy (por mes)        = (A × B) × 4

Con Skinner (asumiendo +25% conversión):  
Clientes adicionales que compran (mes)    = (A × B × 4) × 0,25

Ingreso adicional mensual estimado        = Clientes adicionales × C
ROI mensual                               = Ingreso adicional - D
Payback (días)                            = D / (Ingreso adicional / 30)
```

**Ejemplo con números reales:**
- 40 pacientes/semana → 160/mes
- 20% compra productos hoy → 32 compradores/mes
- Ticket promedio R$180
- Con Skinner: +25% conversión = 8 compradores adicionales/mes
- Ingreso adicional: 8 × R$180 = R$1.440/mes
- Plan Starter: R$490/mes
- **Resultado: R$950 de beneficio neto mensual. Payback en 10 días.**

**Variaciones conservadoras para no sobrevender:**
- Usar +15% de incremento en conversión si el prospecto es escéptico (en lugar de +25%)
- Aclarar: "Este cálculo asume que Skinner contribuye directamente a las ventas. Los primeros resultados reales tardan 30–45 días mientras los pacientes se acostumbran al flujo."

---

### 5.4 Template de Caso de Estudio

*Usar después de que el cliente tenga 60+ días activos y resultados medibles.*

**Estructura del caso de estudio (600–800 palabras para blog, 1 página para PDF comercial):**

---

**Título**: "[Nombre del cliente] aumentou [X]% nas vendas de dermocosméticos com análise de pele por IA"

**Perfil del cliente:**
- Nombre / tipo de negocio
- Número de profesionales / tamaño
- Ubicación
- Productos vendidos / especialidad

**El desafio antes de Skinner:**
- ¿Qué problema tenían? (En palabras del cliente, citar directamente)
- ¿Qué solución estaban usando antes?
- ¿Por qué buscaban algo diferente?

**Por qué eligieron Skinner:**
- ¿Qué fue lo que convenció al decisor?
- ¿Cómo fue el proceso de decisión?
- ¿Cuánto tardó en implementarse?

**Implementación:**
- Tiempo de onboarding (en días)
- Número de productos cargados al catálogo
- Cómo lo integran en el flujo de atención

**Resultados (con números reales):**
- Incremento en ventas de productos (% o R$)
- Número de análisis realizados en 60 días
- % de conversión del análisis a compra (si trackeable)
- Feedback de los pacientes/clientes finales
- Algún resultado cualitativo inesperado

**La voz del cliente (cita directa, 2–3 frases):**
> "[Cita textual del responsable de la clínica/farmacia/laboratorio]"
> — [Nombre], [Cargo], [Nombre de la empresa]

**Lo que sigue:**
- ¿Están expandiendo el uso? ¿Van a hacer upgrade de plan?
- ¿Qué features esperan en el futuro?

---

*Nota: Obtener aprobación escrita del cliente antes de publicar. Ofrecer el caso como beneficio para ellos también (visibilidad de su negocio).*

---

## Apéndice — Mapa de Prioridades por Semana (Resumen Ejecutivo)

| Semana | Foco principal | Métrica clave |
|--------|---------------|---------------|
| -2 | Beta testing + fixes P0 | 0 bugs P0 al finalizar |
| -1 | Fixes P1 + onboarding materiales | Checklist onboarding listo |
| 1 | CRM + lista de prospectos + primeros 10 outreach | 10 contactados |
| 2 | Primeras demos + propuestas | 3+ demos realizadas |
| 3 | Cierre del primer cliente + escalar outreach | 1 cliente activo |
| 4 | Cierre 2do cliente + retrospectiva | 2 clientes activos |
| 5–8 | Activar blog + partnerships + referidos | 5 clientes acumulados |
| 9–12 | Escalar canal que funciona + primeros casos de estudio | 8–10 clientes acumulados |
| Mes 6 | NRR >110%, pipeline 3x, blog con tráfico orgánico | R$20K+ MRR |

---

*Documento generado: Abril 2026 — Skinner Growth Strategy v1.0*  
*Revisar y actualizar al cierre de cada mes con datos reales.*
