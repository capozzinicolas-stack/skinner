/**
 * Billing utilities — uses real Stripe when configured, mock otherwise.
 */

import { PLANS, type PlanId } from "./plans";

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

// Calculate monthly bill for a tenant
export function calculateMonthlyBill(
  plan: PlanId,
  analysisUsed: number,
  commissionsTotal: number
): {
  baseFee: number;
  excessAnalyses: number;
  excessCost: number;
  commissionCost: number;
  total: number;
} {
  const planConfig = PLANS[plan];
  const baseFee = planConfig.monthlyPrice ?? 0;
  const excessAnalyses = Math.max(0, analysisUsed - planConfig.analysisLimit);
  const excessCost = excessAnalyses * planConfig.excessCostPerAnalysis;
  const commissionCost = commissionsTotal * planConfig.commissionRate;

  return {
    baseFee,
    excessAnalyses,
    excessCost,
    commissionCost,
    total: baseFee + excessCost + commissionCost,
  };
}
