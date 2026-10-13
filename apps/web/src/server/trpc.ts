import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { db } from "@skinner/db";
import { authOptions } from "@/lib/auth";
import { mutationLimiter } from "@/lib/rate-limit";

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

// Validation messages in Portuguese (product language). Applies to every
// zod schema evaluated on the server.
z.config(z.locales.pt());

// tRPC puts input-validation failures in error.message as a JSON dump of zod
// issues, which the UI would show verbatim. Replace it with the first issue
// as a readable pt-BR sentence (field name + message).
function readableValidationMessage(cause: unknown): string | null {
  if (!cause || typeof cause !== "object" || !("issues" in cause)) return null;
  const issues = (cause as { issues?: { path?: PropertyKey[]; message?: string }[] }).issues;
  if (!Array.isArray(issues) || issues.length === 0) return null;
  const first = issues[0];
  const field = first.path && first.path.length > 0 ? String(first.path[first.path.length - 1]) : null;
  const msg = first.message ?? "valor inválido";
  return field ? `Verifique o campo "${field}": ${msg}.` : `Dados inválidos: ${msg}.`;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const readable = error.code === "BAD_REQUEST" ? readableValidationMessage(error.cause) : null;
    return readable ? { ...shape, message: readable } : shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Entre novamente." });
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
    throw new TRPCError({ code: "FORBIDDEN", message: "Organização não identificada." });
  }

  const tenantId = ctx.tenantId;
  const now = Date.now();
  const cached = tenantValidationCache.get(tenantId);

  let status: string;
  if (cached && cached.expiresAt > now) {
    if (!cached.ok) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Esta organização não existe mais.",
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
        message: "Esta organização não existe mais.",
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
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Esta organização foi excluída." });
  }
  if (status === "paused") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sua conta está pausada. Entre em contato com o suporte para reativá-la.",
    });
  }

  return next({
    ctx: { ...ctx, tenantId },
  });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.role !== "skinner_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// Per-user mutation rate limit (60 req/user/min sliding window). Only fires
// on `type === "mutation"` so query bursts from parallel dashboard loads are
// untouched. Caps runaway scripts, accidental loops, and post-auth abuse
// without affecting any legitimate human workflow (60/min = 1/sec average).
// Keyed by userId — shared NAT IPs cannot collide. Fails open on Upstash
// errors via the underlying noop limiter (see lib/rate-limit.ts).
const rateLimitMutations = t.middleware(async ({ ctx, next, type }) => {
  if (type === "mutation" && ctx.userId) {
    try {
      const rl = await mutationLimiter.limit(`mut:${ctx.userId}`);
      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Muitas operacoes em pouco tempo. Aguarde alguns segundos e tente novamente.",
        });
      }
    } catch (err) {
      // Re-throw the TRPCError; swallow only infra-level errors so a Redis
      // outage doesn't lock the whole panel.
      if (err instanceof TRPCError) throw err;
    }
  }
  // Pass through without modifying ctx — preserves the narrowed types
  // set by upstream middlewares (e.g. hasTenant narrowing tenantId to string).
  return next();
});

export const protectedProcedure = t.procedure.use(isAuthed).use(rateLimitMutations);
export const tenantProcedure = t.procedure
  .use(isAuthed)
  .use(hasTenant)
  .use(rateLimitMutations);
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin).use(rateLimitMutations);
