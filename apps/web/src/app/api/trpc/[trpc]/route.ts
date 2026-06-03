import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

// analysis.run performs a Claude vision call (typically 20-40s) plus the
// matcher + several DB writes. Vercel's default function timeout (~10-15s)
// cuts it off with a 504, which the tRPC client surfaces to the patient as the
// cryptic "Unable to transform response from server" (superjson can't
// deserialize the gateway error page). Pin a generous ceiling so the analysis
// has room to complete. Fast queries/mutations still return immediately — this
// only raises the ceiling, it does not delay anything.
export const maxDuration = 60;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  });

export { handler as GET, handler as POST };
