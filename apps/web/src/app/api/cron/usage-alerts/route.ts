import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";
import { sendEmail, buildUsageAlertEmail } from "@/lib/email";

/**
 * Daily cron: notify B2B admins when their tenant crosses 80% or 100% of the
 * monthly analysis quota. Idempotent within the current billing period via
 * UsageEvent flags (alert_80, alert_100) — once we send an alert this period,
 * we skip until the next cycle resets via Stripe invoice.paid webhook.
 *
 * Auth: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}`. Reject if
 * the secret is missing or wrong. Local dev can hit the endpoint without
 * auth when CRON_SECRET is unset.
 *
 * Schedule: see vercel.json — daily 12:00 UTC (09:00 BRT).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev fallback
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // We use the latest Subscription per tenant to anchor "this period". Tenants
  // without a subscription (admin-created, mock plans) fall back to a 30-day
  // rolling window from the last alert reset.
  const tenants = await db.tenant.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      analysisUsed: true,
      analysisLimit: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { currentPeriodStart: true, currentPeriodEnd: true },
      },
      users: {
        where: { role: "b2b_admin" },
        select: { email: true },
      },
    },
  });

  let sent80 = 0;
  let sent100 = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    if (tenant.analysisLimit <= 0) {
      skipped += 1;
      continue;
    }
    const pct = tenant.analysisUsed / tenant.analysisLimit;
    if (pct < 0.8) {
      skipped += 1;
      continue;
    }

    const periodStart =
      tenant.subscriptions[0]?.currentPeriodStart ??
      new Date(Date.now() - 30 * 86_400_000);

    const desiredType = pct >= 1 ? "alert_100" : "alert_80";

    // Skip if we already sent this alert this period.
    const already = await db.usageEvent.findFirst({
      where: {
        tenantId: tenant.id,
        type: desiredType,
        createdAt: { gte: periodStart },
      },
      select: { id: true },
    });
    if (already) {
      skipped += 1;
      continue;
    }

    // Send to all b2b_admin users of this tenant.
    if (tenant.users.length === 0) {
      skipped += 1;
      continue;
    }
    const upgradeUrl = "https://app.skinner.lat/dashboard/faturamento";
    const { subject, html } = buildUsageAlertEmail({
      tenantName: tenant.name,
      usagePct: pct,
      used: tenant.analysisUsed,
      limit: tenant.analysisLimit,
      upgradeUrl,
    });
    await Promise.all(
      tenant.users.map((u) => sendEmail({ to: u.email, subject, html }))
    );

    await db.usageEvent.create({
      data: {
        tenantId: tenant.id,
        type: desiredType,
        quantity: 1,
        metadata: JSON.stringify({
          pct,
          used: tenant.analysisUsed,
          limit: tenant.analysisLimit,
        }),
      },
    });

    if (pct >= 1) sent100 += 1;
    else sent80 += 1;
  }

  return NextResponse.json({
    ok: true,
    tenantsChecked: tenants.length,
    sent80,
    sent100,
    skipped,
  });
}
