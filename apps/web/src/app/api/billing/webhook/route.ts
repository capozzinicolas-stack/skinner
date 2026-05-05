import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { getPlan, getPlanForPrice, type PlanId } from "@/lib/billing/plans";
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

  const planConfig = await getPlan(planId);
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

  // Create tenant — persist skipSetupFee flag so future audits can tell whether
  // this tenant paid the setup or had it waived (e.g. admin-generated link).
  // Tenant + User + Subscription are created in a single transaction so a
  // partial failure cannot leave an orphan user without a tenant or a tenant
  // without billing context. Stripe metadata + welcome email run AFTER the
  // commit because they are external side effects we don't want to roll back.
  const skipSetupFee = session.metadata?.skipSetupFee === "true";

  // Custom plan negotiations (admin-generated link) inject negotiated limits
  // via session metadata. When present, they override the tier defaults from
  // PLANS so the tenant gets exactly what was sold. planId stays "enterprise"
  // for these (see lib/billing/custom-checkout.ts for rationale). When absent,
  // we fall through to the standard PLANS-based limits.
  const customAnalysisLimit = session.metadata?.customAnalysisLimit
    ? parseInt(session.metadata.customAnalysisLimit, 10)
    : null;
  const customCommissionRate = session.metadata?.customCommissionRate
    ? parseFloat(session.metadata.customCommissionRate)
    : null;
  const customPlanLabel = session.metadata?.customPlanLabel ?? null;
  const customMonthlyPriceParsed = session.metadata?.customMonthlyPriceBRL
    ? parseFloat(session.metadata.customMonthlyPriceBRL)
    : null;
  const isCustomPlan =
    customAnalysisLimit !== null && !Number.isNaN(customAnalysisLimit);

  const tenantLimits = isCustomPlan
    ? {
        analysisLimit: customAnalysisLimit!,
        commissionRate:
          customCommissionRate !== null && !Number.isNaN(customCommissionRate)
            ? customCommissionRate
            : planConfig.commissionRate,
        // Custom plans sell a fixed monthly volume; overage billing is
        // intentionally disabled so we don't surprise the customer with
        // line items beyond what was negotiated.
        excessCostPerAnalysis: 0,
      }
    : {
        analysisLimit: planConfig.analysisLimit,
        commissionRate: planConfig.commissionRate,
        excessCostPerAnalysis: planConfig.excessCostPerAnalysis,
      };

  // Display overrides for custom-plan tenants. Both fields stay null for
  // standard signups so the UI falls back to Plan.name + Plan.monthlyPriceBRL.
  const tenantPlanLabel = isCustomPlan ? customPlanLabel : null;
  const tenantCustomPrice =
    isCustomPlan &&
    customMonthlyPriceParsed !== null &&
    !Number.isNaN(customMonthlyPriceParsed)
      ? customMonthlyPriceParsed
      : null;

  const tenant = await db.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        name: customerName,
        slug,
        plan: planId,
        ...tenantLimits,
        skipSetupFee,
        planLabel: tenantPlanLabel,
        customMonthlyPriceBRL: tenantCustomPrice,
        tenantConfig: { create: {} },
      },
    });

    await tx.user.create({
      data: {
        email: customerEmail,
        name: customerName,
        password: hashSync(tempPassword, 10),
        role: "b2b_admin",
        tenantId: created.id,
      },
    });

    await tx.subscription.create({
      data: {
        tenantId: created.id,
        plan: planId,
        status: "active",
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return created;
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
  const matchedPlan = priceId ? await getPlanForPrice(priceId) : null;
  const planId = matchedPlan?.id ?? null;

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
      plan: planId ?? "growth",
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

  if (matchedPlan) {
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        plan: matchedPlan.id,
        analysisLimit: matchedPlan.analysisLimit,
        commissionRate: matchedPlan.commissionRate,
        excessCostPerAnalysis: matchedPlan.excessCostPerAnalysis,
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

  // If the subscription was previously past_due (cartão recusado, depois pago),
  // restore tenant + subscription to active.
  if (sub.status === "past_due") {
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: "active" },
    });
    await db.tenant.update({
      where: { id: sub.tenantId },
      data: { status: "active" },
    });
    console.log(`[webhook] invoice.paid — recovered tenant ${sub.tenantId} from past_due`);
  }

  // RECURRING RENEWAL: reset the per-period analysis counter so the customer
  // gets a fresh batch of credits aligned with their billing cycle. Only fires
  // on `subscription_cycle` (Stripe's name for recurring renewals); first
  // invoice from signup is `subscription_create` and the tenant already starts
  // at 0, so we skip. Upgrades (`subscription_update`) carry the counter over
  // because the customer is still inside their current period.
  if (invoice.billing_reason === "subscription_cycle") {
    await db.tenant.update({
      where: { id: sub.tenantId },
      data: { analysisUsed: 0 },
    });
    // Sync stored period boundaries so future overdrafts/alerts compute on the
    // new window. Stripe puts the new period on the invoice itself.
    const lineItem = invoice.lines?.data?.[0] as any;
    if (lineItem?.period?.start && lineItem?.period?.end) {
      await db.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: new Date(lineItem.period.start * 1000),
          currentPeriodEnd: new Date(lineItem.period.end * 1000),
        },
      });
    }
    console.log(`[webhook] invoice.paid — tenant ${sub.tenantId} cycle renewed, analysisUsed reset to 0`);
  }

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

/**
 * Handle invoice.payment_failed: cartón recusado o saldo insuficiente.
 * On first failure we mark the subscription as past_due (tenant continues to
 * operate during Stripe's smart retry window — typically 3 retry attempts over
 * 1 week). On the 2nd consecutive failure (attempt_count >= 2) we PAUSE the
 * tenant so analyses cannot continue burning credits unpaid.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) {
    console.warn(`[webhook] payment_failed for unknown subscription ${subscriptionId}`);
    return;
  }

  const attemptCount = (invoice as any).attempt_count ?? 1;

  await db.subscription.update({
    where: { id: sub.id },
    data: { status: "past_due" },
  });

  if (attemptCount >= 2) {
    await db.tenant.update({
      where: { id: sub.tenantId },
      data: { status: "paused" },
    });
    console.log(
      `[webhook] invoice.payment_failed — tenant ${sub.tenantId} paused after ${attemptCount} failed attempts`
    );
  } else {
    console.log(
      `[webhook] invoice.payment_failed — tenant ${sub.tenantId} marked past_due (attempt ${attemptCount})`
    );
  }

  await db.usageEvent.create({
    data: {
      tenantId: sub.tenantId,
      type: "payment_failed",
      quantity: 1,
      unitPrice: (invoice.amount_due ?? 0) / 100,
      total: (invoice.amount_due ?? 0) / 100,
      metadata: JSON.stringify({ invoiceId: invoice.id, attemptCount }),
    },
  });
}

/**
 * Handle charge.refunded: admin issued a refund in Stripe Dashboard.
 * We pause the tenant immediately. Full refunds → cancel the subscription too.
 * Partial refunds → keep the subscription, just pause and let admin re-activate
 * manually (we cannot tell from the webhook alone whether a partial refund
 * means "service still due" or "service ended").
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const customerId = charge.customer as string | null;
  if (!customerId) return;

  const sub = await db.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) {
    console.warn(`[webhook] charge.refunded for unknown customer ${customerId}`);
    return;
  }

  const fullyRefunded = charge.amount_refunded === charge.amount;

  await db.tenant.update({
    where: { id: sub.tenantId },
    data: { status: "paused" },
  });

  if (fullyRefunded) {
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: "canceled" },
    });
    // Best-effort: also cancel the subscription in Stripe so it doesn't keep
    // billing. Catch errors so a Stripe-side issue doesn't block our handler.
    if (sub.stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
      } catch (err) {
        console.warn(`[webhook] Could not cancel Stripe subscription:`, err);
      }
    }
  }

  await db.usageEvent.create({
    data: {
      tenantId: sub.tenantId,
      type: "refund",
      quantity: 1,
      unitPrice: (charge.amount_refunded ?? 0) / 100,
      total: (charge.amount_refunded ?? 0) / 100,
      metadata: JSON.stringify({ chargeId: charge.id, fullyRefunded }),
    },
  });

  console.log(
    `[webhook] charge.refunded — tenant ${sub.tenantId} paused (${fullyRefunded ? "full" : "partial"} refund)`
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // SECURITY: in production, STRIPE_WEBHOOK_SECRET MUST be set. Without it,
  // anyone could forge webhook payloads and create tenants for free.
  // In development we allow falling back to unverified parsing for local testing
  // (e.g. `stripe trigger` without the CLI relay) but log a loud warning.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[webhook] FATAL: STRIPE_WEBHOOK_SECRET is not set in production. Refusing to process events.");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    console.warn("[webhook] No STRIPE_WEBHOOK_SECRET — running in dev mode without verification");
  }

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // IDEMPOTENCY: Stripe re-delivers events on timeout. Track processed event IDs
  // and short-circuit duplicates. The dedupe table is small and bounded by
  // Stripe's retry window (~3 days), so we don't need TTL cleanup right now.
  //
  // Two-phase strategy: insert the dedupe row BEFORE the handler so concurrent
  // duplicate deliveries don't race-process the same event, then DELETE it if
  // the handler throws so Stripe's retry can re-process the event cleanly.
  // Without the rollback, a partial failure (e.g. DB hiccup mid-transaction)
  // would be marked "processed" and silently dropped on retry — a real bug we
  // observed during the pre-launch audit.
  let webhookEventInserted = false;
  try {
    const existing = await db.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing) {
      console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    await db.webhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
    webhookEventInserted = true;
  } catch (err) {
    // If the dedupe write fails (DB hiccup, unique race), log and continue —
    // the inner handlers are already idempotent at the row level (upserts).
    console.warn(`[webhook] Dedupe check failed for ${event.id}, continuing:`, err);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    // Roll back the dedupe row so Stripe's retry can re-execute the handler
    // from scratch. Without this, a half-failed handler (e.g. tenant created
    // but subscription not) would never get a second chance.
    if (webhookEventInserted) {
      try {
        await db.webhookEvent.delete({
          where: { stripeEventId: event.id },
        });
      } catch (deleteErr) {
        console.warn(`[webhook] Failed to roll back dedupe row for ${event.id}:`, deleteErr);
      }
    }
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
