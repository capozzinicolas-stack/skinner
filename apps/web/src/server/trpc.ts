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

const hasTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenant context" });
  }
  return next({
    ctx: { ...ctx, tenantId: ctx.tenantId },
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
