"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
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
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (pwd !== confirm) {
      setError("As senhas nao coincidem.");
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
        setError(data.error ?? "Erro ao redefinir a senha.");
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
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sable/80 mb-3">
            Nova senha
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-blanc-casse italic">
            Redefina sua senha
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-blanc-casse/95 backdrop-blur-md border border-sable/30 p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]">
            {!token ? (
              <div className="text-center text-sm text-terre font-light">
                Link invalido. Solicite um novo em "Esqueci minha senha".
              </div>
            ) : success ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-carbone font-light">
                  Senha redefinida com sucesso.
                </p>
                <p className="text-xs text-pierre font-light">
                  Redirecionando para o login...
                </p>
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
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre"
                  />
                  <p className="text-[10px] text-pierre font-light mt-1">Minimo 8 caracteres.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                    Confirmar nova senha
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
                  {loading ? "Redefinindo..." : "Redefinir senha"}
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
