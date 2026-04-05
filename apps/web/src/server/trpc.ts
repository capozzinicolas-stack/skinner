import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@skinner/db";

export type Context = {
  db: typeof db;
  userId?: string;
  tenantId?: string;
  role?: string;
};

export const createContext = async (): Promise<Context> => {
  // TODO: Extract user/tenant from session in Sprint 1
  return { db };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: requires authenticated user
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId },
  });
});

// Middleware: requires tenant context
const hasTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenant context" });
  }
  return next({
    ctx: { ...ctx, tenantId: ctx.tenantId },
  });
});

// Middleware: requires Skinner admin
const isAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.role !== "skinner_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const tenantProcedure = t.procedure.use(isAuthed).use(hasTenant);
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);
