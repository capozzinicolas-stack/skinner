import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { db } from "@skinner/db";
import { authOptions } from "@/lib/auth";

export type Context = {
  db: typeof db;
  userId?: string;
  tenantId?: string;
  role?: string;
  headers?: Headers;
};

type ContextOptions = {
  req?: Request;
};

export const createContext = async (
  opts?: ContextOptions
): Promise<Context> => {
  const session = await getServerSession(authOptions);
  const headers = opts?.req?.headers;

  if (!session?.user) {
    return { db, headers };
  }

  const user = session.user as any;
  return {
    db,
    userId: user.id,
    tenantId: user.tenantId ?? undefined,
    role: user.role,
    headers,
  };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId, role: ctx.role },
  });
});

// In-memory tenant validation cache (process-local, 30s TTL).
// Avoids hitting Postgres on every tRPC request when a single dashboard fires
// 8+ queries in parallel. After a tenant is deleted/paused in DB, all clients
// see the new state within at most 30s — acceptable for an MVP. The cache also
// resets on every cold start of the serverless function, so deploys take effect
// immediately. Memoised entries store both existence (`ok`) and `status` so we
// can render the right error code (UNAUTHORIZED vs FORBIDDEN) without an extra
// query.
type TenantCacheEntry = { ok: boolean; status: string; expiresAt: number };
const tenantValidationCache = new Map<string, TenantCacheEntry>();
const TENANT_CACHE_TTL_MS = 30_000;

const hasTenant = t.middleware(async ({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenant context" });
  }

  const tenantId = ctx.tenantId;
  const now = Date.now();
  const cached = tenantValidationCache.get(tenantId);

  let status: string;
  if (cached && cached.expiresAt > now) {
    if (!cached.ok) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Tenant no longer exists",
      });
    }
    status = cached.status;
  } else {
    const tenant = await ctx.db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });
    if (!tenant) {
      tenantValidationCache.set(tenantId, {
        ok: false,
        status: "",
        expiresAt: now + TENANT_CACHE_TTL_MS,
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Tenant no longer exists",
      });
    }
    status = tenant.status;
    tenantValidationCache.set(tenantId, {
      ok: true,
      status,
      expiresAt: now + TENANT_CACHE_TTL_MS,
    });
  }

  if (status === "deleted") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Tenant deleted" });
  }
  if (status === "paused") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sua conta esta pausada. Entre em contato com o suporte para reativa-la.",
    });
  }

  return next({
    ctx: { ...ctx, tenantId },
  });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.role !== "skinner_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const tenantProcedure = t.procedure.use(isAuthed).use(hasTenant);
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);
