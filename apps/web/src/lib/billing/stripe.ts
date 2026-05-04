import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// Stripe Price ID resolution moved to the DB-backed Plan model managed via
// /admin/planos. See lib/billing/plans.ts for getPlan / getPlanForPrice.
//
// History: previously the internal IDs were `starter` and `growth`. In
// Apr-2026 we renamed them to align Stripe nomenclature with the public
// site: `growth` (entry-level) and `pro` (top tier). In May-2026 the
// hardcoded STRIPE_PRICE_IDS / STRIPE_SETUP_PRICE_IDS / PRICE_TO_PLAN
// constants were removed because they could not stay in sync with admin
// edits without a deploy. All consumers now read priceIds via:
//
//   const plan = await getPlan("growth");
//   const priceId = plan?.stripePriceId;
//
// or for the reverse direction (webhook event with a Stripe priceId):
//
//   const plan = await getPlanForPrice(priceId);
