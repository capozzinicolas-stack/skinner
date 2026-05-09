"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

type Copy = {
  eyebrow: string;
  title: string;
  successText: string;
  successExpiry: string;
  back: string;
  formIntro: string;
  emailLabel: string;
  submit: string;
  submitting: string;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    eyebrow: "Recuperação de senha",
    title: "Esqueceu sua senha",
    successText: "Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha em alguns instantes.",
    successExpiry: "O link expira em 60 minutos e só pode ser usado uma vez.",
    back: "← Voltar ao login",
    formIntro: "Informe o e-mail da sua conta. Enviaremos um link para você escolher uma nova senha.",
    emailLabel: "E-mail",
    submit: "Enviar link de recuperação",
    submitting: "Enviando...",
  },
  es: {
    eyebrow: "Recuperación de contraseña",
    title: "Olvidaste tu contraseña",
    successText: "Si el correo informado está registrado, recibirás un link para restablecer tu contraseña en unos instantes.",
    successExpiry: "El link expira en 60 minutos y solo puede usarse una vez.",
    back: "← Volver al login",
    formIntro: "Ingresa el correo de tu cuenta. Te enviaremos un link para que elijas una nueva contraseña.",
    emailLabel: "Correo electrónico",
    submit: "Enviar link de recuperación",
    submitting: "Enviando...",
  },
  en: {
    eyebrow: "Password reset",
    title: "Forgot your password",
    successText: "If the email is registered, you'll receive a link to reset your password shortly.",
    successExpiry: "The link expires in 60 minutes and can only be used once.",
    back: "← Back to sign in",
    formIntro: "Enter your account email. We'll send you a link to choose a new password.",
    emailLabel: "Email",
    submit: "Send reset link",
    submitting: "Sending...",
  },
};

export default function ForgotPasswordPage() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
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
            {submitted ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-carbone font-light">{c.successText}</p>
                <p className="text-xs text-pierre font-light">{c.successExpiry}</p>
                <a
                  href="/login"
                  className="inline-block mt-2 text-xs text-pierre font-light hover:text-carbone hover:underline"
                >
                  {c.back}
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-pierre font-light">{c.formIntro}</p>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                    {c.emailLabel}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-carbone text-blanc-casse text-sm tracking-[0.02em] hover:bg-terre transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? c.submitting : c.submit}
                </button>
                <div className="text-center pt-2">
                  <a
                    href="/login"
                    className="text-xs text-pierre font-light hover:text-carbone hover:underline"
                  >
                    {c.back}
                  </a>
                </div>
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
