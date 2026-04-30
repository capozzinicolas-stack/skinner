"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { signOut } from "next-auth/react";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";

// Guard against firing signOut multiple times when several batched tRPC queries
// fail in parallel. Once the redirect is triggered we ignore subsequent errors.
let signOutInFlight = false;

function handleTRPCError(error: unknown) {
  const code = (error as { data?: { code?: string } } | undefined)?.data?.code;
  if (code === "UNAUTHORIZED" && !signOutInFlight) {
    signOutInFlight = true;
    signOut({ callbackUrl: "/login" });
  }
  // FORBIDDEN (e.g. tenant paused) is left to the page-level UI to surface —
  // we do not auto-logout because the user might be able to recover (admin
  // un-pauses, refund disputed, etc.).
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleTRPCError }),
        mutationCache: new MutationCache({ onError: handleTRPCError }),
        defaultOptions: {
          queries: {
            // Don't retry auth failures — they will not self-heal.
            retry: (failureCount, error) => {
              const code = (error as { data?: { code?: string } } | undefined)
                ?.data?.code;
              if (code === "UNAUTHORIZED" || code === "FORBIDDEN") return false;
              return failureCount < 3;
            },
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
