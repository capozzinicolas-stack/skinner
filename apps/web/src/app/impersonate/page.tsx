"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

/**
 * Impersonation token redemption page. Lives on the app.* subdomain so
 * NextAuth's session cookie is set on the right origin.
 *
 * Flow:
 *   1. Skinner admin POSTs /api/admin/impersonate from admin.* and gets
 *      back a URL pointing here with ?token=xxx.
 *   2. Browser navigates to https://app.skinner.lat/impersonate?token=xxx.
 *   3. This page calls signIn("impersonation", { token, callbackUrl: "/dashboard" }).
 *   4. The "impersonation" CredentialsProvider in lib/auth.ts validates the
 *      token (single-use, 30-min expiry, role checks, audit log) and issues
 *      a session JWT. Cookie lands on app.skinner.lat.
 *   5. NextAuth redirects to /dashboard with the impersonated user signed in.
 *
 * NOT in PUBLIC_PATHS for protected paths — but the token check is the
 * gate; without a valid token the impersonation provider returns null and
 * NextAuth falls through to /login. So the route is safe to be reachable.
 */
function ImpersonationRedeem() {
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token nao fornecido na URL.");
      return;
    }
    // signIn returns a promise that resolves with { ok, error } when
    // redirect: false. We use the default redirect behaviour because the
    // happy path is "land on /dashboard". If the provider rejects the
    // token NextAuth bounces to /login?error=CredentialsSignin — handled
    // by the credential provider's authorize() returning null.
    signIn("impersonation", {
      token,
      callbackUrl: "/dashboard",
    }).catch((err) => {
      console.error("[impersonate] signIn failed:", err);
      setError("Falha ao redimir token. Pode estar expirado ou ja usado.");
    });
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-blanc-casse p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-serif text-xl text-carbone">
          {error ? "Falha na impersonacao" : "Acessando como tenant..."}
        </h1>
        <p className="text-sm text-pierre font-light">
          {error ?? "Aguarde enquanto preparamos sua sessao de suporte."}
        </p>
        {error && (
          <p className="text-xs text-pierre/70 font-light pt-4">
            Volte ao painel admin e gere um novo link.
          </p>
        )}
      </div>
    </main>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-blanc-casse">
          <p className="text-sm text-pierre font-light">Carregando...</p>
        </main>
      }
    >
      <ImpersonationRedeem />
    </Suspense>
  );
}
