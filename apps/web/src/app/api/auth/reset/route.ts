import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { hashSync } from "bcryptjs";
import { db } from "@skinner/db";

/**
 * Consume a password reset token and set a new password. Token is matched by
 * SHA-256 hash. Expired or already-used tokens are rejected with 400. On
 * success we mark the token usedAt = now (single-use) and stamp
 * passwordChangedAt on the user so the temp-password banner disappears.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokenPlain = typeof body?.token === "string" ? body.token : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!tokenPlain || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Token invalido ou senha curta (minimo 8 caracteres)." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(tokenPlain).digest("hex");
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!record) {
      return NextResponse.json({ error: "Link invalido." }, { status: 400 });
    }
    if (record.usedAt) {
      return NextResponse.json({ error: "Este link ja foi utilizado." }, { status: 400 });
    }
    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: {
          password: hashSync(newPassword, 10),
          passwordChangedAt: new Date(),
        },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset] Error:", err);
    return NextResponse.json({ error: "Erro ao processar a redefinicao." }, { status: 500 });
  }
}
