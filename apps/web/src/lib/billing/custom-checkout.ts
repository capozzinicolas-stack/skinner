import { getStripe } from "./stripe";

/**
 * Build a Stripe Checkout Session URL for a custom-priced plan negotiated
 * mano-a-mano with the customer. Creates a recurring Price ad-hoc in BRL,
 * persists negotiated limits in session metadata so the webhook can apply
 * them when the tenant is created.
 *
 * Internal plan tier is "enterprise" — we deliberately reuse that label so we
 * don't need to introduce a 4th tier in the PLANS dict and propagate it
 * across z.enums in 5 routers. Limits live on Tenant columns directly, which
 * are independent of the PLANS dict, so the negotiated values flow through
 * intact.
 *
 * Setup fee defaults to skipped — the negotiated price already accounts for
 * onboarding. The admin form can override this if a setup fee was agreed.
 */
export async function buildCustomCheckout(params: {
  origin: string;
  email: string;
  monthlyPriceBRL: number;
  analysisLimit: number;
  commissionRate: number;
  maxUsers: number;
  skipSetupFee: boolean;
  planLabel?: string;
}): Promise<{ url: string; priceId: string }> {
  const stripe = getStripe();

  const price = await stripe.prices.create({
    currency: "brl",
    unit_amount: Math.round(params.monthlyPriceBRL * 100),
    recurring: { interval: "month" },
    product_data: {
      name: `Skinner ${params.planLabel ?? "Custom"} (R$ ${params.monthlyPriceBRL}/mes)`,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: params.email,
    success_url: `${params.origin}/planos?billing=success&plan=custom`,
    cancel_url: `${params.origin}/planos?billing=cancel`,
    metadata: {
      planId: "enterprise",
      flow: "signup",
      skipSetupFee: String(params.skipSetupFee),
      customAnalysisLimit: String(params.analysisLimit),
      customCommissionRate: String(params.commissionRate),
      customMaxUsers: String(params.maxUsers),
      customPlanLabel: params.planLabel ?? "Custom",
      customMonthlyPriceBRL: String(params.monthlyPriceBRL),
    },
    subscription_data: {
      metadata: {
        planId: "enterprise",
        skipSetupFee: String(params.skipSetupFee),
        customAnalysisLimit: String(params.analysisLimit),
        customCommissionRate: String(params.commissionRate),
        customMaxUsers: String(params.maxUsers),
        customPlanLabel: params.planLabel ?? "Custom",
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return { url: session.url, priceId: price.id };
}
