import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createHash } from "crypto";
import { db } from "@skinner/db";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        // Portal segmentation. The login form sends "admin" when on
        // admin.skinner.lat and "client" otherwise. We refuse to issue a JWT
        // when the role doesn't match the portal so a tenant user cannot
        // authenticate on the admin subdomain (and vice versa). Defaults to
        // "client" if absent — that's the more restrictive choice (admins
        // must explicitly come through admin.skinner.lat).
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        });

        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        const mode = credentials.mode === "admin" ? "admin" : "client";
        if (mode === "admin" && user.role !== "skinner_admin") return null;
        if (mode === "client" && user.role === "skinner_admin") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug,
        };
      },
    }),
    // Magic-token impersonation provider for skinner_admin → tenant support.
    // Only redeems tokens from the impersonation_tokens table — never accepts
    // a password. See app/api/admin/impersonate/route.ts for issuance and the
    // ImpersonationToken model docstring in schema.prisma for the safety
    // contract. Token is single-use, 30-min expiry, hashed in DB.
    CredentialsProvider({
      id: "impersonation",
      name: "impersonation",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const tokenHash = createHash("sha256")
          .update(credentials.token)
          .digest("hex");
        const row = await db.impersonationToken.findUnique({
          where: { tokenHash },
          include: {
            targetUser: { include: { tenant: true } },
            skinnerAdmin: true,
            tenant: true,
          },
        });
        // Re-validate every constraint at redemption time — even though we
        // checked them at issuance, state can change in the 30-min window
        // (admin demoted, user role changed, tenant deleted, etc.). Defense
        // in depth.
        if (!row) return null;
        if (row.usedAt) return null; // single-use enforcement
        if (row.expiresAt.getTime() < Date.now()) return null;
        if (row.skinnerAdmin.role !== "skinner_admin") return null;
        if (row.targetUser.role !== "b2b_admin") return null;
        if (!row.targetUser.tenantId) return null;
        if (row.targetUser.tenantId !== row.tenantId) return null;
        if (row.tenant.status === "deleted") return null;

        // Mark used + audit log inside a transaction so a crash between
        // them doesn't leave an unattributable session running.
        await db.$transaction([
          db.impersonationToken.update({
            where: { id: row.id },
            data: { usedAt: new Date() },
          }),
          db.usageEvent.create({
            data: {
              tenantId: row.tenantId,
              type: "impersonation_started",
              quantity: 1,
              metadata: JSON.stringify({
                tokenId: row.id,
                skinnerAdminId: row.skinnerAdminId,
                skinnerAdminEmail: row.skinnerAdmin.email,
                targetUserId: row.targetUserId,
                targetUserEmail: row.targetUser.email,
              }),
            },
          }),
        ]);

        return {
          id: row.targetUser.id,
          email: row.targetUser.email,
          name: row.targetUser.name,
          role: row.targetUser.role,
          tenantId: row.targetUser.tenantId,
          tenantSlug: row.targetUser.tenant?.slug,
          // Markers carried through to the JWT/session so the dashboard
          // banner knows to render and Exit knows what to do.
          impersonatedBy: row.skinnerAdminId,
          impersonatedByEmail: row.skinnerAdmin.email,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        // Impersonation markers — undefined for normal credentials login.
        // Once set on the JWT they ride with every subsequent request until
        // the user signs out (clearing the cookie).
        token.impersonatedBy = (user as any).impersonatedBy;
        token.impersonatedByEmail = (user as any).impersonatedByEmail;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantSlug = token.tenantSlug;
        (session.user as any).impersonatedBy = (token as any).impersonatedBy;
        (session.user as any).impersonatedByEmail = (token as any).impersonatedByEmail;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
