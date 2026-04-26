import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_TO_PLAN } from "@/lib/billing/stripe";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { db } from "@skinner/db";
import type Stripe from "stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = "force-dynamic";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenantId;
  const planId = session.metadata?.planId as PlanId | undefined;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!tenantId || !planId) {
    console.error("[webhook] Missing tenantId or planId in metadata");
    return;
  }

  const planConfig = PLANS[planId];
  if (!planConfig) {
    console.error("[webhook] Unknown plan:", planId);
    return;
  }

  // Update tenant plan
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      plan: planId,
      analysisLimit: planConfig.analysisLimit,
      commissionRate: planConfig.commissionRate,
      excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
    },
  });

  // Create/update subscription record
  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      tenantId,
      plan: planId,
      status: "active",
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      plan: planId,
      status: "active",
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`[webhook] Tenant ${tenantId} upgraded to ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  if (!tenantId) return;

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price?.id;
  const planId = priceId ? PRICE_TO_PLAN[priceId] : null;

  // Map Stripe status to internal status
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    trialing: "active",
  };
  const status = (statusMap[subscription.status] ?? "active") as "active" | "past_due" | "canceled";

  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      tenantId,
      plan: planId ?? "starter",
      status,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    },
    update: {
      plan: planId ?? undefined,
      status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    },
  });

  // If plan changed, update tenant limits
  if (planId && PLANS[planId as PlanId]) {
    const planConfig = PLANS[planId as PlanId];
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        plan: planId,
        analysisLimit: planConfig.analysisLimit,
        commissionRate: planConfig.commissionRate,
        excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
      },
    });
  }

  // If canceled, pause the tenant
  if (status === "canceled") {
    await db.tenant.update({
      where: { id: tenantId },
      data: { status: "paused" },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) return;

  // Log payment as usage event
  await db.usageEvent.create({
    data: {
      tenantId: sub.tenantId,
      type: "payment",
      quantity: 1,
      unitPrice: (invoice.amount_paid ?? 0) / 100,
      total: (invoice.amount_paid ?? 0) / 100,
      metadata: JSON.stringify({
        invoiceId: invoice.id,
        period: invoice.period_start
          ? `${new Date(invoice.period_start * 1000).toISOString()} - ${new Date((invoice.period_end ?? 0) * 1000).toISOString()}`
          : null,
      }),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // No webhook secret configured — parse but skip verification (dev only)
      event = JSON.parse(body) as Stripe.Event;
      console.warn("[webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification");
    }
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        // Ignore other event types
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
