import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require NO authentication (public)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/analise",
  "/kit",
  "/demo",
  "/como-funciona",
  "/planos",
  "/laboratorios",
  "/clinicas",
  "/farmacias",
  "/contato",
  "/privacidade",
  "/termos",
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
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
