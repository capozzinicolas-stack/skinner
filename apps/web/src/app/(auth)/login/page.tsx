"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha invalidos.");
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;

    if (role === "skinner_admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-blanc-casse">
      <div className="w-full max-w-sm space-y-8 p-10 bg-white border border-sable/30">
        <div className="text-center">
          <Image
            src="/brand/logomark.png"
            alt="Skinners"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="font-serif text-xl text-carbone">Skinner</h1>
          <p className="text-xs text-pierre tracking-skinners uppercase mt-1 font-light">
            Skin Tech
          </p>
        </div>

        {(error || urlError) && (
          <div className="p-3 text-sm text-terre bg-ivoire border border-sable/30">
            {error || (urlError === "unauthorized" ? "Acesso nao autorizado." : "Erro ao fazer login.")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-light text-pierre uppercase tracking-wider mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-terre transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-light text-pierre uppercase tracking-wider mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-terre transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
