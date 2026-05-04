# Prompt — One-Pager Comercial Skinner (PDF para Leads)

Copiá y pegá este prompt en Claude Code. Reemplazá las variables `{{...}}` antes de ejecutar.

---

## VARIABLES

- `{{NOMBRE_CLIENTE}}`: Nombre de la clínica/marca (ej: "Clínica Estética Bella Vita")
- `{{CONTACTO}}`: Nombre del decisor (ej: "Dra. Camila Souza")
- `{{CIDADE_UF}}`: Ciudad/Estado (ej: "São Paulo, SP")
- `{{FECHA}}`: Fecha de la propuesta (ej: "10 de mayo de 2026")
- `{{PLAN_RECOMENDADO}}`: `growth` | `pro` | `enterprise`
- `{{PRECIO_FINAL_MENSAL}}`: Precio negociado mensual en BRL (ej: "R$ 1.290")
- `{{SETUP_FINAL}}`: Setup negociado en BRL (ej: "R$ 1.990" — o "Cortesía" si fue waiveado)
- `{{LIMITE_ANALISES}}`: Cantidad de análisis/mes (ej: "500")
- `{{COMISION}}`: % de comisión (ej: "2,5%")
- `{{VIGENCIA}}`: Días de validez de la oferta (ej: "15 días")
- `{{NOTAS_CUSTOM}}`: Cualquier condición especial negociada (texto libre, opcional)

---

## PROMPT

Necesito que generes un **one-pager comercial en PDF** para enviar a un lead de Skinner. Una sola página, look editorial, tipo "term sheet" premium. Output final: archivo `.pdf` en `/Users/nicolascapozzi/skinner/outputs/propuestas/`.

**Reglas estrictas (no negociables):**

1. Lee primero `/Users/nicolascapozzi/skinner/CLAUDE.md` y respeta SIEMPRE el branding: colores (Blanc Casse `#F7F3EE`, Carbone `#1C1917`, Pierre `#7C7269`, Sable `#C8BAA9`, Ivoire `#EDE6DB`, Terre `#3D342C`), tipografía (Lora serif para títulos, Poppins Light para body), tono editorial preciso, sin emojis, sin signos de exclamación, sin esquinas redondeadas, divisores finos, labels en uppercase con tracking ancho.
2. Usá la skill `pdf` para generar el archivo. NO uses pypdf.
3. El PDF debe caber en UNA sola página A4. Si no entra, comprimí texto, NO partas en dos páginas.
4. Todo el texto en portugués brasileño (este lead es BR).
5. Incluí el logo: `/Users/nicolascapozzi/skinner/apps/web/public/brand/logo-primary.png` arriba a la izquierda.

**Estructura del one-pager (de arriba hacia abajo):**

### 1. Header (15% de la página)
- Logo Skinner (izquierda)
- Tagline "Skin Tech" (debajo del logo, label uppercase, tracking ancho, color Pierre)
- Fecha `{{FECHA}}` y "Proposta Comercial — Confidencial" (derecha, label uppercase pequeño)
- Divisor fino horizontal (1px, color Sable)

### 2. Destinatário (5%)
Bloque de 3 líneas, alineado izquierda:
- `Para:` `{{NOMBRE_CLIENTE}}` (Lora bold)
- `A/C:` `{{CONTACTO}}` (Poppins Light)
- `Local:` `{{CIDADE_UF}}` (Poppins Light, color Pierre)

### 3. Headline + bajada (10%)
- Título grande en Lora: "Análise de pele com IA, em minutos. Recomendação clínica baseada em evidências."
- Bajada en Poppins Light, color Pierre, 2 líneas máximo: explicá que Skinner combina IA + dermatología clínica para que cada paciente reciba un protocolo personalizado y la clínica capture leads cualificados.

### 4. Tabela de Planos (35%)
Tabla limpia, sin bordes externos, solo divisores horizontales finos color Sable. Tres columnas: **Growth | Pro | Enterprise**. Filas:

| | Growth | Pro | Enterprise |
|---|---|---|---|
| Análises/mês | 200 | 1.000 | Negociado |
| Comissão por venda | 3% | 2% | Negociada |
| Usuários | 3 | 10 | Ilimitado |
| Mensalidade | R$ 490 | R$ 1.490 | Custom |
| Setup (one-time) | R$ 990 | R$ 2.490 | Custom |
| Suporte | E-mail | Prioritário | Dedicado |

Marcá visualmente la columna `{{PLAN_RECOMENDADO}}` con un fondo Ivoire muy sutil y un label uppercase arriba: "RECOMENDADO PARA VOCÊ".

### 5. Sua proposta personalizada (20%)
Caja destacada con fondo Ivoire, padding generoso, sin esquinas redondeadas. Adentro:

- Label uppercase: "PROPOSTA NEGOCIADA — {{NOMBRE_CLIENTE}}"
- Grid de 4 cuadrantes (2x2):
  - **Mensalidade**: `{{PRECIO_FINAL_MENSAL}}` (número grande Lora)
  - **Setup**: `{{SETUP_FINAL}}`
  - **Limite mensal**: `{{LIMITE_ANALISES}} análises`
  - **Comissão**: `{{COMISION}}`
- Línea inferior con `{{NOTAS_CUSTOM}}` si está presente. Si no, omitir.
- Pie de la caja: "Proposta válida por {{VIGENCIA}} a partir de {{FECHA}}."

### 6. Próximos passos (10%)
Tres pasos numerados en línea horizontal (1 → 2 → 3), texto corto:
1. Aprovação da proposta
2. Onboarding técnico (catálogo + branding) — 5 dias úteis
3. Go-live e treinamento da equipe

### 7. Footer (5%)
- Divisor fino Sable
- Línea pequeña en Poppins Light, color Pierre: "Skinner — Skin Tech · skinner.lat · contato@skinner.lat"
- Alineado al centro

---

**Antes de generar el PDF:**
- Validá que el `{{PLAN_RECOMENDADO}}` sea uno de los tres válidos.
- Si `{{SETUP_FINAL}}` es "Cortesía" o "0", mostrá un sello pequeño "SETUP WAIVED" en el cuadrante.
- Si `{{NOTAS_CUSTOM}}` está vacío, no generes la línea.
- Nombre del archivo: `Skinner-Proposta-{{NOMBRE_CLIENTE_SLUG}}-{{FECHA_YYYY-MM-DD}}.pdf` (slug en kebab-case sin acentos).

**Después de generar:**
- Devolvé el link `computer://` al PDF generado.
- Resumí en 3 bullets máximo: plan recomendado, precio total año 1 (12 × mensalidade + setup), y validez de la oferta.

No agregues nada más. No expliques el branding. No pidas confirmación intermedia — generá el PDF directo.
