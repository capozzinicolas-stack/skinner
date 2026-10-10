"use client";

import { useEffect } from "react";

// Branded runtime-error page in Portuguese (replaces Next.js' default
// "Application error" screen). Offers a retry without losing the route.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-blanc-casse flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light">Skinner</p>
        <h1 className="font-serif text-2xl text-carbone mt-4">Algo deu errado</h1>
        <div className="w-12 h-px bg-sable mx-auto my-5" />
        <p className="text-sm text-pierre font-light leading-relaxed">
          Não foi possível carregar esta página agora. Tente novamente em alguns instantes.
        </p>
        <button
          onClick={() => reset()}
          className="mt-8 px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
