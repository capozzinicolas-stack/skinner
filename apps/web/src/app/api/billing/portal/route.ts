import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/billing/stripe";
import { db } from "@skinner/db";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const subscription = await db.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription?.stripeCustomerId || subscription.stripeCustomerId.startsWith("mock_")) {
      return NextResponse.json(
        { error: "Nenhuma assinatura Stripe encontrada. Assine um plano primeiro." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "https://app.skinner.lat";
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/dashboard/faturamento`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal] Error:", err);
    return NextResponse.json(
      { error: "Erro ao abrir portal de pagamento" },
      { status: 500 }
    );
  }
}
