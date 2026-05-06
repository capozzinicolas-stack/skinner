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

### Annotated face map alignment
- `apps/web/src/components/analysis/annotated-photo.tsx` overlays zone markers (forehead, under_eyes, nose, cheeks, chin, jawline) on the patient photo. Marker positions come either from face-api.js landmarks (computed as % of `naturalWidth`/`naturalHeight`) or from a centered-selfie fallback when detection fails.
- **Critical invariant**: the photo container's aspect ratio MUST equal the image's natural aspect ratio. Otherwise `object-cover`/`contain` cropping displaces the visible image relative to the marker percentages and markers land off the face. The component reads `imgAspect` from the loaded image and applies it inline. Combined with `object-contain` as a safety net, this prevents the markers-on-the-side-of-the-face bug.
- Do NOT hardcode `aspectRatio: "3/4"` on this container. Photos from camera capture (`photo-capture.tsx`) come in `videoWidth × videoHeight` (commonly 4:3 or 16:9), which does not match a forced 3:4 portrait container.

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

## Plans (admin-managed)

Pricing, limits, features and Stripe Price IDs all live in the `plans` table managed via `/admin/planos`. The previous hardcoded `PLANS` constant + `STRIPE_PRICE_IDS` arrays were removed in May-2026 because they could not stay in sync with admin edits without a deploy.

### Source of truth

- `model Plan` (Prisma): id (slug, immutable), name, monthlyPriceBRL, setupFeeBRL, analysisLimit, commissionRate, excessCostPerAnalysis, maxUsers, features (JSON array), ctaText, stripePriceId, stripeSetupPriceId, visible, deprecated, customAllowed, displayOrder.
- `lib/billing/plans.ts` exposes `getPlan(id)`, `getAllPlans({ visibleOnly, includeDeprecated })`, `getPlanForPrice(stripePriceId)`, and `invalidatePlanCache(id?)`. All async, with a 60-second per-instance in-memory cache.
- `lib/billing/stripe.ts` no longer exports `STRIPE_PRICE_IDS` / `STRIPE_SETUP_PRICE_IDS` / `PRICE_TO_PLAN` — consumers MUST resolve via the plan resolver. The renaming history (Apr-2026 starter→growth, growth→pro) is preserved as a comment for archeology.

### Stripe Price immutability

Stripe Prices are immutable. When the admin changes `monthlyPriceBRL` or `setupFeeBRL`, `plans.update` calls `stripe.prices.create()` and rotates the FK on the Plan row. The OLD Price stays active so existing subscriptions keep paying their original amount — Stripe binds subscriptions to Price by ID, not by product. Custom-allowed plans (enterprise tier) skip Stripe Price creation entirely.

### Grandfathering rules

- **monthlyPriceBRL / setupFeeBRL**: only used for /planos display + new signups. Existing tenants are protected at the Stripe layer (their subscription stays bound to the old Price).
- **analysisLimit / commissionRate / maxUsers / excessCostPerAnalysis**: snapshotted to `Tenant.*` columns at signup. Plan edits do NOT propagate to existing tenants UNLESS the admin explicitly checks "Aplicar mudancas aos N tenants" in the form. That triggers an `UPDATE tenants ... WHERE plan = id` AND the form shows a confirmation dialog with the tenant count first.
- **name / features / ctaText**: read live from the Plan row → visual changes propagate to all tenants' faturamento UI immediately.

### Lifecycle

- **Soft delete only** via `deprecated = true` (Plan.archive endpoint sets `deprecated=true, visible=false` together). Hard DELETE is blocked because `Tenant.plan` references the id.
- Reactivate via `Plan.unarchive`.
- Plans with `customAllowed = true` (enterprise tier today) are public-listed but disabled for self-service signup; the CTA goes to `/contato` instead.

### Admin endpoints (`plansRouter`)

- `list`, `get(id)`, `tenantsCount(id)` — for the admin UI.
- `create(planMutableInput + id)` — Stripe Price creation runs FIRST; if Stripe call throws, no DB row is created.
- `update(planMutableInput + id + applyToExistingTenants)` — diffs the row; only creates new Stripe Prices when prices changed; conditionally fans out the limit update.
- `archive(id)` / `unarchive(id)` — soft delete.

### Caller migration cheatsheet

| Before | After |
|---|---|
| `PLANS["growth"]` | `await getPlan("growth")` |
| `Object.values(PLANS)` | `await getAllPlans({ visibleOnly: true })` |
| `STRIPE_PRICE_IDS["pro"]` | `(await getPlan("pro")).stripePriceId` |
| `PRICE_TO_PLAN["price_xyz"]` | `(await getPlanForPrice("price_xyz")).id` |
| `calculateMonthlyBill("growth", used, sales)` | `calculateMonthlyBill(await getPlan("growth"), used, sales)` |

The marketing `/planos` page uses the public `billing.publicPlans` tRPC query (publicProcedure, no auth required). Visual marketing-only metadata (target descriptor + popular badge) is keyed by plan id in a small `MARKETING_META` lookup; new plan ids fall back to no badge.

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

### Webhook dedupe with rollback
- The dedupe row in `WebhookEvent` is inserted at the START of webhook processing (so concurrent duplicate deliveries can't race-process the same event), but is **DELETED if the handler throws** so Stripe's retry can re-execute cleanly. Without the rollback, a partially-failed handler would be permanently marked "processed" and silently dropped — a regression we caught in the pre-launch audit.
- All handlers are idempotent at the row level (`upsert` for subscription/tenant updates, transaction with unique-email guard for new signups), so a retry of the same event will not double-create entities. The only non-idempotent operation is the audit `UsageEvent.create` (payment / refund / payment_failed logs); duplicates there are preferable to losing payments and are easy to detect after the fact.

### Webhook signup atomicity
- `checkout.session.completed` (new signup branch) creates Tenant + User + Subscription inside a single `db.$transaction`. A partial failure rolls everything back so we never end up with an orphan user pointing to a half-created tenant. Stripe `subscriptions.update` (metadata write-back) and the Resend welcome email run AFTER the commit because they are external side effects we don't want rolled back if a transient error happens later.

### Custom plan flow (admin-quoted, mano-a-mano)
- Library: `apps/web/src/lib/billing/custom-checkout.ts` exports `buildCustomCheckout({ email, monthlyPriceBRL, analysisLimit, commissionRate, maxUsers, skipSetupFee, planLabel })`. Creates a Stripe **Price** ad-hoc (BRL, recurring monthly) and a Checkout Session that embeds the negotiated limits in `metadata`.
- Admin endpoint: `POST /api/billing/admin-link` (gated by `getToken().role === "skinner_admin"`) accepts the same shape, validates with Zod, returns `{ url }`.
- Admin UI: `/admin/tenants/novo-custom` (form: email, R$ mensal, analysisLimit, commission %, maxUsers, "Waivear setup" checkbox, planLabel). Generates the link, offers copy/WhatsApp/open buttons. CTA "Novo Plano Custom" added to `/admin/tenants` header next to "Novo Tenant".
- **Internal plan tier convention**: custom plans set `planId = "enterprise"` in Stripe metadata. We deliberately reuse the enterprise label so we don't need to introduce a 4th tier in `PLANS` and propagate it across z.enums in 5 routers. Negotiated limits live on Tenant columns (`analysisLimit`, `commissionRate`) — independent of `PLANS` — so the actual sold values flow through unchanged.
- **Display overrides for custom-plan tenants**: `Tenant.planLabel` and `Tenant.customMonthlyPriceBRL` are persisted from session metadata (`customPlanLabel`, `customMonthlyPriceBRL`) when the signup came via `/admin/tenants/novo-custom`. `billing.status` returns `planName: tenant.planLabel ?? Plan.name` and the bill `baseFee` uses `tenant.customMonthlyPriceBRL ?? Plan.monthlyPriceBRL`. Both fields are NULL for standard signups (growth/pro), so those tenants see the Plan.name and Plan.monthlyPriceBRL exactly like before. The `billing.status` response also exposes `isCustomPlan` so the UI can hide the "Planos disponíveis" upgrade grid (custom-plan tenants see a "contate vendas" message instead).
- **Existing custom tenants pre-fix**: tenants who came in via `/admin/tenants/novo-custom` BEFORE this fix have `planLabel = NULL`. They still display "Enterprise" + the standard tier price. Backfill manually with `UPDATE tenants SET "planLabel"='...', "customMonthlyPriceBRL"=750 WHERE id='...'` or wait for Fix B (admin UI to edit these per tenant — sprint follow-up).
- **Webhook handling**: `handleCheckoutCompleted` checks `session.metadata.customAnalysisLimit`; if present, uses negotiated limits instead of `PLANS[planId]`. Custom plans always get `excessCostPerAnalysis = 0` (we sold a fixed monthly volume, no overage to surprise the customer). Standard signups (planId = `growth` / `pro` from `/planos`) are untouched and fall through to PLANS-based limits.

## Lead capture flow

A new step is inserted in the public analysis pipeline between consent and questionnaire:

```
welcome → consent → contact (NEW) → questionnaire → photo → loading → result
```

- **Toggle**: `TenantConfig.contactCaptureEnabled` (default `true`). When `false`, the step is skipped and the flow goes directly from consent to questionnaire (or photo if `photoOnlyMode`).
- **Required vs optional**: `TenantConfig.contactCaptureRequired` (default `false`). When `false`, the patient sees a "Pular" button and can continue without filling anything. When `true`, at least one contact channel (email or phone) plus the LGPD consent checkbox are required.
- **LGPD discipline**: contact data is persisted to `Analysis.clientName`/`clientEmail`/`clientPhone` regardless, but `consentToContact` boolean tracks whether the patient explicitly opted in. The Leads tab and notification emails ONLY surface analyses where `consentToContact === true` AND `contactCapturedAt IS NOT NULL`.
- **Custom message**: `TenantConfig.contactCustomMessage` lets the tenant override the default "${tenantName} gostaria de manter contato..." line. Empty falls back to default.
- **Component**: `apps/web/src/components/analysis/contact-capture.tsx`. State lives in the parent page (`/analise/[slug]/page.tsx`) so the values can be passed to `analysis.run` mutation.

### Auto email delivery
- `TenantConfig.autoSendPdfEmail` (default `false`). When true AND patient gave email AND `consentToContact === true`, after the analysis completes we send the patient a branded email via Resend with a link to `/api/report/[analysisId]` (NOT an attachment — PDF is generated on-demand to keep the email small and let us update the template later).
- `TenantConfig.notifyTenantNewLead` (default `false`). When true AND any contact field was captured, all `b2b_admin` users of the tenant get an email with the lead summary and a link to `/dashboard/leads`.
- Both side effects are wrapped in try/catch and only logged on failure — they NEVER block the analysis from returning to the patient. Email failures are surfaced via Sentry.

### Leads dashboard
- Page: `/dashboard/leads`. Visible to all tenant roles (b2b_admin, b2b_analyst, b2b_viewer).
- Backend: `leadsRouter` (`apps/web/src/server/routers/leads.ts`) exposes `list({ days, onlyConsented })` and `exportCsv({ days })`. Both filtered to consent + contactCapturedAt.
- UI: table with date, name, contact (email + phone), skin type, primary objective, and quick actions (WhatsApp deep-link with pre-filled message, mailto link with subject/body, link to PDF).
- CSV export uses UTF-8 BOM (matches dashboard exportSnapshot convention).

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

## Portal segmentation (admin vs client)

Skinner runs under three subdomains with strict role-to-portal coupling:

- `www.skinner.lat` — public marketing site, no auth.
- `admin.skinner.lat` — Skinner internal team. Only `role === "skinner_admin"` accounts can authenticate.
- `app.skinner.lat` — B2B tenants. Only `role !== "skinner_admin"` (b2b_admin, b2b_analyst, b2b_viewer) accounts can authenticate.

Enforcement runs in **two layers** for defense-in-depth:

1. **Credentials provider (`apps/web/src/lib/auth.ts`)** — the login form passes a `mode` field ("admin" or "client") derived from the hostname. The `authorize()` function refuses to issue a JWT when the role/mode mismatch:
   - `mode === "admin"` requires `user.role === "skinner_admin"`.
   - `mode === "client"` requires `user.role !== "skinner_admin"`.
   - Mismatch returns `null` (treated as wrong credentials by NextAuth — the user sees the same generic invalid-login error, no enumeration leak).
2. **Middleware (`apps/web/src/middleware.ts`)** — even if a JWT slips through (zombie cookie from a past misconfiguration, manual cookie injection, etc.), every request on `admin.*` or `app.*` is re-validated. A wrong-portal JWT triggers a cross-subdomain redirect to the correct portal's `/login?error=wrong-portal`. Auth pages themselves (`/login`, `/forgot-password`, `/reset-password`, `/api/auth/*`) are exempt so users can always re-authenticate.

NextAuth defaults to **per-subdomain cookie scoping**, so cookies set on `app.skinner.lat` are not sent to `admin.skinner.lat` and vice versa. The middleware fallback handles edge cases where this default could be circumvented (e.g. someone manually setting `cookies.sessionToken.options.domain = ".skinner.lat"`).

When developing locally on `localhost`, both modes are accepted because there is no subdomain prefix — `detectMode()` falls back to "client" by default. To test admin login locally, navigate from a hostname that starts with `admin.` (use `/etc/hosts` to alias `admin.localhost` if needed).

## Cart + checkout dispatcher

The `/analise/[slug]` results screen now hosts a single-cart, single-channel checkout flow. The patient adds products one by one, sees a sticky footer with the running total, and clicks "Finalizar" to be sent to the channel-specific checkout (Nuvemshop, Shopify, MercadoPago, WhatsApp, or external link). The cart lives entirely in the browser (`localStorage`, 24h TTL, keyed by analysisId) — no DB tables, no server state.

### Channel resolver
`lib/cart/resolve-channel.ts` decides the checkout channel for each product. Priority order (first match wins):
1. **Service** with `bookingLink` → `external` (or `whatsapp` if storefront ops via WhatsApp).
2. Active Nuvemshop integration + product `ecommerceLink` matches `lojavirtualnuvem|tiendanube` → `nuvemshop`.
3. Active Shopify integration + link matches `myshopify.com` → `shopify`.
4. `mercadoPagoEnabled` + email + product has no external link → `mercadopago`.
5. Storefront WhatsApp opt-in → `whatsapp`.
6. Default → `external` (whatever `ecommerceLink` points to).

When the future `/admin/canais` refactor lands, this function gets replaced by a lookup against an explicit per-tenant priority stack — consumers don't change.

### Single-channel cart enforcement
The cart can only contain items from one channel. If the patient tries to add a product whose channel differs from the items already in cart, the UI shows a `confirm()` dialog: "Você já tem itens de [canal A]. Adicionar este item de [canal B] vai substituir o carrinho. Confirmar?". On accept, the cart is replaced by the new item. This is **Opção A** from the multi-channel design — chosen for simplicity. Multi-channel split-checkout (sub-carts per channel) is deferred.

### Dispatcher (`lib/cart/dispatch.ts`)
`buildCartCheckoutUrl(items, ctx)` returns `{ url, warning? }` based on the cart's single channel:
- **nuvemshop**: `{base}/carrinho/adicionar?sku=A&qty=1&sku=B&qty=1&skr_ref=...` (requires `nuvemshopBaseUrl` in ctx — currently null because we don't persist the store base URL on the Integration row; dispatcher returns a friendly warning).
- **shopify**: `{base}/cart/{variantId}:1,{variantId}:1?skr_ref=...` (same `shopifyBaseUrl` gap).
- **external**: opens the first item's URL. If multiple items, surfaces a warning that only the first opens.
- **whatsapp**: pre-formatted message with item list, total, tracking ref, sent to `wa.me/{number}`.
- **mercadopago**: today still falls back to `mailto:` with the item list — full MP API integration is a future sprint that swaps this branch.

### Components
- `components/analysis/cart-floater.tsx` — sticky footer (count + total + "Adicionar rotina completa" + "Finalizar"). Branded with tenant primaryColor/secondaryColor.
- `components/analysis/results-screen.tsx` — `ProductCard` accepts `cartChannel` + `primaryColor`/`secondaryColor`. When in `<CartProvider>` AND a channel is resolved, renders a single "Adicionar / ✓ No carrinho" toggle. Falls back to legacy 3-button CTA (Comprar/WhatsApp/Pagar) when not. Service cards keep their legacy CTAs (services do not enter the cart by design).
- `lib/cart/cart-store.tsx` — `<CartProvider analysisId>` + `useCart()` + `useCartSafe()` (returns null outside provider).

### Integration listing for the patient flow
`integration.publicByTenantSlug` (publicProcedure, slug-keyed) returns active integrations as `{ platform, status, storeId }` — never tokens. Used by the resolver to pick channel. Added to `PUBLIC_PATHS` in middleware so the patient can call it without auth.

### Nuvemshop end-to-end checkout
- **Schema**: `Integration.storeUrl` and `Integration.matchStats` (JSON) added in May-2026.
- **OAuth callback** (`/api/integrations/nuvemshop/callback`): after `exchangeCodeForToken`, calls `fetchStoreInfo(storeId, accessToken)` and persists `storeUrl`. Best-effort — failure leaves storeUrl null and the lazy backfill below recovers later. Then registers FOUR webhooks (order/created, product/created, product/updated, app/uninstalled) — non-blocking, errors logged. Re-registering on a reconnect is safe: Nuvemshop returns 422 for duplicate (event,url) pairs and `registerWebhook` swallows it.
- **Lazy backfill**: `integration.publicByTenantSlug` (publicProcedure used by the patient `/analise/[slug]` page) detects active Nuvemshop rows with `storeUrl=null`, calls `fetchStoreInfo`, persists, and returns the enriched value. Self-heals legacy integrations without a one-off cron.
- **Cart dispatcher** (`lib/cart/dispatch.ts` nuvemshop branch): builds `{storeUrl}/carrinho/adicionar?sku=A&qty=1&sku=B&qty=1&skr_ref={ref}&note=skr_ref%3D{ref}`. The double-attribution (`skr_ref` query + `note` param) belt-and-suspenders against Nuvemshop dropping the query string mid-flow — the order webhook scans both.
- **Conversion attribution** (`/api/integrations/nuvemshop/webhooks/order`): unchanged, still scans `body.note` and `permalink` for `skr_ref=...`. With the dispatcher now propagating both, the existing webhook handler matches conversions correctly.
- **Match status**: `integration.refreshNuvemshopMatch` (tenantProcedure mutation) re-fetches Nuvemshop products, compares SKUs against `Product.sku` rows, and persists `{skinnerCount, externalCount, matchedCount, lastChecked}` in `Integration.matchStats`. UI in `/dashboard/integracao` (NuvemshopCard) shows the storeUrl + match snapshot + "Atualizar match" button. Manual trigger only.
- **Real-time catalog sync** (`/api/integrations/nuvemshop/webhooks/product`, May-2026): handles `product/created`, `product/updated`, `product/deleted`. Body carries only `{store_id, event, id}` — handler re-fetches the full product via `fetchProduct(storeId, accessToken, id)` and upserts into `Product` table by SKU using the shared `mapNuvemshopProduct` helper. `product/deleted` does a soft-disable (`isActive=false`) instead of DELETE so historical Recommendations/Conversions stay valid. Always returns 200 even on internal failure — the daily resync cron is the safety net, replaying webhooks costs more than letting one slip.
- **App uninstall handling** (`/api/integrations/nuvemshop/webhooks/uninstall`, May-2026): on `app/uninstalled` flips `Integration.status="disconnected"` and clears `accessToken`. The Integration row stays for audit (matchStats, lastSyncAt, storeId preserved); reconnecting via OAuth upserts on the same `(tenantId, platform)` unique key and re-activates. Without this webhook, a merchant uninstalling our app from the Nuvemshop panel would leave us with a stale token and 401s on next sync.
- **Daily resync cron** (`/api/cron/nuvemshop-resync`, May-2026): scheduled daily 03:00 UTC in `vercel.json`. Iterates every active Nuvemshop integration, refetches the full catalog, upserts via `mapNuvemshopProduct`. Safety net for missed webhooks (network blip, Nuvemshop outage, lojista bulk-importing past rate limits). Detects 401 in fetch error and flips the integration to `status="error"` so the dashboard can surface re-auth prompt. Auth via `Authorization: Bearer ${CRON_SECRET}` like the usage-alerts cron.
- **Image strategy (B1)**: `mapNuvemshopProduct` references the Nuvemshop CDN URL directly in `Product.imageUrl` (`p.images[0].src`). No copy to our Supabase bucket — cheaper, and Nuvemshop merchants rarely delete an image without replacing first. If image rot becomes an issue, switch to bucket-copy at sync time.
- **Shared mapper**: `mapNuvemshopProduct(rawProduct)` in `lib/integrations/nuvemshop.ts` is the single source of truth for Nuvemshop → Skinner product mapping (sku, name, description, imageUrl, price, ecommerceLink). Used by the product webhook handler and the resync cron. The pre-existing manual-sync route + `integration.syncProducts` mutation still inline their own loop for backwards compat — new code should call `mapNuvemshopProduct` directly to avoid drift.

### Shopify end-to-end checkout (May-2026 parity sprint)
Brought Shopify to feature parity with Nuvemshop. Pre-sprint state had two
critical bugs that silently broke conversion attribution since day 1:

- **Bug fix #1**: `/api/integrations/shopify/webhooks/order/route.ts` queried
  `db.recommendation.findFirst({ where: { productId: ref } })` — but `ref` is
  a `trackingRef`, not a `productId`. Zero Shopify orders ever matched a
  Recommendation. Fixed to `findUnique({ where: { trackingRef: ref } })`,
  same as the Nuvemshop handler.
- **Bug fix #2**: `lib/cart/dispatch.ts` shopify branch passed `?skr_ref=xxx`
  as a top-level query param, which Shopify drops at the cart→checkout
  transition. Fixed to use `?attributes[skr_ref]=xxx&attributes[channel_id]=yyy`
  (which Shopify carries into `order.note_attributes`) PLUS `note=...` as a
  belt-and-suspenders for headless checkouts that strip note_attributes.
- **HMAC verification**: all Shopify webhooks (order, product, uninstall) now
  verify `X-Shopify-Hmac-SHA256` against the raw request body using
  `SHOPIFY_CLIENT_SECRET`. Mismatch returns 401. Without this, anyone could
  POST fake orders/uninstalls. The verifier (`verifyWebhookHmac`) returns
  `false` in production when the secret is missing; dev mode allows unsigned
  bodies for local testing.
- **Real-time catalog sync** (`/api/integrations/shopify/webhooks/product`):
  handles `products/create`, `products/update`, `products/delete`. Re-fetches
  via Admin API and upserts by SKU using `mapShopifyProduct`.
  `products/delete` does soft-disable (`isActive=false`) to preserve
  historical FKs.
- **App uninstall handling** (`/api/integrations/shopify/webhooks/uninstall`):
  on `app/uninstalled` flips `Integration.status="disconnected"` and clears
  `accessToken`. Same posture as Nuvemshop.
- **Daily resync cron** (`/api/cron/shopify-resync`): scheduled `30 3 * * *`
  in `vercel.json` (offset 30 min from nuvemshop-resync to avoid hammering
  both APIs simultaneously). Detects 401 on fetch and flips the integration
  to `status="error"` (covers the case where uninstall webhook never fired).
- **Storefront URL**: Shopify storeUrl is `https://{shop}` directly — no API
  call needed. Persisted at OAuth callback. Lazy backfill in
  `integration.publicByTenantSlug` heals legacy rows that connected before
  storeUrl was being persisted.
- **Shared mapper**: `mapShopifyProduct` + `resolveShopifyEcommerceLink` in
  `lib/integrations/shopify.ts`. The pre-existing manual sync route +
  `integration.syncShopifyProducts` mutation still inline their own loop for
  backwards compat — new code should call the helpers directly.
- **Image strategy (B1)**: same as Nuvemshop, references the Shopify CDN URL
  (`p.images[0].src`) directly in `Product.imageUrl` — no bucket copy.

### Cron auth and middleware
- **`/api/cron` is in `PUBLIC_PATHS` (May-2026 fix)**. Without this, Vercel Cron requests would hit middleware without an auth cookie and get 307'd to `/login`, silently failing every cron run. Added when introducing `nuvemshop-resync` — also implicitly fixes the latent bug for `usage-alerts`. Each cron route still validates `Authorization: Bearer ${CRON_SECRET}` at the handler level, so being public-by-middleware is safe.

### Pages NOT yet wired to cart (deliberate)
- `/kit/[kitId]` and `/kit/manual/[tenantSlug]/[kitSlug]` are Server Components rendering legacy buttons. Refactoring to client + cart is a follow-up sprint. The patient who lands there from a shared kit link still gets WhatsApp/Pagar/external buttons that work as before. Conversion-critical flow (`/analise/[slug]` → results) IS wired.

## Multi-channel access (`AnalysisChannel`)

Each tenant can host multiple slugs that route to the same analysis flow. Lets the tenant segment stats by campanha, unidade, embed, parceiro, etc. Plan-gated via `Plan.maxChannels` (Growth=1, Pro=3, Advanced=5).

### Schema
- `model AnalysisChannel { id, tenantId, slug (globally unique), label, isDefault, expiresAt?, maxAnalyses?, status (active|paused), ... }`
- `Analysis.channelId String?` FK with `onDelete: SetNull` so deleting a channel doesn't orphan history.
- `Plan.maxChannels Int @default(1)` — admin can edit per plan via `/admin/planos`.

### Slug resolution
`tenant.getBySlug(slug)` searches AnalysisChannel first; if found returns the parent tenant + channel metadata (id, status, expiresAt, maxAnalyses, label). Falls back to `Tenant.slug` for any callers that pre-date channels (legacy URL preserved by the default channel created at migration). The query also returns a computed `channelStatus`: `active`, `paused`, or `expired` (expiresAt < now), so the patient page surfaces a friendly error before showing the welcome screen.

`analysis.run` enforces channel guards before the tenant-wide quota: paused channels return FORBIDDEN, expired channels return FORBIDDEN, channels at maxAnalyses return FORBIDDEN. Each new analysis persists `channelId` so all downstream attribution joins work.

### Default channel invariant
At signup (and via the May-2026 backfill), every tenant has exactly ONE `isDefault: true` channel whose slug equals `Tenant.slug`. This protects every legacy `/analise/{tenantSlug}` URL — that URL keeps working because the default channel has the same slug. The default channel CANNOT be paused, deleted, or have its slug edited.

### Plan limits
`analysisChannel.create` checks `count(channels where tenantId) < plan.maxChannels`. On hit: throws FORBIDDEN with a Portuguese message + the upgrade CTA path. The UI in `/dashboard/canais` shows "X de Y canal(is)" + disables the "+ Novo canal" button when at cap.

### Backend (`analysisChannel` router, tenantProcedure)
- `list` — returns channels + analysisCount + plan cap + plan name.
- `create({ label, slug, expiresAt?, maxAnalyses? })` — validates plan cap, slug regex (`/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/`), and global slug uniqueness.
- `update({ id, label?, expiresAt?, maxAnalyses?, status? })` — slug is immutable. Default channels cannot be paused.
- `archive({ id })` — hard delete (after confirm). Default channels cannot be deleted.

### Frontend (`/dashboard/canais`)
List of channels with status badges + per-channel detail panel with three tabs:
- **Link Direto** — copy URL `${origin}/analise/${slug}`.
- **QR Code** — generated via api.qrserver.com using the channel slug (per-channel QR).
- **Widget Embed** — snippet builder with the channel slug, customization toggles (skip contact, compact, height), helper script snippet.

Per-channel actions: pausar / reativar / excluir (locked for default channel). Slug auto-suggestion `${tenantSlug}-${labelSlugified}` to keep the global namespace clean.

### Channel filter in analytics (May-2026)
All `dashboardRouter` queries now accept an optional `channelId` input that adds `channelId` to the `Analysis.where` clause via the `analysesWhere(tenantId, channelId, extra)` helper. `leadsRouter.list/exportCsv` and `reportRouter.list` got the same input. The frontend (`/dashboard`, `/dashboard/relatorios`, `/dashboard/leads`) renders a "Todos os canais" dropdown sourced from `analysisChannel.list` and threads `channelId` into every query. `platformBenchmark` is intentionally exempt — it's a cross-tenant aggregate and channel filtering doesn't apply.

### Per-channel branding overrides (Nivel B, May-2026)
`AnalysisChannel.overrides` is a JSON map of TenantConfig field overrides serialized as a string. When a slug resolves to a channel, `tenant.getBySlug` and `tenant.getAnalysisConfig` parse `overrides` and merge it onto the resolved `tenantConfig` (channel keys win). Patients arriving via that channel see the channel-specific copy without changing the tenant's defaults.

Whitelist enforced at write time in `analysisChannel.update` via `CHANNEL_OVERRIDE_FIELDS`:
welcomeTitle, welcomeDescription, welcomeCtaText, welcomeSubtext, welcomeSubtextVisible, consentExtraText, consentButtonText, photoTitle, photoInstruction, photoExtraText, contactCaptureEnabled, contactCaptureRequired, contactCustomMessage, productCtaText, serviceCtaText, resultsTopMessage, resultsFooterText.

Anything outside the list is silently dropped — operational fields like `analysisLimit`, `commissionRate`, `maxUsers` MUST NEVER be channel-overrideable. UI lives in `/dashboard/canais` → channel detail → "Personalizacao" tab.

### Nuvemshop channel attribution (May-2026)
`lib/cart/dispatch.ts` now appends `channel_id={id}` to both the cart URL query string AND the `note=` parameter when the dispatchContext has a `channelId`. The order webhook handler (`/api/integrations/nuvemshop/webhooks/order`) scans `body.note` for `channel_id=...` and persists it to `UsageEvent.metadata.channel_id` alongside the existing `skr_ref`. Primary attribution still flows via `Recommendation → Analysis.channelId`; the note value is an audit trail / cross-check signal.

### Identity-based limit (Nivel 1, May-2026)
Anti-abuse + fairness control: a tenant can configure per-channel limits on how many analyses a single email/phone can run within a rolling time window. Plan-gated.

**Schema**
- `Plan.allowIdentityLimit Boolean @default(false)` — capability flag.
- `Tenant.customAllowIdentityLimit Boolean?` — per-tenant override (NULL = inherit from plan), used when admin grants the capability to custom-priced tenants via `/admin/tenants/novo-custom`.
- `AnalysisChannel.identityLimit Int?` + `identityWindowDays Int?` — per-channel knobs. NULL = no limit. windowDays NULL or 0 = forever.
- `Analysis.identityKey String?` — `"email:lowercase@trim"` or `"phone:onlydigits"`. Indexed `(channelId, identityKey, createdAt)` for O(log n) count.

**Backend (`analysis.run`)** — runs after tenant/channel guards, before Claude. When the channel has identityLimit > 0:
1. Builds identityKey from `input.clientEmail` (priority) or `input.clientPhone` (fallback).
2. If neither is present → throws BAD_REQUEST "Esta clinica exige seu e-mail ou WhatsApp..." — implicitly forces contact-capture for these channels.
3. Counts analyses in the window matching `(channelId, identityKey, createdAt >= since)`.
4. If `count >= identityLimit`, throws FORBIDDEN with informative message: "Voce ja realizou {N} analise(s) neste canal nos ultimos {M} dias. Tente novamente apos {data}." (date computed from oldest analysis in window).
5. Persists `identityKey` to `Analysis.identityKey` for future counts.

**Plan-gating** — `analysisChannel.update` re-checks effective capability (`Tenant.customAllowIdentityLimit ?? Plan.allowIdentityLimit`) server-side. If the tenant tries to enable without capability → FORBIDDEN with upgrade message.

**Custom plan flow** — `/admin/tenants/novo-custom` form has "Permitir limite de analises por identidade" checkbox; the value rides in Stripe metadata as `customAllowIdentityLimit` and the webhook persists it to `Tenant.customAllowIdentityLimit` at signup.

**UI** — `/dashboard/canais` → channel detail → "Personalizacao" tab gets a "Limite por identidade do paciente" section. Disabled with upgrade message when the plan doesn't include the capability. When enabled, requires limit (1-99) + window (Para sempre / 7d / 14d / 30d / 60d / 90d / 6m / 1ano). Warning displayed: "ao ativar este limite, a captura de contato vira obrigatoria neste canal".

**Plan defaults migration (May-2026)**: `growth.allowIdentityLimit = false`, `pro.allowIdentityLimit = true`, `enterprise.allowIdentityLimit = true`.

**UX improvement (2026-05-06): pre-check identity limit before questionnaire.**
Without this, a patient over the limit completes the entire flow (welcome →
consent → contact → questionnaire → photo → loading) before seeing the
rejection at `analysis.run` — wasting 2-3 minutes and burning a Claude
API call we'd need to cancel.

New endpoint `analysis.checkIdentityLimit({ slug, email, phone })`
(publicProcedure, query) replicates the count logic but doesn't create
anything. Returns `{ allowed, message?, blockedUntil? }`. Patient page
(both `/analise/[slug]` and `/embed/[slug]`) calls it from
`handleContactDone` right after the contact-capture step. If
`!allowed`, the page transitions to the existing error step with the
limit message.

The pre-check ONLY fires when `channelIdentityLimit > 0` (saves a
round-trip on every other patient flow). Network failures fail open —
the backend `analysis.run` still hard-enforces the cap, so we don't
lose protection. Both code paths share `buildIdentityKey()` so the
key construction stays consistent.

Added `/api/trpc/analysis.checkIdentityLimit` to middleware
PUBLIC_PATHS so anonymous patient calls go through.

**Bug fix (2026-05-06): contact capture wasn't actually required when channel
identityLimit was on.** Three issues compounded:
- `tenant.getBySlug` didn't return `identityLimit` / `identityWindowDays`,
  so the patient page had no way to know the channel had a cap.
- The patient flow's `<ContactCapture required={...}>` only checked
  `cfg.contactCaptureRequired`, ignoring channel-level identity limits.
- Backend rule was "email OR phone" but UI showed both as opcional.

Fixed: tenant.getBySlug now exposes `channelIdentityLimit` /
`channelIdentityWindowDays`. Patient page (analise + embed) sets
`required = cfg.contactCaptureRequired || channel.identityLimit > 0`.
ContactCapture in required-mode now demands BOTH e-mail AND WhatsApp
(not "either / or"), labels switch to "(obrigatorio)", "Pular" button
hidden, HTML5 `required` attr added to inputs. Backend `analysis.run`
mirrors: rejects unless both contacts are valid; identityKey still
prefers email for stability.

### Deferred to follow-up sprints
- Pre-registration / verified patient accounts (Nivel 2) — only when a paying tenant explicitly requests verified-only flows.
- Per-channel questionnaire — Nivel C, build only when a paying tenant requests it.
- Periodic cron to expire channels (today computed at read time only).
- Per-channel logo/primaryColor overrides (today brand fields are tenant-level only).

## Embed Widget

Each tenant has a per-slug iframe-embeddable widget at `/embed/{slug}`. The widget renders the same Welcome → Consent → Contact → Questionnaire → Photo → Loading → Result flow as `/analise/{slug}` but with no top header so it sits cleanly inside any host site.

### Distribution model
Tenants copy a snippet from `/dashboard/canais` and paste it on their own sites (Nuvemshop, WordPress, Wix, Shopify, custom HTML, Notion, etc.). Each snippet hardcodes the tenant slug, so attribution + branding + cart all stay scoped to that tenant. Cero cross-tenant leak.

### Routes + layout
- `apps/web/src/app/embed/[slug]/page.tsx` — currently a deliberate copy of `/analise/[slug]/page.tsx` rather than a refactor to a shared component. Decoupled so embed-specific tweaks (compact mode, postMessage events, hidden header) don't risk the conversion-critical /analise route. Fold into a single `AnalysisFlowShell` once both surfaces stabilize.
- `apps/web/src/app/embed/layout.tsx` — minimal wrapper, marks pages `robots: { index: false, follow: false }` so embed URLs don't dilute the Skinner brand in search results.

### Query params (snippet builder)
- `?contact=off` — skip the contact-capture step (host site already collected contact upstream).
- `?compact=true` — reduced padding + shorter min-height, suited for iframes around 600x800.
- `?lang=pt` — reserved (default pt-BR).

### postMessage events (`lib/embed/post-message.ts`)
Every milestone emits `parent.postMessage({ source: "skinner", type, data }, "*")`:
- `skinner:ready` — widget mounted.
- `skinner:started` — patient clicked "Iniciar".
- `skinner:contact_captured` — passed contact step (data: `{ hasEmail, hasPhone, consent }`).
- `skinner:photo_captured`.
- `skinner:analysis_completed` — data: `{ analysisId }`.
- `skinner:cart_added` (planned, not yet emitted by cart-floater).
- `skinner:checkout_clicked` (planned).
- `skinner:height_changed` — data: `{ height }`. Emitted via `ResizeObserver` debounced 100ms.

**PII boundary**: events NEVER include patient email/phone/photo/answers — only milestone identifiers and the analysisId once persisted. Same posture as Calendly/Typeform embeds.

### Iframe security headers (`next.config.js`)
- `/embed/*` → `Content-Security-Policy: frame-ancestors *;` + `Permissions-Policy: camera=*, microphone=*`.
- `/embed-helper.js` → `Access-Control-Allow-Origin: *` + `Cache-Control: public, max-age=3600, s-maxage=86400`.
- All other routes inherit Next.js defaults (`X-Frame-Options: DENY`).
- `/embed` and `/embed-helper.js` ALSO need to be in `middleware.ts` PUBLIC_PATHS — without that, the middleware redirects unauthenticated patients to `/login` and the iframe goes blank. This was the 5th time we hit that bug — keep it documented.

### embed-helper.js (`apps/web/public/embed-helper.js`)
Optional vanilla JS sidecar (~3KB unminified) hosted at `/embed-helper.js`. Tenants drop one `<script>` tag on their site to enable:
- Auto-resize: listens for `skinner:height_changed` and adjusts every Skinner iframe's height.
- `window.SkinnerWidget.{on, off, open, close}` API for advanced flows (subscribe to events, open the widget as a floating modal). Modal opens with backdrop, ESC-via-backdrop-click closes, restores body scroll.

Functions without ANY framework dependency. Safe to drop into pages with strict CSP (no `eval`, no `new Function`).

### `/dashboard/canais` UI
The "Widget Embed" section now generates the snippet live from the tenant's slug + customization toggles (skip contact, compact, height). Includes copy buttons, preview link, helper-script snippet, and an event-listener sample. Documents HTTPS + CSP requirements at the bottom.

### Deliberate omissions (sprint follow-ups)
- `cart_added` / `checkout_clicked` events — cart-floater currently doesn't emit; wire after the cart refactor stabilizes.
- Refactor embed page + analise page to a single `AnalysisFlowShell` — duplication is intentional today.
- Patrón 2 (script with shadow DOM, Hotjar style) — not built. Iframe covers 90%+ of needs; add later if a tenant explicitly asks.

## Brand customization (per-tenant)

Tenant brand fields configured at `/dashboard/marca` are now applied end-to-end in the patient-facing flow. All defaults preserve the Skinner Carbone/Terre palette so a tenant that never opens the page still gets a polished look.

| Field | Where it applies |
|---|---|
| `logoUrl` | Header of `/analise/[slug]`, header of `/kit/[kitId]`, header of `/kit/manual/...`, **cover of the PDF report** |
| `primaryColor` | Welcome screen CTA, consent screen CTA, error screen CTA, "Baixar relatorio em PDF" button on results-screen. Applied via inline `style={{ backgroundColor }}` so any hex value the tenant sets renders 1:1 (Tailwind JIT can't compile arbitrary hex from runtime) |
| `secondaryColor` | Hover state of all CTAs that use `primaryColor`. Falls back to `primaryColor` itself if the tenant only configured one color, so we never flash an unrelated color on hover |
| `brandVoice` | Injected into Claude system prompt in `claude-analyzer.ts` alongside the existing `analysisTone`. Truncated to 500 chars to keep prompt cost bounded. Applies as inspiration to all patient-facing fields (`summary`, `conditions[].description`, `action_plan`, etc.) without overriding the safety rules from `analysisTone` |
| `disclaimer` | Bottom of results-screen, kit pages, **footer of PDF report** (was already wired) |

### Buttons NOT branded today (intentional)
The "Comprar via WhatsApp" / "Pagar" / "Inscrever-se no kit" buttons inside results-screen and kit pages stay on `bg-carbone` so they look uniform across tenants. If a tenant requests fully-branded secondary actions, migrate them to inline `style` like the primary CTAs above.

### PDF logo loading risk
react-pdf uses `Image src={url}` which fetches the asset at render time. An invalid `logoUrl` throws inside `renderToBuffer`. The `/api/report/[analysisId]` route handler already wraps the render in try/catch and returns 500 with a friendly Portuguese error, so a broken logo URL degrades to "Erro ao gerar relatorio" rather than a corrupted PDF stream. Always test the logo URL with a sample PDF render after `/dashboard/marca` save.

## Routing invariants

- **`apps/web/src/middleware.ts` runs on every request and gates auth.** Any new page or API route that should be reachable without a logged-in JWT MUST be added to the `PUBLIC_PATHS` array. Otherwise the middleware silently redirects to `/login`, which from the user's perspective looks like "the link doesn't work" (you click and stay on /login). Symptoms always include "click does nothing" or "page flashes and returns to login".
- Anything that lives in `(marketing)` route group is still subject to the middleware — the route group is purely a Next.js folder convention and does not bypass middleware.
- The matcher at the bottom of `middleware.ts` excludes static assets (`_next/static`, `_next/image`, `favicon.ico`, `brand/`, `uploads/`) but everything else passes through.

## Dashboard sidebar IA (May-2026)

The dashboard sidebar groups org-level pages under a single "Organização"
entry. The URL of each page is unchanged — `/dashboard/marca`,
`/dashboard/canais`, `/dashboard/integracao`, `/dashboard/usuarios`,
`/dashboard/faturamento`, `/dashboard/organizacao` all stay at their
original paths so external integrations keep working:

- Stripe `success_url` / `cancel_url` / `return_url` → `/dashboard/faturamento`
- Nuvemshop / Shopify OAuth callback redirects → `/dashboard/integracao?...`
- Usage-alerts cron email upgradeUrl → `/dashboard/faturamento`

Internal navigation between these 6 pages happens via a shared tab bar
(`components/shared/organization-tabs.tsx`) that each page renders at
the top of its JSX. Adding a new org-level page: drop a new entry in
the TABS array AND import `<OrganizationTabs />` at the top of the new
page.

`Minha Conta` (`/dashboard/conta`) stays SEPARATE from Organização
because it's personal (user.email, user.password, user.locale, account
deletion request) — not org-level. Standard SaaS pattern (Stripe,
Linear, Notion all decouple personal account from workspace settings).

## Internationalization (i18n)

Multi-locale rolled out in May-2026 across 5 phased commits. Architecture
decision: cookie + dictionary + manual `t()` lookups instead of `next-intl`
URL routing. Avoids moving every route into `[locale]/...` and rewriting
the middleware. Trade-off: SEO doesn't separate Spanish/English Google
indexes — acceptable for MVP, escalates to URL routing in a dedicated
sprint when LATAM traction justifies it.

### Four locale contexts (decoupled)

| Surface | Decided by | Resolver |
|---|---|---|
| Marketing site (skinner.lat) | Cookie + browser `Accept-Language` + manual switcher in header | `lib/i18n/server.ts:resolveLocale()` |
| Dashboard B2B | `User.locale` → `Tenant.defaultLocale` → cookie → browser | `lib/i18n/dashboard-locale.ts` |
| Patient flow (`/analise/[slug]`, `/embed/[slug]`) | `AnalysisChannel.overrides.locale` → `Tenant.defaultLocale` → "pt-BR" | `tenant.getBySlug` returns `effectiveLocale` |
| AI analysis output (Claude) | Same as patient flow | `analysis.run` resolves + passes `input.locale` to `claudeAnalyze` |

Critical: staff dashboard locale (`User.locale`) NEVER affects what
patients see. A Mexican analyst at a Brazilian clinic can run their panel
in Spanish while patients keep getting Portuguese analyses. The four
contexts are independently configurable.

### Schema fields
- `Tenant.country` (ISO-3166 alpha-2), `Tenant.timezone` (IANA),
  `Tenant.defaultLocale` (default "pt-BR")
- `User.locale` (nullable; null = inherit)
- `AnalysisChannel.overrides.locale` — lives inside the JSON overrides
  blob, validated as enum at write time in `analysisChannel.update`
  (drops silently if not "pt-BR" / "es" / "en")

### Dictionary structure
- `lib/i18n/types.ts`: LOCALES, Locale type, LOCALE_COOKIE name
- `lib/i18n/dictionaries/{pt-BR,es,en}.ts`: typed via shared `DictShape`
  with sections `nav / footer / language / home / auth / dashboard`
- `lib/i18n/server.ts:resolveLocale()`: reads cookie → Accept-Language → default
- `lib/i18n/client.tsx:I18nProvider + useI18n()`: wraps client trees,
  hydrates with server-resolved locale, exposes setter that writes the
  cookie + reloads
- `lib/i18n/dashboard-locale.ts:resolveDashboardLocale()`: dashboard-specific
  resolver that prefers User → Tenant before falling back to generic

### Component-level translations
- Marketing chrome (header/footer/switcher): TRANSLATED via `t.nav` /
  `t.footer`. Page bodies (/, /como-funciona, /planos, etc.) still
  hardcoded pt-BR — incremental migration as content stabilizes.
- Dashboard sidebar: TRANSLATED via `t.dashboard.nav_*`. Page bodies
  hardcoded pt-BR.
- Patient flow components (welcome-screen, consent-screen, photo-capture,
  results-screen, contact-capture, cart-floater): defaults still pt-BR.
  When tenants need es/en they should configure
  `welcomeTitle`/`welcomeDescription`/etc. via the channel
  `CHANNEL_OVERRIDE_FIELDS` in their target language.

### Email + PDF
- `lib/email.ts`: every builder accepts optional `locale` param;
  `EMAIL_STRINGS` dictionary covers welcome / password reset / lead
  notification / usage alert / analysis delivery in all 3 locales.
  Callers should pass tenant.defaultLocale.
- `lib/pdf/report-template.tsx`: `SkinReport` accepts optional `locale`
  prop; `PDF_STRINGS` dict covers cover / diagnosis / action plan /
  expectations / alert signs / recommendations sections.
  `/api/report/[analysisId]` passes `analysis.tenant.defaultLocale`.

### SAE labels (`lib/sae/labels.ts`)
- Backwards-compatible flat exports (`skinTypeLabels`, `conditionLabels`,
  etc.) return pt-BR — all ~10 pre-existing callers keep working.
- New `*Localized` exports return LocalizedMap keyed by Locale → key.
- `tr(map, key, locale?)` and `trList(map, keys, locale?)` accept either
  flat or LocalizedMap and the optional locale param. Falls back through
  requested locale → pt-BR → raw key.
- `barrierLabel(status, locale?)` returns localized {short, explanation}.

### Claude prompt locale (Commit 5)
- `AnalysisInput.locale` resolved by `analysis.run` from
  channel.overrides.locale → tenant.defaultLocale → "pt-BR" (same chain
  as the patient flow's effectiveLocale). Passed to `claudeAnalyze`.
- Prompt itself stays in pt-BR (validated, KB references, tone block).
  We add a final IDIOMA DA RESPOSTA directive that tells Claude to
  write patient-facing fields in the target language WHILE preserving
  KB IDs (conditions[].name, skin_type, barrier_status, etc.) untranslated
  so the matcher keeps working. Conservative approach: change output
  language without retranslating the prompt scaffolding.
- The directive overrides any tone/brand instructions earlier in the
  prompt and is positioned at the end where it has highest priority.

### Translation review status
All es/en strings carry `REVIEW_TRANSLATION_HUMAN` markers. They were
AI-translated and need native-speaker validation (especially medical /
dermatological terminology) BEFORE going live to real hispanophone or
anglophone clients. Use the LATAM/EN locales today only for internal
testing and demo purposes until a translator review completes.

### Known gaps (intentional, follow-up sprints)
- tRPC error messages / Zod validation messages remain pt-BR
- `matcher.ts` reasons ("Trata: acne...") remain pt-BR — matcher doesn't
  know the locale; passing it through requires expanding the matcher API
- Marketing page bodies (/, /como-funciona, /planos) — translate
  incrementally as content stabilizes
- Dashboard page bodies — same; translate when a paying customer requests
- PDF locale uses tenant default only; channel-locale override would
  require an extra DB join in `/api/report`

## Conventions

- All user-facing text in Portuguese (Brazilian)
- Tailwind classes use brand color names: text-carbone, bg-blanc-casse, border-sable/20, etc.
- Buttons: bg-carbone text-blanc-casse (primary), border border-sable text-terre (secondary)
- Labels: text-[10px] text-pierre uppercase tracking-wider font-light
- Headings: font-serif text-carbone
- Body: text-sm text-pierre font-light
