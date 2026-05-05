import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod/v4";
import { buildCustomCheckout } from "@/lib/billing/custom-checkout";

/**
 * Admin-only endpoint to generate a custom payment link for a manually
 * quoted client. Validates skinner_admin role from the JWT before doing
 * anything sensitive. Returns the Stripe Checkout URL ready to share via
 * WhatsApp / email. The link is single-session — once consumed, the customer
 * can't re-use it.
 */
const bodySchema = z.object({
  email: z.email(),
  monthlyPriceBRL: z.number().positive().max(99999),
  analysisLimit: z.number().int().positive().max(999999),
  commissionRate: z.number().min(0).max(1),
  maxUsers: z.number().int().positive().max(999),
  skipSetupFee: z.boolean(),
  planLabel: z.string().min(1).max(50).optional(),
  // Capability override for this custom-priced tenant. undefined → inherit
  // from the underlying plan (currently always "enterprise" for customs).
  // true/false → forces the override on Tenant.customAllowIdentityLimit.
  allowIdentityLimit: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "skinner_admin") {
      return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "https://www.skinner.lat";
    const { url } = await buildCustomCheckout({ origin, ...parsed.data });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing/admin-link] Error:", err);
    return NextResponse.json(
      { error: "Erro ao gerar link de pagamento" },
      { status: 500 }
    );
  }
}
