"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

type Copy = {
  eyebrow: string;
  title: string;
  invalidLink: string;
  successText: string;
  redirecting: string;
  newPasswordLabel: string;
  confirmLabel: string;
  minLengthHint: string;
  submit: string;
  submitting: string;
  errorMin: string;
  errorMismatch: string;
  errorGeneric: string;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Nova senha",
    title: "Redefina sua senha",
    invalidLink: "Link inválido. Solicite um novo em \"Esqueci minha senha\".",
    successText: "Senha redefinida com sucesso.",
    redirecting: "Redirecionando para o login...",
    newPasswordLabel: "Nova senha",
    confirmLabel: "Confirmar nova senha",
    minLengthHint: "Mínimo 8 caracteres.",
    submit: "Redefinir senha",
    submitting: "Redefinindo...",
    errorMin: "A senha deve ter ao menos 8 caracteres.",
    errorMismatch: "As senhas não coincidem.",
    errorGeneric: "Erro ao redefinir a senha.",
  },
  es: {
    eyebrow: "Nueva contraseña",
    title: "Restablece tu contraseña",
    invalidLink: "Link inválido. Solicita uno nuevo en \"Olvidaste tu contraseña\".",
    successText: "Contraseña restablecida con éxito.",
    redirecting: "Redirigiendo al login...",
    newPasswordLabel: "Nueva contraseña",
    confirmLabel: "Confirmar nueva contraseña",
    minLengthHint: "Mínimo 8 caracteres.",
    submit: "Restablecer contraseña",
    submitting: "Restableciendo...",
    errorMin: "La contraseña debe tener al menos 8 caracteres.",
    errorMismatch: "Las contraseñas no coinciden.",
    errorGeneric: "Error al restablecer la contraseña.",
  },
  en: {
    eyebrow: "New password",
    title: "Reset your password",
    invalidLink: "Invalid link. Request a new one at \"Forgot password\".",
    successText: "Password reset successfully.",
    redirecting: "Redirecting to sign-in...",
    newPasswordLabel: "New password",
    confirmLabel: "Confirm new password",
    minLengthHint: "Minimum 8 characters.",
    submit: "Reset password",
    submitting: "Resetting...",
    errorMin: "Password must be at least 8 characters.",
    errorMismatch: "Passwords do not match.",
    errorGeneric: "Error resetting password.",
  },
};

function ResetPasswordForm() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) {
      setError(c.errorMin);
      return;
    }
    if (pwd !== confirm) {
      setError(c.errorMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? c.errorGeneric);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen relative overflow-hidden bg-gradient-to-b from-[#3D342C] via-[#7C7269] to-[#3D342C]">
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
        <div className="text-center mb-10">
          <img
            src="/brand/logo-primary.png"
            alt="Skinner"
            className="h-[140px] mx-auto mb-6 object-contain brightness-0 invert"
          />
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sable/80 mb-3">{c.eyebrow}</p>
          <h1 className="font-serif text-3xl md:text-4xl text-blanc-casse italic">{c.title}</h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-blanc-casse/95 backdrop-blur-md border border-sable/30 p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]">
            {!token ? (
              <div className="text-center text-sm text-terre font-light">{c.invalidLink}</div>
            ) : success ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-carbone font-light">{c.successText}</p>
                <p className="text-xs text-pierre font-light">{c.redirecting}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 text-sm text-terre bg-ivoire border border-sable/30">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                    {c.newPasswordLabel}
                  </label>
                  <input
                    type="password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre"
                  />
                  <p className="text-[10px] text-pierre font-light mt-1">{c.minLengthHint}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                    {c.confirmLabel}
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-carbone text-blanc-casse text-sm tracking-[0.02em] hover:bg-terre transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? c.submitting : c.submit}
                </button>
              </form>
            )}
          </div>
          <p className="text-center text-[10px] text-sable/60 font-mono tracking-[0.1em] uppercase mt-6">
            Skinner · Skin Tech · 2026
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
