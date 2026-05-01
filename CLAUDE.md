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
- **Brazil tile map**: pure inline SVG, no external lib. Each state is a fixed-grid cell (NYT/FT-style abstraction — geographic accuracy traded for legibility and bundle size). Color intensity scales with the state's analysis count. Adding a state requires editing `BR_GRID` in `dashboard/page.tsx`.
- **Personas**: heuristic clustering by `(sex × ageRange × topConcern × skinType)`. Top-6 buckets with ≥2 patients each are surfaced. We avoid k-means/ML clustering because the resulting clusters would be opaque to a B2B operator — heuristic personas stay interpretable and actionable.

### Cross-tenant Benchmark (privacy-first)
- `TenantConfig.benchmarkOptIn Boolean @default(false)` — off by default. Toggle in `/dashboard/analise` → "Benchmark da plataforma".
- `dashboardRouter.platformBenchmark` returns aggregated averages (completion rate, conversion rate, avg ticket) across **opt-in tenants only**. Requires **min 3 contributing tenants with data in the period** to expose any number — protects against de-anonymization in small pools.
- Returns `{ optedIn, eligible, contributingTenants, avgCompletionRate, avgConversionRate, avgTicket }`.
- UI shows 3 side-by-side comparison cards (Você vs Plataforma) with delta colored green/pierre/terre.
- Never exposes per-tenant rows. Never exposes raw data. Cross-tenant queries explicitly filter by `benchmarkOptIn: true`.

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
- **Plan IDs (renamed Apr-2026)**: previously `starter`/`growth`, now `growth`/`pro`. The internal plan keys, the Stripe products, the public site, the admin UI and the DB are all consistent on the new names.
  - `growth` → recurring `price_1TRwEKAFYuZWxKCyOL5onvKK` (R$ 490/mo, 200 analyses, 3% commission)
  - `pro` → recurring `price_1TRwFsAFYuZWxKCyWuHui0r8` (R$ 1.490/mo, 1.000 analyses, 2% commission)
  - `enterprise` → custom-priced, no Stripe price
- **Setup fees** (one-time, charged on signup only — NOT on upgrade):
  - `growth` setup → `price_1TRwKuAFYuZWxKCyKjlq990r` (R$ 990 one-time)
  - `pro` setup → `price_1TRwLCAFYuZWxKCy1knwa7Kh` (R$ 2.490 one-time)
  - Setup is appended as a second `line_item` in the signup checkout. Upgrades use a single `line_item` (no setup re-charge).
  - Admin can waive the setup per tenant via `Tenant.skipSetupFee` (default `false`). Currently this flag is set programmatically (e.g. by the `/api/billing/checkout` endpoint when `body.skipSetupFee=true`) and persisted by the webhook handler. The admin-facing UI to flip the waiver during custom-plan creation is a Sprint 2 item.
- Self-service signup flow: /planos → Stripe Checkout (no auth needed, mixed line_items: recurring + setup) → webhook creates tenant + user + subscription
- Webhook generates temp password, sends welcome email via Resend with login link (app.skinner.lat/login)
- Existing tenant upgrade: dashboard → Stripe Checkout (single recurring line_item, NO setup) → webhook updates plan
- On subscription cancel: tenant status set to "paused"
- Email: Resend API (RESEND_API_KEY). Falls back to console.log when not configured
- Environment: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL

### Webhook security and reliability
- **Signature verification is MANDATORY in production**. If `STRIPE_WEBHOOK_SECRET` is missing while `NODE_ENV=production`, the endpoint returns 500 immediately and refuses to process events. Dev mode allows unverified parsing for `stripe trigger` testing without the relay.
- **Idempotency** is enforced via the `WebhookEvent` table: every incoming event ID is dedup-checked before any handler runs, so Stripe retries (timeout, 5xx) don't double-charge / double-create. Falls open (continues processing) if the dedupe write itself fails — inner handlers use upserts so row-level idempotency still holds.
- **Events handled**: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`. Add new ones in the switch in `apps/web/src/app/api/billing/webhook/route.ts`.

### Failure handlers
- **`invoice.payment_failed`**: 1st attempt → subscription.status = `past_due`, tenant stays active (Stripe retries automatically). 2nd attempt or later → tenant.status = `paused`. Logs a `payment_failed` UsageEvent.
- **`charge.refunded`**: tenant.status = `paused` immediately. Full refund → subscription.status = `canceled` AND best-effort cancel in Stripe to stop further billing. Partial refund → keeps subscription, admin must re-activate manually. Logs a `refund` UsageEvent.
- **`invoice.paid` recovery**: if the subscription was previously `past_due` and a payment finally succeeds, both subscription and tenant are restored to `active` automatically.

### Period reset on renewal
- `handleInvoicePaid` checks `invoice.billing_reason`. When equal to `subscription_cycle` (recurring renewal), it resets `tenant.analysisUsed = 0` and syncs `Subscription.currentPeriodStart`/`End` from the invoice line item's `period`. Signups (`subscription_create`) and upgrades (`subscription_update`) skip the reset because the tenant either started at 0 or is mid-period and shouldn't lose accumulated usage.
- This replaces the originally-planned monthly cron — Stripe is the single source of truth for "when a period starts", so we piggyback on its events rather than running a parallel scheduler.

### Limit-reached behavior
- Public `analysis.run` mutation throws `FORBIDDEN` with a Portuguese message ("Esta clinica atingiu o limite mensal de analises...") when `tenant.analysisUsed >= tenant.analysisLimit`. The patient-facing error UI surfaces it at the end of the questionnaire.
- B2B panel **stays accessible** when over limit — the dashboard, catalog, reports, billing all still load. Only public analysis creation is blocked.
- No automatic overage billing today: `excessCostPerAnalysis` exists in the schema for future per-analysis billing but currently behaves as a soft cap. A customer either upgrades plan or waits for the next cycle.

### Webhook signup atomicity
- `checkout.session.completed` (new signup branch) creates Tenant + User + Subscription inside a single `db.$transaction`. A partial failure rolls everything back so we never end up with an orphan user pointing to a half-created tenant. Stripe `subscriptions.update` (metadata write-back) and the Resend welcome email run AFTER the commit because they are external side effects we don't want rolled back if a transient error happens later.

### Custom plan flow (admin-quoted, mano-a-mano)
- Library: `apps/web/src/lib/billing/custom-checkout.ts` exports `buildCustomCheckout({ email, monthlyPriceBRL, analysisLimit, commissionRate, maxUsers, skipSetupFee, planLabel })`. Creates a Stripe **Price** ad-hoc (BRL, recurring monthly) and a Checkout Session that embeds the negotiated limits in `metadata`.
- Admin endpoint: `POST /api/billing/admin-link` (gated by `getToken().role === "skinner_admin"`) accepts the same shape, validates with Zod, returns `{ url }`.
- Admin UI: `/admin/tenants/novo-custom` (form: email, R$ mensal, analysisLimit, commission %, maxUsers, "Waivear setup" checkbox, planLabel). Generates the link, offers copy/WhatsApp/open buttons. CTA "Novo Plano Custom" added to `/admin/tenants` header next to "Novo Tenant".
- **Internal plan tier convention**: custom plans set `planId = "enterprise"` in Stripe metadata. We deliberately reuse the enterprise label so we don't need to introduce a 4th tier in `PLANS` and propagate it across z.enums in 5 routers. Negotiated limits live on Tenant columns (`analysisLimit`, `commissionRate`) — independent of `PLANS` — so the actual sold values flow through unchanged. Display name in the UI shows "Enterprise"; a per-tenant `planLabel` override is sprint-2.
- **Webhook handling**: `handleCheckoutCompleted` checks `session.metadata.customAnalysisLimit`; if present, uses negotiated limits instead of `PLANS[planId]`. Custom plans always get `excessCostPerAnalysis = 0` (we sold a fixed monthly volume, no overage to surprise the customer). Standard signups (planId = `growth` / `pro` from `/planos`) are untouched and fall through to PLANS-based limits.

## Self-service account management

- **Schema**: `User.passwordChangedAt DateTime?` is null until the user rotates from the welcome-email temp password (or seed default). Used as the toggle for the temp-password banner. Seed pre-stamps demo users (`admin@skinner.com.br`, `clinica@demo.com`) with `now()` so the banner doesn't fire for the demo.
- **Backend**: `userRouter.updateProfile` (name + email with uniqueness check) and `userRouter.changePassword` (bcrypt-verifies current, hashes new, stamps `passwordChangedAt = now`). Both `protectedProcedure` — operate on the caller's own `userId`. Email change has no confirmation flow yet (sprint-2 hardening).
- **UI**: page `/dashboard/conta` with three sections (Dados pessoais + Alterar senha + Excluir minha conta). Sidebar nav item "Minha Conta". Dashboard home (`/dashboard/page.tsx`) shows an ivoire banner deep-linking to `/dashboard/conta` whenever `me.passwordChangedAt === null`. Banner disappears as soon as the rotation happens.

### Forgot password (email-link reset)
- **Schema**: `PasswordResetToken { tokenHash (sha256 hex, unique), userId, expiresAt, usedAt }`. Plain token never persisted — only the hash, so a DB leak does not yield usable reset tokens.
- **Endpoints**:
  - `POST /api/auth/forgot` — accepts `{ email }`, generates a 256-bit random token, hashes it, stores the hash with 1h expiry, sends the plain token in the email link. **Always returns 200** even when the email doesn't exist (prevents email-enumeration recon). Errors are swallowed for the same reason.
  - `POST /api/auth/reset` — accepts `{ token, newPassword (>=8) }`, hashes the token and looks it up, rejects expired/used tokens, otherwise updates password + stamps `usedAt` + stamps `User.passwordChangedAt = now` inside a transaction.
- **UI**: page `/forgot-password` (email input → "verifique seu email" success state) and page `/reset-password?token=...` (new password + confirm → redirects to `/login`). Both use the immersive landscape background of `/login`. "Esqueci minha senha" link added to the login form.
- **Email**: `buildPasswordResetEmail` in `apps/web/src/lib/email.ts` (Resend, brand-styled). Subject "Skinner — Redefina sua senha".

### Data deletion (LGPD)
- `userRouter.requestDataDeletion` (b2b_admin only). The mutation runs inside `db.$transaction` and:
  1. Anonymizes all analyses of the tenant: drops `patientPhotoUrl`, `questionnaireData`, `clientCity`, `clientRegion`, `clientCountry`. Keeps aggregates (skinType, primaryObjective, conversion linkages) so cross-tenant benchmark queries don't break and historical accounting stays intact.
  2. Anonymizes all users of the tenant: replaces email with `deleted-{tenantId}-{ts}@deleted.local`, replaces name with "Removido", replaces password with the literal string "deleted" (cannot match any bcrypt hash).
  3. Soft-deletes the tenant (`status = "deleted"`). The `tenantProcedure` guard converts this to `UNAUTHORIZED` on the next request, forcing a clean signOut for any open session.
  4. Logs a `data_deletion` UsageEvent with `requestedBy` for audit.
- **Hard delete** is admin-only via `/admin/tenants/[id]` and remains the path for re-using a slug or fully purging records.
- **UI**: "Excluir minha conta" danger-zone section on `/dashboard/conta` with `DELETAR` confirmation text input. After success the client signs out automatically.

## Usage alerts cron

- **Endpoint**: `GET /api/cron/usage-alerts` (auth via `Authorization: Bearer ${CRON_SECRET}` — local dev allowed without if the env var is unset).
- **Schedule**: defined in `apps/web/vercel.json`, daily at `0 12 * * *` (12:00 UTC = 09:00 BRT).
- **Logic**: iterates all `active` tenants, computes `pct = analysisUsed/analysisLimit`. Sends an email to all `b2b_admin` users when:
  - `pct >= 0.80 && pct < 1.0` and no `alert_80` UsageEvent yet in the current period.
  - `pct >= 1.0` and no `alert_100` UsageEvent yet in the current period.
- **Idempotency**: the UsageEvent itself is the flag — once written, the cron skips that tenant for the rest of the period. Period boundary is `Subscription.currentPeriodStart` (or 30-day fallback).
- **Email**: `buildUsageAlertEmail` in `apps/web/src/lib/email.ts`, with different copy + CTA for 80% (preventive) vs 100% (urgency).

## Observability (Sentry)

- `@sentry/nextjs` initialized via `instrumentation.ts` (server + edge) and `sentry.client.config.ts`. DSN comes from `NEXT_PUBLIC_SENTRY_DSN` env var. Disabled in dev (`NODE_ENV !== "production"`) so local errors don't pollute the issue feed.
- `next.config.js` is wrapped with `withSentryConfig` to upload source maps on build when `SENTRY_AUTH_TOKEN` is set in Vercel. Without the token, the wrapper degrades gracefully — builds still succeed, just without source-map upload.
- `tracesSampleRate = 0.1` to keep performance traces under Sentry's free-tier 10K transactions/mo cap. Errors are 100% sampled.
- `captureRequestError` is re-exported from `instrumentation.ts` so Next.js auto-captures unhandled errors in route handlers (including tRPC).
- Pre-existing `ResizeObserver` and "Non-Error promise rejection" noise is filtered via `ignoreErrors`.

## Conversion pixel docs

- Public docs page at `/integracoes/pixel` explains how clients install the existing `POST /api/pixel` (purchase) and `GET /api/pixel?ref=...` (click pixel image) on their thank-you pages. Includes copy-paste snippets and an LGPD note (no PII collected, no third-party cookies).
- The `/api/pixel` endpoint logic itself is unchanged — this is documentation only.

## Post-MVP backlog

Items deliberately deferred from the pre-launch sprint. None block launch; ordered roughly by expected ROI.

### Billing hardening
- **Prorated billing + calendar-cycle alignment**: today subscriptions cycle from signup date. Switch to billing on the 1st of each month with `billing_cycle_anchor` + `proration_behavior: "create_prorations"`. Requires careful QA across timezones and the 28/29/30/31 edge cases.
- **Per-tenant `planLabel` override**: custom plans display "Enterprise" today. Add `Tenant.planLabel String?` and surface it in `billing.status` + `dashboard` so the customer sees the negotiated label they actually bought.
- **Overage billing automation**: today `excessCostPerAnalysis` exists but is enforced as a soft block at the limit. To activate it, generate Stripe `invoice items` per excess analysis (manual today). Risky for B2B without explicit pre-authorization — keep dormant until contracts allow.
- **Webhook dedupe ordering**: `WebhookEvent` is created BEFORE the handler runs. If the handler fails after the dedupe write, Stripe retries get short-circuited and the event is silently lost. Move the dedupe write to after handler success (or wrap it in the same transaction) so retries can heal partial failures.
- **Race fix `invoice.paid` arriving before `checkout.session.completed`**: rare but observed. The first invoice's `payment` UsageEvent gets dropped because the tenant doesn't exist yet. Add an outbox/queue or re-attempt on subscription_create.

### Auth hardening
- **2FA / MFA for admin accounts** (TOTP first, WebAuthn later).
- **Email change confirmation flow**: today `updateProfile` accepts a new email immediately. Add a verification email + token before flipping the address.
- **Rate limit `forgot-password` per IP** (3/h) — currently unrate-limited.
- **Session invalidation on password change**: reset all open JWTs for the user when password rotates (prevents an attacker with a leaked session from continuing to act after the password is rotated).

### Data + compliance
- **LGPD self-service download**: let `b2b_admin` export all tenant data (analyses, users, products, conversions) as a JSON or ZIP before requesting deletion.
- **Patient-facing data deletion**: today only the tenant admin can request deletion. Patients (B2C) have no path; the analysis is anonymous (no email) so they have no handle, but if we add identified patients later, this flow needs a counterpart.
- **Audit log table** for admin actions (plan changes, status changes, data deletions). Today scattered in `UsageEvent`.

### Operational
- **Cleanup webhook**: a separate cron that purges `WebhookEvent` rows older than 30 days to keep the table bounded.
- **Sentry source map upload**: requires `SENTRY_AUTH_TOKEN` in Vercel. Add it the first time we hit a stack trace we can't read.
- **Better Stack / Axiom log drain** as a Sentry complement for raw HTTP logs (cheaper for high-volume tracing).

### Sales / growth
- **Bulk admin tenant create** for partner integrations (e.g. Nuvemshop App Store distribution).
- **Public payments page for custom links** with branded preview (today the admin-link Checkout opens directly to Stripe Hosted Checkout, no preview screen).
- **Recovery email to abandoned checkouts** via `checkout.session.expired` webhook.

## Tenant lifecycle and auth invariants

- **`tenantProcedure` middleware (`apps/web/src/server/trpc.ts`) validates the tenant on every request.** It fetches `{ id, status }` for `ctx.tenantId` (cached 30s in-memory, process-local, resets on cold start) and:
  - Tenant missing → throws `UNAUTHORIZED` ("Tenant no longer exists"). The browser's tRPC client catches this and triggers a NextAuth `signOut` so the zombie JWT (tenant deleted while session was open) self-resolves to a clean re-auth at `/login`.
  - Tenant `status = "deleted"` → also `UNAUTHORIZED`, same logout flow.
  - Tenant `status = "paused"` → throws `FORBIDDEN` with a Portuguese message ("Sua conta esta pausada..."). The client does **not** auto-logout because the user might recover (admin re-activates, refund disputed). Page-level UI is responsible for surfacing the error.
  - Tenant `status = "active"` → request proceeds normally.
- **Why this matters:** before this guard, every tRPC handler that ran `tenant.findUniqueOrThrow` would throw a 500 when the tenant was missing, leaving the user with broken pages and no recovery. Endpoints that used `findMany` would silently return empty arrays, which is even more confusing.
- **Cache invalidation:** the 30s TTL means a paused/deleted tenant takes up to 30s to lock out all open sessions. Acceptable for an MVP. If we ever need instant invalidation, add an admin endpoint that clears the entry by `tenantId`.
- **Client-side (`apps/web/src/lib/trpc/provider.tsx`):** `QueryCache` and `MutationCache` share an `onError` handler that triggers `signOut({ callbackUrl: "/login" })` on `UNAUTHORIZED`. A module-level `signOutInFlight` flag prevents multiple parallel batched queries from each calling signOut. React Query is also configured to NOT retry `UNAUTHORIZED` or `FORBIDDEN` (they will not self-heal).

## Conventions

- All user-facing text in Portuguese (Brazilian)
- Tailwind classes use brand color names: text-carbone, bg-blanc-casse, border-sable/20, etc.
- Buttons: bg-carbone text-blanc-casse (primary), border border-sable text-terre (secondary)
- Labels: text-[10px] text-pierre uppercase tracking-wider font-light
- Headings: font-serif text-carbone
- Body: text-sm text-pierre font-light
