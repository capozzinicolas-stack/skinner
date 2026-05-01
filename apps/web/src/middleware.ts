import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require NO authentication (public)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/analise",
  "/kit",
  "/demo",
  "/como-funciona",
  "/planos",
  "/laboratorios",
  "/clinicas",
  "/farmacias",
  "/segmentos",
  "/contato",
  "/privacidade",
  "/termos",
  "/integracoes",
  "/api/auth",
  "/api/trpc/health",
  "/api/trpc/tenant.getBySlug",
  "/api/trpc/tenant.getAnalysisConfig",
  "/api/trpc/tenant.getStorefrontConfig",
  "/api/trpc/analysis.run",
  "/api/trpc/dermatology.listConditions",
  "/api/trpc/dermatology.listIngredients",
  "/api/leads",
  "/api/pixel",
  "/api/upload",
  "/api/report",
  "/api/integrations",
  "/api/projection",
  "/api/billing/webhook",
  "/api/billing/checkout",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";

  // ── Subdomain routing ──────────────────────────────────────────────
  // admin.skinner.lat → redirect to /login (then /admin after auth)
  // app.skinner.lat   → redirect to /login (then /dashboard after auth)
  const isAdminSubdomain = hostname.startsWith("admin.");
  const isAppSubdomain = hostname.startsWith("app.");

  if (isAdminSubdomain || isAppSubdomain) {
    // On subdomains, only allow /login, /api/*, /admin, /dashboard paths
    // Redirect root and marketing pages to /login
    if (pathname === "/" || pathname === "/como-funciona" || pathname === "/planos"
      || pathname === "/segmentos" || pathname === "/contato" || pathname === "/demo"
      || pathname === "/laboratorios" || pathname === "/clinicas" || pathname === "/farmacias"
      || pathname === "/privacidade" || pathname === "/termos") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        // Already logged in — redirect to their panel
        if (isAdminSubdomain && token.role === "skinner_admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        if (isAppSubdomain && token.tenantId) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ── Portal segmentation enforcement ────────────────────────────────
  // Defense-in-depth on top of the credentials provider check (lib/auth.ts).
  // If a JWT exists but its role doesn't match the subdomain the user is on
  // (e.g. a stale tenant cookie surviving on admin.skinner.lat), redirect to
  // the correct portal so the user can re-auth there. Skipped for the auth
  // pages themselves so the user can always reach /login on either subdomain.
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/auth");

  if ((isAdminSubdomain || isAppSubdomain) && !isAuthPage) {
    const portalToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (portalToken) {
      if (isAdminSubdomain && portalToken.role !== "skinner_admin") {
        // B2B user lands on admin portal — kick to client portal.
        return NextResponse.redirect(
          new URL("https://app.skinner.lat/login?error=wrong-portal")
        );
      }
      if (isAppSubdomain && portalToken.role === "skinner_admin") {
        // Admin lands on client portal — kick to admin portal.
        return NextResponse.redirect(
          new URL("https://admin.skinner.lat/login?error=wrong-portal")
        );
      }
    }
  }

  // ── Standard routing ───────────────────────────────────────────────

  // Allow all public paths without any auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check for valid JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: only skinner_admin
  if (pathname.startsWith("/admin")) {
    if (token.role !== "skinner_admin") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
  }

  // Dashboard routes: only B2B users with a tenant
  if (pathname.startsWith("/dashboard")) {
    if (!token.tenantId) {
      return NextResponse.redirect(new URL("/login?error=no-tenant", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|uploads/).*)",
  ],
};
