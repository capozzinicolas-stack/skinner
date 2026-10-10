"use client";

// Last-resort error boundary (errors in the root layout). Must render its own
// <html>/<body>; styles are inline because the app CSS may not be loaded.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F3EE",
          color: "#1C1917",
          fontFamily: "Georgia, serif",
          padding: 16,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontWeight: 400, fontSize: 24 }}>Algo deu errado</h1>
          <p style={{ color: "#7C7269", fontFamily: "Arial, sans-serif", fontSize: 14, lineHeight: 1.6 }}>
            Não foi possível carregar a página agora. Tente novamente em alguns instantes.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 24,
              padding: "12px 32px",
              background: "#1C1917",
              color: "#F7F3EE",
              border: "none",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
