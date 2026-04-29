# Skinner - Project Rules

## Critical Rules

1. **Never change structural architecture** - Do not modify the monorepo structure, database provider, auth system, or multi-tenant isolation without explicit approval.
2. **Never change business rules** - Pricing, commission rates, plan limits, analysis pipeline logic, and LGPD compliance rules must not be altered without explicit approval.
3. **Never break existing functionality** - All changes must be additive or improve existing features without removing capabilities.
4. **Always check this file before executing tasks.**

## Brand Guidelines

- **Name**: Skinner (not Skinners)
- **Tagline**: Skin Tech
- **Colors**: Blanc Casse (#F7F3EE), Carbone (#1C1917), Pierre (#7C7269), Sable (#C8BAA9), Ivoire (#EDE6DB), Terre (#3D342C)
- **Fonts**: Lora (serif, headlines), Poppins Light (body/UI)
- **Tone**: Precise, authoritative, warm, editorial. No exclamation marks. No emojis.
- **Logo**: /apps/web/public/brand/logo-primary.png
- **UI Style**: No rounded corners, thin rule dividers, wide tracking on labels, generous spacing

## Tech Stack

- Monorepo: Turborepo + pnpm
- Frontend: Next.js 14 (App Router) at apps/web, port 3015
- Backend: tRPC routers in apps/web/src/server/routers/
- Database: PostgreSQL (Supabase), ORM: Prisma, schema at packages/db/prisma/schema.prisma
- Auth: NextAuth.js with JWT (role + tenantId)
- IA: Claude API (claude-sonnet-4) with mock fallback
- Styling: Tailwind CSS with brand color classes

## Database

- Generated client at packages/db/generated/client (gitignored)
- Seed: packages/db/src/seed.ts + seed-dermatology.ts
- Always run `prisma generate` after schema changes

## Environment Variables

- DATABASE_URL, DIRECT_URL (Supabase Postgres)
- NEXTAUTH_SECRET, NEXTAUTH_URL
- ANTHROPIC_API_KEY (Claude skin analysis)
- GEMINI_API_KEY (Google Gemini - skin projection)
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase Storage bucket: product-images)
- NUVEMSHOP_APP_ID, NUVEMSHOP_CLIENT_SECRET, NUVEMSHOP_CALLBACK_URL
- SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_CALLBACK_URL
- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (rate limiting)

## Rate Limits

- `analysis.run` (tRPC mutation): 10 requests per IP per hour (sliding window)
- `/api/projection`: 3 requests per IP per hour (sliding window, expensive ~$0.12/call)
- Falls back to no-op limiter when Upstash not configured (dev)
- Returns 429 with Portuguese message when exceeded

## Analysis Pipeline

### Scoring Formula (matcher.ts)
- Concern match: 35% — overlap between detected conditions and product concernTags
- Skin type match: 20% — binary, product has detected skin_type in skinTypeTags
- Objective match: 15% — binary, product has patient objective in objectiveTags
- Severity match: 10% — proximity of product severityLevel to max detected severity
- Ingredient bonus: 20% — product activeIngredients that match commonIngredients from dermatological KB

### Scoring Tiebreakers
- priorityRank (higher first — tenant-controlled ranking on Product model)
- Recommendation count (popularity — more recommendations = higher priority)
- Lower price first (more accessible)

### Routine Diversity
- Matcher picks one product per stepRoutine (cleanser → toner → serum → moisturizer → SPF → treatment)
- First pick per step is tagged `recomendado`, additional products are tagged `alternativa`
- Returns up to 8 products + 2 services

### Contraindication Filtering
- Products with activeIngredients matching avoidIngredients from detected conditions are excluded
- Products with pregnancy/nursing contraindications are excluded when user reports pregnant/nursing
- Sex question controls visibility of pregnancy question (only shown for female)

### Skin Type Discrepancy
- Claude compares self-reported skin_type with observed skin_type from photo
- If different, returns `skin_type_discrepancy` explanation shown to user on results screen

### Prompt Configuration (Admin)
- Base system prompt is hardcoded in `claude-analyzer.ts` (read-only in UI)
- Global rules editable via `/admin/prompt` → stored in `PlatformConfig.analysisGlobalRules`
- Global restricted conditions → `PlatformConfig.analysisRestrictedConditions`
- Per-tenant overrides: `TenantConfig.customPromptSuffix` and `TenantConfig.restrictedConditions`
- Prompt hierarchy: base prompt → KB (conditions + ingredients) → rules → global rules → global restricted → tenant rules → tenant restricted
- Admin can view full prompt preview, KB as injected, and recent analysis raw responses

### Analysis Tone (per-tenant)
- `TenantConfig.analysisTone` controls how patient-facing fields are written by Claude.
- Values: `"humanized"` (default) or `"technical"`.
- `humanized`: Claude translates clinical jargon automatically ("comedões" → "cravos pretos e brancos", "telangiectasias" → "vasinhos visíveis", "ptose" → "perda de firmeza", etc.). Tone: warm, accessible, like an experienced aesthetician talking to her client. Recommended for B2C.
- `technical`: full clinical terminology preserved. For dermatology clinics that prefer medical credibility.
- Affects only patient-facing fields: `summary`, `conditions[].description`, `skin_type_discrepancy`, `action_plan.phaseN`, `timeline.weeksN`, `alert_signs`, `zone_annotations[].observation`. Does NOT affect `analysis.conditions[].name` (which still uses KB IDs for matcher) nor any DB fields.
- Editable via `/dashboard/analise` → "Tom da analise" section (per-tenant, B2B-controlled).
- Implementation: prompt block injected into `claude-analyzer.ts` `systemPrompt` based on `tenantConfig.analysisTone`.

### Patient-Facing Labels (centralized)
- All Portuguese translations of condition names, skin types, objectives, step routines, barrier statuses live in `apps/web/src/lib/sae/labels.ts`.
- `matcher.ts` reasons use `tr()` and `trList()` helpers to translate raw IDs (e.g. "Trata: acne, manchas" instead of "Trata: acne, hyperpigmentation").
- `results-screen.tsx` imports from labels.ts and capitalizes for display headings.
- Adding a new condition or objective: add a row in `labels.ts` and it appears translated everywhere.

### Patient-friendly UI labels in results-screen
- "Estado da sua pele" instead of "Barreira cutânea" (with explanatory sentence below).
- "O que observamos na sua pele" instead of "Condições identificadas".
- "Seu cuidado em 3 fases" / "Começando" / "Avançando" / "Mantendo" instead of "Plano de Ação" / "Fase 1/2/3".
- "Quando consultar um dermatologista" instead of "Sinais de Alerta".

### PDF Report Generation
- Endpoint: `GET /api/report/[analysisId]` — uses `@react-pdf/renderer` Node runtime (NOT Edge).
- Template: `apps/web/src/lib/pdf/report-template.tsx` (`SkinReport` export).
- Brand fonts (Poppins + Lora) registered via `Font.register` from **@fontsource jsdelivr CDN as TTFs** (NOT Google Fonts woff2 subsets — those caused `RangeError: Offset is outside the bounds of the DataView` because the `latin` subset is missing some Portuguese glyphs).
- TTF URLs format: `https://cdn.jsdelivr.net/fontsource/fonts/{family}@latest/latin-{weight}-{style}.ttf`. The `latin` (full) variants include all Portuguese accents (ã, õ, ç, etc.).
- All used `(family, weight, fontStyle)` combinations MUST be registered explicitly — react-pdf does not synthesize italics or weights from regular variants. Currently registered:
  - Poppins: 300 normal, 400 normal, 600 normal, 300 italic, 400 italic
  - Lora: 400 normal, 700 normal, 400 italic
- If you add a new style combo to the template, register it here too or rendering fails server-side with 500 (caught by the route handler and returned as `{"error":"Erro ao gerar relatorio"}`).

### Results page layout (responsive widths)
- Container in `results-screen.tsx`: `max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl` (mobile-first, widens at md/lg/xl breakpoints) so desktop uses available width without stretching mobile.
- Mapa Facial + Radar Chart: rendered side-by-side on `lg+` via `grid-cols-1 lg:grid-cols-2`.
- Conditions, Recommended Products, Recommended Services: `grid-cols-1 md:grid-cols-2 gap-3` — 2 columns on tablets and up.
- Skin projection (3 photos atual/8wk/12wk): grid stays at `grid-cols-1 md:grid-cols-3` but uses `gap-4 md:gap-5 lg:gap-6` and slightly larger typography (`lg:text-lg`, `lg:text-sm`) at desktop so descriptions don't get cramped.
- Mobile (<768px) layout is unchanged — single column everywhere.

### B2B Analytics Dashboard
- Page: `/dashboard` (`apps/web/src/app/(dashboard)/dashboard/page.tsx`).
- Backend: `dashboardRouter` (`apps/web/src/server/routers/dashboard.ts`) — all queries scoped to `ctx.tenantId` via `tenantProcedure`. Period filter accepts `days` 1–365.
- Sections rendered: ROI overview, plan usage bar, monthly trend (6m), geo distribution (region + top cities), patient profile (skin type / age / objective), top conditions + barrier, skin-type discrepancy index, top products + catalog gaps, **conversion lift por perfil** (compares each segment's conversion rate vs the tenant baseline; min 3 patients per segment), **sazonalidade** (12-month heatmap of top conditions), engagement (PDF download / email rate).
- Pre-aggregates server-side; UI consumes pre-computed numbers + simple horizontal bars + CSS heatmap (no chart lib).
- **Export CSV** button in the header pulls `dashboardRouter.exportSnapshot` and builds a multi-section CSV (summary + per-analysis detail + catalog) client-side. UTF-8 BOM included so Excel reads accents correctly. File name: `skinner-dashboard-{YYYY-MM-DD}-{days}d.csv`.

### Geo capture (LGPD-friendly)
- `Analysis.clientCountry/clientRegion/clientCity` are auto-populated from request headers when an analysis is saved (`getClientGeo` in `apps/web/src/lib/rate-limit.ts`).
- Vercel headers used: `x-vercel-ip-country`, `x-vercel-ip-country-region`, `x-vercel-ip-city`. Cloudflare equivalents (`cf-ipcountry`, `cf-region-code`, `cf-ipcity`) used as fallback.
- We never persist the raw IP — only city/region/country. Missing headers → fields stay null and analytics groups them as "Desconhecido".
- City names are URL-decoded (Vercel encodes them).

### Skin Projection (Gemini)
- Generates 2 images: 8 weeks (-50%) and 12 weeks (-80%) improvement
- Uses Gemini 2.5 Flash Image model (~$0.12 per call, rate limited to 3/hour/IP)
- Receives: patient photo, detected conditions, primary objective, AND recommended products with activeIngredients
- Prompt template editable via `/admin/prompt` → "Projecao de Imagem" tab → stored in `PlatformConfig.projectionPromptTemplate`
- Template variables: {intensityLabel}, {weeks}, {objective}, {conditionsList}, {conditionEdits}, {productsSection}
- Falls back to DEFAULT_PROMPT_TEMPLATE when custom template is empty

### Data-driven SAE — automatic propagation of new conditions
- `SkinCondition.visualEditPrompt` (Prisma field) holds the Gemini visual edit instruction per condition. Use `{intensity}` as placeholder (replaced at runtime with `50` at week 8 and `80` at week 12).
- `gemini-projection.ts` resolves the visual prompt for each detected condition in this order:
  1. `SkinCondition.visualEditPrompt` from the DB (editable via `/admin` or seed)
  2. Auto-generated prompt from `displayName + description` if the condition exists in the KB but has no `visualEditPrompt`
  3. Generic fallback `Improve {name} by approximately {intensity}%` when the condition is not in the KB
- `mock-analyzer.ts` reports any concern from the questionnaire by combining a hardcoded baseline map with a live KB lookup, so concerns added in `/admin/formulario` are reflected in the mock analysis without code changes (assuming a matching `SkinCondition` row).
- **To add a new concern/objective end-to-end (no code changes):**
  1. Add the option in `/admin/formulario` → `concerns` and/or `primary_objective` (the option `value` becomes the condition `name`).
  2. In `/admin/dermatologia` → tab "Condições" → click "Nova Condição". Fill `name` = the option value, `displayName`, `description`, `category`, severities, recommended/avoid ingredients, and **`visualEditPrompt`** (in English, with `{intensity}` placeholder).
  3. Optionally tag products in the catalog with `concernTags`/`objectiveTags` containing the new value so the matcher recommends them.
  4. No changes in `gemini-projection.ts`, `claude-analyzer.ts`, `mock-analyzer.ts`, or `matcher.ts` — they all read dynamically from the DB.
- **To edit the visual prompt of an existing condition:** `/admin/dermatologia` → click "Editar prompt visual" on the row → save. Effects are live on the next analysis (no deploy needed).
- The condition list in `/admin/dermatologia` shows a badge per row indicating whether `visualEditPrompt` is set (✓ green) or missing (amber). Missing prompts fall back to auto-generation from `displayName + description`.

### Recognized Conditions (questionnaire IDs ↔ KB)
- Questionnaire `concerns` and `primary_objective` use simple lowercase IDs. Currently seeded with `visualEditPrompt`: `acne`, `hyperpigmentation`, `aging`, `dehydration`, `sensitivity`, `rosacea`, `pores`, `dullness`, `dark_circles`, `oiliness`, `sagging`.
- The clinical dermatology KB (`packages/db/src/seed-dermatology.ts`) uses Portuguese clinical names (e.g. `envelhecimento_cronologico`). Coexists with the simple IDs — both are valid `SkinCondition` rows. Matcher and Gemini work with whichever names Claude/the questionnaire actually emit.
- `sagging` (Flacidez): structural condition with its own KB entry (categoría `structural`). Visual prompt lifts jawline, jowls, neck, midface.

### Seeding & Schema Sync
- Seed is idempotent (`upsert` by name in both `seed.ts` and `seed-dermatology.ts`). Safe to re-run any time.
- After editing schema → run `pnpm --filter @skinner/db db:push` (applies to Supabase) followed by `pnpm --filter @skinner/db db:seed` (re-seeds idempotently).
- After editing only seed values (e.g. visualEditPrompt for an existing condition) → run `pnpm --filter @skinner/db db:seed` only.
- `seed.ts` uses `update: condition` in upsert (NOT `update: {}`) so re-seeding actually updates existing rows. Don't change this.

## Questionnaire System

- Questionnaire is dynamic — questions stored as JSON in `PlatformConfig.questionnaireConfig`
- Admin manages via `/admin/formulario` — add, edit, reorder, enable/disable questions
- Core questions (sex, skin_type, concerns, primary_objective) cannot be deleted — their IDs are used by the analysis engine
- `QuestionnaireAnswers` type is `Record<string, string | string[]>` (not fixed keys)
- `AnalysisInput.questionnaire` accepts any string keys
- Fallback: if PlatformConfig has no config, uses hardcoded DEFAULT_QUESTIONS
- Conditional display: questions can have `showCondition` (e.g. pregnancy only shown when sex=female)
- TenantConfig toggles (questionAllergiesEnabled, etc.) still work as per-tenant overrides

## Stripe Billing

- Real Stripe integration when `STRIPE_SECRET_KEY` is set, mock otherwise
- Checkout: `POST /api/billing/checkout` → creates Stripe Checkout Session → redirects to Stripe
- Portal: `POST /api/billing/portal` → creates Stripe Customer Portal session
- Webhook: `POST /api/billing/webhook` → receives checkout.session.completed, subscription.updated/deleted, invoice.paid
- Price IDs: starter=price_1TQH3RPTPxVx2t2Rg4i8jPOZ, growth=price_1TQH7WPTPxVx2t2RQkmaIDRY
- Enterprise plan has no Stripe price (custom pricing, handled manually)
- Self-service signup flow: /planos → Stripe Checkout (no auth needed) → webhook creates tenant + user + subscription
- Webhook generates temp password, sends welcome email via Resend with login link (app.skinner.lat/login)
- Existing tenant upgrade: dashboard → Stripe Checkout → webhook updates plan
- On subscription cancel: tenant status set to "paused"
- Email: Resend API (RESEND_API_KEY). Falls back to console.log when not configured
- Environment: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL

## Conventions

- All user-facing text in Portuguese (Brazilian)
- Tailwind classes use brand color names: text-carbone, bg-blanc-casse, border-sable/20, etc.
- Buttons: bg-carbone text-blanc-casse (primary), border border-sable text-terre (secondary)
- Labels: text-[10px] text-pierre uppercase tracking-wider font-light
- Headings: font-serif text-carbone
- Body: text-sm text-pierre font-light
