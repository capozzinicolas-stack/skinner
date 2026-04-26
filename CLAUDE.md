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

### Skin Projection (Gemini)
- Generates 2 images: 8 weeks (-50%) and 12 weeks (-80%) improvement
- Uses Gemini 2.5 Flash Image model (~$0.12 per call, rate limited to 3/hour/IP)
- Receives: patient photo, detected conditions, primary objective, AND recommended products with activeIngredients
- Prompt template editable via `/admin/prompt` → "Projecao de Imagem" tab → stored in `PlatformConfig.projectionPromptTemplate`
- Template variables: {intensityLabel}, {weeks}, {objective}, {conditionsList}, {conditionEdits}, {productsSection}
- Falls back to DEFAULT_PROMPT_TEMPLATE when custom template is empty

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
