/**
 * Billing utilities — uses real Stripe when configured, mock otherwise.
 */

import type { Plan, PlanId } from "./plans";

// Check if real Stripe is available
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Generate checkout URL — real Stripe goes through /api/billing/checkout
export function createCheckoutUrl(planId: PlanId, tenantId: string): string {
  if (isStripeConfigured()) {
    return `/api/billing/checkout?plan=${planId}&tenant=${tenantId}`;
  }
  // Mock: redirect to success directly
  return `/dashboard?billing=success&plan=${planId}`;
}

// Generate customer portal URL
export function createPortalUrl(tenantId: string): string {
  if (isStripeConfigured()) {
    return `/api/billing/portal?tenant=${tenantId}`;
  }
  return `/dashboard/faturamento`;
}

/**
 * Calculate monthly bill for a tenant. Pure function — caller resolves the
 * Plan via getPlan() and passes it. Keeping this sync makes it easy to test
 * and avoids tying the financial math to the cache layer.
 *
 * Falls back to safe defaults when plan is null (deleted plan, missing
 * row) so the UI never blows up on a stale tenant; baseFee 0 means we don't
 * pretend to charge for a plan that doesn't exist anymore.
 */
export function calculateMonthlyBill(
  plan: Plan | null,
  analysisUsed: number,
  commissionsTotal: number
): {
  baseFee: number;
  excessAnalyses: number;
  excessCost: number;
  commissionCost: number;
  total: number;
} {
  const baseFee = plan?.monthlyPriceBRL ?? 0;
  const limit = plan?.analysisLimit ?? Number.MAX_SAFE_INTEGER;
  const excessRate = plan?.excessCostPerAnalysis ?? 0;
  const commissionRate = plan?.commissionRate ?? 0;

  const excessAnalyses = Math.max(0, analysisUsed - limit);
  const excessCost = excessAnalyses * excessRate;
  const commissionCost = commissionsTotal * commissionRate;

  return {
    baseFee,
    excessAnalyses,
    excessCost,
    commissionCost,
    total: baseFee + excessCost + commissionCost,
  };
}
