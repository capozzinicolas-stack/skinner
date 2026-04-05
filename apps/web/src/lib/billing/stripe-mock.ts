/**
 * Mock Stripe client for local development.
 * When STRIPE_SECRET_KEY is set, replace with real Stripe SDK.
 */

import { PLANS, type PlanId } from "./plans";

export type MockSubscription = {
  id: string;
  tenantId: string;
  plan: PlanId;
  status: "active" | "past_due" | "canceled";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

export type MockInvoice = {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: "paid" | "open" | "past_due";
  description: string;
  createdAt: Date;
};

// Check if real Stripe is available
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Generate mock checkout URL
export function createCheckoutUrl(planId: PlanId, tenantId: string): string {
  if (isStripeConfigured()) {
    // TODO: Real Stripe checkout session
    return `/api/billing/checkout?plan=${planId}&tenant=${tenantId}`;
  }
  // Mock: redirect to success directly
  return `/dashboard?billing=success&plan=${planId}`;
}

// Generate mock customer portal URL
export function createPortalUrl(tenantId: string): string {
  if (isStripeConfigured()) {
    // TODO: Real Stripe customer portal
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
