"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

type LoginMode = "admin" | "client";

function detectMode(): LoginMode {
  if (typeof window === "undefined") return "client";
  const host = window.location.hostname;
  if (host.startsWith("admin")) return "admin";
  return "client";
}

const modeConfig = {
  admin: {
    bgGradient: "from-[#1C1917] via-[#3D342C] to-[#1C1917]",
    mountainColor1: "#3D342C",
    mountainColor2: "#2a241e",
    mountainColor3: "#1C1917",
  },
  client: {
    bgGradient: "from-[#3D342C] via-[#7C7269] to-[#3D342C]",
    mountainColor1: "#7C7269",
    mountainColor2: "#5a524a",
    mountainColor3: "#3D342C",
  },
};

type Copy = {
  adminEyebrow: string;
  adminTitle: string;
  adminSubtitle: string;
  clientEyebrow: string;
  clientTitle: string;
  clientSubtitle: string;
  emailLabel: string;
  passwordLabel: string;
  emailPlaceholder: string;
  forgot: string;
  submit: string;
  submitting: string;
  errorAdminInvalid: string;
  errorClientInvalid: string;
  errorUnauthorized: string;
  errorNoTenant: string;
  errorWrongPortalAdmin: string;
  errorWrongPortalClient: string;
  errorGeneric: string;
};

const COPY: Record<Locale, Copy> = {
  "pt-BR": {
    adminEyebrow: "Administração",
    adminTitle: "Painel Skinner",
    adminSubtitle: "Acesso restrito ao time interno.",
    clientEyebrow: "Portal do Cliente",
    clientTitle: "Bem-vindo de volta",
    clientSubtitle: "Acesse o painel do seu negócio.",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    emailPlaceholder: "seu@email.com",
    forgot: "Esqueci minha senha",
    submit: "Entrar",
    submitting: "Entrando...",
    errorAdminInvalid: "E-mail ou senha inválidos. (Apenas administradores Skinner podem acessar este painel.)",
    errorClientInvalid: "E-mail ou senha inválidos. (Administradores devem usar admin.skinner.lat.)",
    errorUnauthorized: "Acesso não autorizado.",
    errorNoTenant: "Usuário sem empresa vinculada.",
    errorWrongPortalAdmin: "Esta conta não é administrativa. Acesse pelo portal app.skinner.lat.",
    errorWrongPortalClient: "Administradores devem acessar pelo portal admin.skinner.lat.",
    errorGeneric: "Erro ao fazer login.",
  },
  es: {
    adminEyebrow: "Administración",
    adminTitle: "Panel Skinner",
    adminSubtitle: "Acceso restringido al equipo interno.",
    clientEyebrow: "Portal del Cliente",
    clientTitle: "Bienvenido de vuelta",
    clientSubtitle: "Accede al panel de tu negocio.",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    emailPlaceholder: "tu@email.com",
    forgot: "Olvidé mi contraseña",
    submit: "Ingresar",
    submitting: "Ingresando...",
    errorAdminInvalid: "Correo o contraseña inválidos. (Solo administradores Skinner pueden acceder a este panel.)",
    errorClientInvalid: "Correo o contraseña inválidos. (Los administradores deben usar admin.skinner.lat.)",
    errorUnauthorized: "Acceso no autorizado.",
    errorNoTenant: "Usuario sin empresa vinculada.",
    errorWrongPortalAdmin: "Esta cuenta no es administrativa. Accede por el portal app.skinner.lat.",
    errorWrongPortalClient: "Los administradores deben acceder por el portal admin.skinner.lat.",
    errorGeneric: "Error al iniciar sesión.",
  },
  en: {
    adminEyebrow: "Administration",
    adminTitle: "Skinner Panel",
    adminSubtitle: "Access restricted to the internal team.",
    clientEyebrow: "Client Portal",
    clientTitle: "Welcome back",
    clientSubtitle: "Access your business dashboard.",
    emailLabel: "Email",
    passwordLabel: "Password",
    emailPlaceholder: "you@email.com",
    forgot: "Forgot password",
    submit: "Sign in",
    submitting: "Signing in...",
    errorAdminInvalid: "Invalid email or password. (Only Skinner administrators can access this panel.)",
    errorClientInvalid: "Invalid email or password. (Administrators must use admin.skinner.lat.)",
    errorUnauthorized: "Access not authorized.",
    errorNoTenant: "User has no linked company.",
    errorWrongPortalAdmin: "This account is not administrative. Access via app.skinner.lat.",
    errorWrongPortalClient: "Administrators must access via admin.skinner.lat.",
    errorGeneric: "Sign-in error.",
  },
};

function LoginForm() {
  const { locale } = useI18n();
  const c = COPY[locale];
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
      mode,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(mode === "admin" ? c.errorAdminInvalid : c.errorClientInvalid);
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

  const eyebrow = mode === "admin" ? c.adminEyebrow : c.clientEyebrow;
  const title = mode === "admin" ? c.adminTitle : c.clientTitle;
  const subtitle = mode === "admin" ? c.adminSubtitle : c.clientSubtitle;

  return (
    <main className="flex min-h-screen relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-b ${cfg.bgGradient}`}>
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

        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          style={{ height: "55%" }}
        >
          <path
            d="M0,280 C120,180 240,220 360,160 C480,100 600,140 720,120 C840,100 960,160 1080,140 C1200,120 1320,180 1440,150 L1440,400 L0,400 Z"
            fill={cfg.mountainColor1}
            opacity="0.5"
          />
          <path
            d="M0,320 C180,240 300,280 480,220 C660,160 780,240 960,200 C1140,160 1260,220 1440,240 L1440,400 L0,400 Z"
            fill={cfg.mountainColor2}
            opacity="0.7"
          />
          <path
            d="M0,350 C200,300 400,340 600,290 C800,240 1000,300 1200,280 C1300,270 1380,310 1440,300 L1440,400 L0,400 Z"
            fill={cfg.mountainColor3}
          />
        </svg>

        <div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(ellipse, rgba(200,186,169,0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
        <div className="text-center mb-10">
          <img
            src="/brand/logo-primary.png"
            alt="Skinner"
            className="h-[172px] mx-auto mb-6 object-contain brightness-0 invert"
          />
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sable/80 mb-3">{eyebrow}</p>
          <h1 className="font-serif text-3xl md:text-4xl text-blanc-casse italic">{title}</h1>
          <p className="text-sm text-sable font-light mt-2">{subtitle}</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-blanc-casse/95 backdrop-blur-md border border-sable/30 p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]">
            {(error || urlError) && (
              <div className="p-3 text-sm text-terre bg-ivoire border border-sable/30 mb-6">
                {error ||
                  (urlError === "unauthorized"
                    ? c.errorUnauthorized
                    : urlError === "no-tenant"
                    ? c.errorNoTenant
                    : urlError === "wrong-portal"
                    ? mode === "admin"
                      ? c.errorWrongPortalAdmin
                      : c.errorWrongPortalClient
                    : c.errorGeneric)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                  {c.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  required
                  className="w-full px-4 py-3 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-terre transition-colors"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-[10px] font-light text-pierre uppercase tracking-wider mb-2">
                  {c.passwordLabel}
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
                {loading ? c.submitting : c.submit}
              </button>
            </form>
            <div className="mt-5 text-center">
              <a
                href="/forgot-password"
                className="text-xs text-pierre font-light hover:text-carbone hover:underline"
              >
                {c.forgot}
              </a>
            </div>
          </div>

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
