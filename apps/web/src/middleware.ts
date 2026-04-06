import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes: only skinner_admin
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "skinner_admin") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    // Dashboard routes: only B2B users with a tenant
    if (pathname.startsWith("/dashboard")) {
      if (!token?.tenantId) {
        return NextResponse.redirect(new URL("/login?error=no-tenant", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public routes: don't require auth
        if (
          pathname === "/" ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/analise") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/trpc/health") ||
          pathname.startsWith("/api/leads") ||
          pathname.startsWith("/api/pixel") ||
          pathname.startsWith("/demo") ||
          pathname.startsWith("/como-funciona") ||
          pathname.startsWith("/planos") ||
          pathname.startsWith("/laboratorios") ||
          pathname.startsWith("/clinicas") ||
          pathname.startsWith("/farmacias") ||
          pathname.startsWith("/contato") ||
          pathname.startsWith("/privacidade") ||
          pathname.startsWith("/termos")
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|api/auth).*)",
  ],
};
