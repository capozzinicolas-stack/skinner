"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";

type LoginMode = "admin" | "client";

function detectMode(): LoginMode {
  if (typeof window === "undefined") return "client";
  const host = window.location.hostname;
  if (host.startsWith("admin")) return "admin";
  return "client";
}

const modeConfig = {
  admin: {
    eyebrow: "Administracao",
    title: "Painel Skinner",
    subtitle: "Acesso restrito ao time interno.",
    bgGradient: "from-[#1C1917] via-[#3D342C] to-[#1C1917]",
    mountainColor1: "#3D342C",
    mountainColor2: "#2a241e",
    mountainColor3: "#1C1917",
  },
  client: {
    eyebrow: "Portal do Cliente",
    title: "Bem-vindo de volta",
    subtitle: "Acesse o painel do seu negocio.",
    bgGradient: "from-[#3D342C] via-[#7C7269] to-[#3D342C]",
    mountainColor1: "#7C7269",
    mountainColor2: "#5a524a",
    mountainColor3: "#3D342C",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>("client");

  useEffect(() => {
    setMode(detectMode());
  }, []);

  const urlError = searchParams.get("error");
  const cfg = modeConfig[mode];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      // Portal segmentation: admin.skinner.lat vs app.skinner.lat. The server
      // rejects mismatches in lib/auth.ts, returning the same generic error so
      // we can't distinguish "wrong portal" from "wrong password" here without
      // an extra round-trip. Pass the detected mode and let the server decide.
      mode,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        mode === "admin"
          ? "E-mail ou senha invalidos. (Apenas administradores Skinner podem acessar este painel.)"
          : "E-mail ou senha invalidos. (Administradores devem usar admin.skinner.lat.)"
      );
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
    <main className="flex min-h-screen relative overflow-hidden">
      {/* Background — immersive landscape */}
      <div className={`absolute inset-0 bg-gradient-to-b ${cfg.bgGradient}`}>
        {/* Stars / dots */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-px h-px bg-blanc-casse rounded-full"
              style={{
                top: `${Math.random() * 50}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.7,
                width: Math.random() > 0.7 ? "2px" : "1px",
                height: Math.random() > 0.7 ? "2px" : "1px",
              }}
            />
          ))}
        </div>

        {/* Mountain layers */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          style={{ height: "55%" }}
        >
          {/* Far mountain */}
          <path
            d="M0,280 C120,180 240,220 360,160 C480,100 600,140 720,120 C840,100 960,160 1080,140 C1200,120 1320,180 1440,150 L1440,400 L0,400 Z"
            fill={cfg.mountainColor1}
            opacity="0.5"
          />
          {/* Mid mountain */}
          <path
            d="M0,320 C180,240 300,280 480,220 C660,160 780,240 960,200 C1140,160 1260,220 1440,240 L1440,400 L0,400 Z"
            fill={cfg.mountainColor2}
            opacity="0.7"
          />
          {/* Front mountain */}
          <path
            d="M0,350 C200,300 400,340 600,290 C800,240 1000,300 1200,280 C1300,270 1380,310 1440,300 L1440,400 L0,400 Z"
            fill={cfg.mountainColor3}
          />
        </svg>

        {/* Subtle glow */}
        <div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(ellipse, rgba(200,186,169,0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
        {/* Logo + branding */}
        <div className="text-center mb-10">
          <img
            src="/brand/logo-primary.png"
            alt="Skinner"
            className="h-[172px] mx-auto mb-6 object-contain brightness-0 invert"
          />
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sable/80 mb-3">
            {cfg.eyebrow}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-blanc-casse italic">
            {cfg.title}
          </h1>
          <p className="text-sm text-sable font-light mt-2">
            {cfg.subtitle}
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm">
          <div className="bg-blanc-casse/95 backdrop-blur-md border border-sable/30 p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]">
            {(error || urlError) && (
              <div className="p-3 text-sm text-terre bg-ivoire border border-sable/30 mb-6">
                {error ||
                  (urlError === "unauthorized"
                    ? "Acesso nao autorizado."
                    : urlError === "no-tenant"
                    ? "Usuario sem empresa vinculada."
                    : urlError === "wrong-portal"
                    ? mode === "admin"
                      ? "Esta conta nao e administrativa. Acesse pelo portal app.skinner.lat."
                      : "Administradores devem acessar pelo portal admin.skinner.lat."
                    : "Erro ao fazer login.")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre transition-colors"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-carbone text-blanc-casse text-sm tracking-[0.02em] hover:bg-terre transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
            <div className="mt-5 text-center">
              <a
                href="/forgot-password"
                className="text-xs text-pierre font-light hover:text-carbone hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-[10px] text-sable/60 font-mono tracking-[0.1em] uppercase mt-6">
            Skinner · Skin Tech · 2026
          </p>
        </div>
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
