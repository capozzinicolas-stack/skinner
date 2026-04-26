import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// Stripe Price IDs mapped to internal plan IDs
export const STRIPE_PRICE_IDS: Record<string, string> = {
  starter: "price_1TQH3RPTPxVx2t2Rg4i8jPOZ",
  growth: "price_1TQH7WPTPxVx2t2RQkmaIDRY",
};

// Reverse lookup: price ID → plan ID
export const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_IDS).map(([plan, price]) => [price, plan])
);
