"use client";

import { trpc } from "@/lib/trpc/client";

export default function ChannelsPage() {
  const tenant = trpc.tenant.getMine.useQuery();
  const slug = tenant.data?.slug;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3015";
  const analysisUrl = slug ? `${baseUrl}/analise/${slug}` : "";
  const qrApiUrl = slug
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(analysisUrl)}`
    : "";

  if (tenant.isLoading) return <div className="p-8 text-gray-500">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Canais de Acesso</h1>
      <p className="text-gray-500 mt-1">
        Configure como seus clientes acessam a análise de pele.
      </p>

      <div className="mt-8 space-y-8">
        {/* Link direto */}
        <div className="p-6 bg-white rounded-xl border shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Link Direto</h2>
          <p className="text-sm text-gray-500">
            Compartilhe este link com seus clientes para iniciar a análise.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={analysisUrl}
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-700"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(analysisUrl);
              }}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-6 bg-white rounded-xl border shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">QR Code</h2>
          <p className="text-sm text-gray-500">
            Imprima e coloque no balcão, vitrine ou material promocional.
          </p>
          {qrApiUrl && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrApiUrl}
                alt="QR Code para análise"
                className="w-48 h-48 border rounded-lg"
              />
              <a
                href={qrApiUrl}
                download={`skinner-qr-${slug}.png`}
                className="px-4 py-2 border border-brand-300 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors"
              >
                Baixar QR Code
              </a>
            </div>
          )}
        </div>

        {/* Widget Embed (placeholder) */}
        <div className="p-6 bg-white rounded-xl border shadow-sm space-y-3 opacity-60">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Widget Embed</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Em breve
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Insira a análise diretamente no seu site com um snippet de código.
          </p>
        </div>
      </div>
    </div>
  );
}
