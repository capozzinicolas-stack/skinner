import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/billing/stripe";
import { getPlan } from "@/lib/billing/plans";
import { db } from "@skinner/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planId = body.planId as string;
    const plan = await getPlan(planId);

    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
    }
    if (plan.deprecated) {
      return NextResponse.json(
        { error: "Plano descontinuado. Contate vendas." },
        { status: 400 }
      );
    }
    const priceId = plan.stripePriceId;

    const origin = req.headers.get("origin") || "https://www.skinner.lat";

    // Check if user is already authenticated (existing tenant upgrading)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (token?.tenantId) {
      // ── Existing tenant upgrading ──────────────────────────────────
      // Upgrades NEVER charge a setup fee — it was already paid (or waived)
      // when the tenant signed up.
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
    // The signup checkout includes BOTH the recurring price (subscription) AND
    // the one-time setup fee, mixed in the same checkout session. Stripe handles
    // this natively in subscription mode: the setup price is charged on the first
    // invoice only, the recurring price renews monthly.
    //
    // Setup fee can be skipped via body.skipSetupFee=true — only set this from
    // a trusted server-side context (e.g. admin-generated payment links). The
    // public /planos page never sets this flag, so self-service signups always
    // pay the setup fee.
    const setupPriceId = plan.stripeSetupPriceId;
    const skipSetup = body.skipSetupFee === true;

    const lineItems: Array<{ price: string; quantity: number }> = [
      { price: priceId, quantity: 1 },
    ];
    if (setupPriceId && !skipSetup) {
      lineItems.push({ price: setupPriceId, quantity: 1 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      success_url: `${origin}/planos?billing=success&plan=${planId}`,
      cancel_url: `${origin}/planos?billing=cancel`,
      metadata: { planId, flow: "signup", skipSetupFee: String(skipSetup) },
      subscription_data: {
        metadata: { planId, skipSetupFee: String(skipSetup) },
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
