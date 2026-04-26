import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_TO_PLAN } from "@/lib/billing/stripe";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { db } from "@skinner/db";
import { hashSync } from "bcryptjs";
import { sendEmail, buildWelcomeEmail } from "@/lib/email";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function generateSlug(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const planId = session.metadata?.planId as PlanId | undefined;
  const flow = session.metadata?.flow ?? "signup";
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!planId) {
    console.error("[webhook] Missing planId in metadata");
    return;
  }

  const planConfig = PLANS[planId];
  if (!planConfig) {
    console.error("[webhook] Unknown plan:", planId);
    return;
  }

  // ── Existing tenant upgrade ────────────────────────────────────────
  if (flow === "upgrade" && session.metadata?.tenantId) {
    const tenantId = session.metadata.tenantId;
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        plan: planId,
        analysisLimit: planConfig.analysisLimit,
        commissionRate: planConfig.commissionRate,
        excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
      },
    });

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
    return;
  }

  // ── New signup — create tenant + user ──────────────────────────────
  const customerEmail = session.customer_details?.email ?? (session as any).customer_email;
  if (!customerEmail) {
    console.error("[webhook] No customer email in checkout session");
    return;
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email: customerEmail } });
  if (existingUser) {
    console.log(`[webhook] User ${customerEmail} already exists, skipping creation`);
    // Still update subscription if needed
    if (existingUser.tenantId) {
      await db.tenant.update({
        where: { id: existingUser.tenantId },
        data: {
          plan: planId,
          analysisLimit: planConfig.analysisLimit,
          commissionRate: planConfig.commissionRate,
          excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
        },
      });
      await db.subscription.upsert({
        where: { stripeSubscriptionId: subscriptionId },
        create: {
          tenantId: existingUser.tenantId,
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
        },
      });
    }
    return;
  }

  // Generate temp password and slug
  const tempPassword = generateTempPassword();
  const slug = generateSlug(customerEmail);
  const customerName = session.customer_details?.name ?? customerEmail.split("@")[0];

  // Create tenant
  const tenant = await db.tenant.create({
    data: {
      name: customerName,
      slug,
      plan: planId,
      analysisLimit: planConfig.analysisLimit,
      commissionRate: planConfig.commissionRate,
      excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
      tenantConfig: { create: {} },
    },
  });

  // Create user with temp password
  await db.user.create({
    data: {
      email: customerEmail,
      name: customerName,
      password: hashSync(tempPassword, 10),
      role: "b2b_admin",
      tenantId: tenant.id,
    },
  });

  // Create subscription record
  await db.subscription.create({
    data: {
      tenantId: tenant.id,
      plan: planId,
      status: "active",
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Update Stripe subscription metadata with tenantId for future webhooks
  try {
    await getStripe().subscriptions.update(subscriptionId, {
      metadata: { tenantId: tenant.id, planId },
    });
  } catch (err) {
    console.error("[webhook] Failed to update Stripe subscription metadata:", err);
  }

  // Send welcome email with temp password
  const loginUrl = "https://app.skinner.lat/login";
  const { subject, html } = buildWelcomeEmail({
    tenantName: customerName,
    email: customerEmail,
    tempPassword,
    planName: planConfig.name,
    loginUrl,
  });
  await sendEmail({ to: customerEmail, subject, html });

  console.log(`[webhook] New signup: ${customerEmail} → tenant ${tenant.slug} (${planId})`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  if (!tenantId) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const planId = priceId ? PRICE_TO_PLAN[priceId] : null;

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

  await db.usageEvent.create({
    data: {
      tenantId: sub.tenantId,
      type: "payment",
      quantity: 1,
      unitPrice: (invoice.amount_paid ?? 0) / 100,
      total: (invoice.amount_paid ?? 0) / 100,
      metadata: JSON.stringify({ invoiceId: invoice.id }),
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
      event = JSON.parse(body) as Stripe.Event;
      console.warn("[webhook] No STRIPE_WEBHOOK_SECRET — skipping verification");
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
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
