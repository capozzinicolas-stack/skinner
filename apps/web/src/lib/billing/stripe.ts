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

// Stripe Price IDs mapped to internal plan IDs (recurring monthly).
// Renaming history: previously the internal IDs were `starter` and `growth`.
// In Apr-2026 we renamed them to align Stripe nomenclature with the public
// site: `growth` (entry-level) and `pro` (top tier). The internal `enterprise`
// tier remains custom-priced and has no Stripe price ID here.
//
// ⚠️ TEMPORARY E2E TEST OVERRIDE — growth price points to a R$1/month test
// product. MUST be reverted to "price_1TRwEKAFYuZWxKCyOL5onvKK" after the
// production smoke test is validated. Do NOT merge this temporary value to
// long-running branches.
export const STRIPE_PRICE_IDS: Record<string, string> = {
  growth: "price_1TRzi9AFYuZWxKCysp7PJYoc", // E2E TEST — restore "price_1TRwEKAFYuZWxKCyOL5onvKK"
  pro: "price_1TRwFsAFYuZWxKCyWuHui0r8",
};

// Stripe Price IDs for one-time setup fees (charged once on signup, NOT on upgrade).
// Admin can waive these per-tenant via Tenant.skipSetupFee (set during custom-plan
// creation in /admin/tenants).
//
// ⚠️ TEMPORARY E2E TEST — `growth` setup intentionally omitted so the test
// charges only R$1 instead of R$1 + R$990 setup. MUST restore the entry to
// "price_1TRwKuAFYuZWxKCyKjlq990r" after the test is validated.
export const STRIPE_SETUP_PRICE_IDS: Record<string, string> = {
  // growth: "price_1TRwKuAFYuZWxKCyKjlq990r", // ← E2E TEST: restore this line
  pro: "price_1TRwLCAFYuZWxKCy1knwa7Kh",
};

// Reverse lookup: price ID → plan ID (only recurring prices map back to plans;
// setup prices are out of band and resolved separately).
export const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_IDS).map(([plan, price]) => [price, plan])
);
