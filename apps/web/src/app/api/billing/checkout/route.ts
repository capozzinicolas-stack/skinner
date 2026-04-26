import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/billing/stripe";
import { db } from "@skinner/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planId = body.planId as string;
    const priceId = STRIPE_PRICE_IDS[planId];

    if (!priceId) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://www.skinner.lat";

    // Check if user is already authenticated (existing tenant upgrading)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (token?.tenantId) {
      // ── Existing tenant upgrading ──────────────────────────────────
      const tenantId = token.tenantId as string;
      const tenant = await db.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      let customerId = tenant.subscriptions[0]?.stripeCustomerId;
      if (!customerId || customerId.startsWith("mock_")) {
        const customer = await getStripe().customers.create({
          name: tenant.name,
          metadata: { tenantId, tenantSlug: tenant.slug },
        });
        customerId = customer.id;
      }

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/dashboard/faturamento?billing=success&plan=${planId}`,
        cancel_url: `${origin}/dashboard/faturamento?billing=cancel`,
        metadata: { tenantId, planId, flow: "upgrade" },
        subscription_data: {
          metadata: { tenantId, planId },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // ── New user signup — no account yet ───────────────────────────
    // In subscription mode, Stripe always creates a customer and collects email
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/planos?billing=success&plan=${planId}`,
      cancel_url: `${origin}/planos?billing=cancel`,
      metadata: { planId, flow: "signup" },
      subscription_data: {
        metadata: { planId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json(
      { error: "Erro ao criar sessao de pagamento" },
      { status: 500 }
    );
  }
}
