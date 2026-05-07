import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@skinner/db";
import { createHash, randomBytes } from "crypto";

/**
 * Issues a one-time, 30-minute impersonation token that lets the calling
 * skinner_admin sign into the target tenant's dashboard as a b2b_admin
 * user — without using the tenant's password.
 *
 * Security contract (mirrored at redemption in lib/auth.ts impersonation
 * provider — defense in depth):
 *
 *   1. Caller must be skinner_admin (re-checked via JWT, not just route prefix).
 *   2. Target tenant must exist and be != "deleted".
 *   3. Target tenant must have at least one b2b_admin user — that's who we
 *      impersonate. Tenants with only analyst/viewer users can't be entered
 *      this way (request a b2b_admin upgrade for the tenant first).
 *   4. We pick the FIRST b2b_admin (oldest by createdAt) deterministically.
 *      Different admins of the same tenant getting different sessions
 *      complicates audit. Sticking with one is simpler and that's the
 *      "owner" semantically anyway.
 *   5. Plain token: 32 random bytes, hex-encoded → 64 chars. Plain returned
 *      ONCE in the URL; only its sha256 hash is stored.
 *   6. 30-minute expiry from creation, single-use (usedAt stamped on
 *      redemption inside the auth provider).
 *   7. Redemption URL points to app.skinner.lat/impersonate so cookies are
 *      set on the right subdomain. Caller decides where to navigate (we
 *      return both the URL and the bare token if they want to do something
 *      else with it).
 *
 * Audit: the redemption side writes a UsageEvent("impersonation_started").
 * Issuance does NOT write one — keeps the signal clean (someone clicking
 * "generate URL" but never opening it shouldn't pollute the log).
 */
export async function POST(req: NextRequest) {
  const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!jwt || jwt.role !== "skinner_admin" || !jwt.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tenantId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const tenantId = body.tenantId;
  if (!tenantId || typeof tenantId !== "string") {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, status: true, name: true, slug: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });
  }
  if (tenant.status === "deleted") {
    return NextResponse.json(
      { error: "Tenant excluido — impersonation bloqueada por LGPD" },
      { status: 403 }
    );
  }

  // First b2b_admin of the tenant. Deterministic pick to keep audit clean
  // when a tenant has multiple admins.
  const targetUser = await db.user.findFirst({
    where: { tenantId, role: "b2b_admin" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true },
  });
  if (!targetUser) {
    return NextResponse.json(
      {
        error:
          "Este tenant nao tem nenhum usuario b2b_admin. Crie um antes de impersonar.",
      },
      { status: 422 }
    );
  }

  // Sanity-check the caller still exists + is still admin (handles the
  // edge case of a JWT held after the user was demoted/deleted).
  const adminUser = await db.user.findUnique({
    where: { id: jwt.sub },
    select: { id: true, role: true, email: true },
  });
  if (!adminUser || adminUser.role !== "skinner_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plainToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(plainToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await db.impersonationToken.create({
    data: {
      tokenHash,
      skinnerAdminId: adminUser.id,
      tenantId: tenant.id,
      targetUserId: targetUser.id,
      expiresAt,
    },
  });

  // Build the redemption URL on the app.* subdomain. In dev (localhost), the
  // current origin is fine. In prod we MUST point to app.skinner.lat
  // because cookies are scoped per subdomain — setting them on admin.* and
  // then redirecting to app.* would leave the app side unauthenticated.
  const host = req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  let redemptionOrigin = `${proto}://${host}`;
  if (host.startsWith("admin.")) {
    redemptionOrigin = `${proto}://${host.replace(/^admin\./, "app.")}`;
  }
  const url = `${redemptionOrigin}/impersonate?token=${plainToken}`;

  return NextResponse.json({
    url,
    expiresAt: expiresAt.toISOString(),
    tenantName: tenant.name,
    targetUserEmail: targetUser.email,
  });
}
