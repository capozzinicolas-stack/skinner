import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@skinner/db";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";

/**
 * Issue a one-shot password reset token. We store ONLY the SHA-256 hash of the
 * token; the plain token is sent via email link. 1h expiry, single-use.
 *
 * For privacy, we always return 200 even if the email is unknown — leaking
 * "this email exists" is a known reconnaissance vector.
 */
export const dynamic = "force-dynamic";

const EXPIRY_MINUTES = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // Always respond with success — see comment above.
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate token (256 bits of entropy, URL-safe base64)
    const tokenPlain = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(tokenPlain).digest("hex");
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60_000);

    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const origin = req.headers.get("origin") || "https://app.skinner.lat";
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(tokenPlain)}`;
    const { subject, html } = buildPasswordResetEmail({
      resetUrl,
      expiresInMinutes: EXPIRY_MINUTES,
    });
    await sendEmail({ to: email, subject, html });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/forgot] Error:", err);
    // Even on error, do not leak details to the caller.
    return NextResponse.json({ ok: true });
  }
}
