"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

// Public origin used for the embed snippet so the host site links to prod
// even when the tenant is editing on a staging domain. localhost defaults
// to the same port the dev server uses so the snippet works in dev too.
const PUBLIC_ORIGIN =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? window.location.origin
    : "https://app.skinner.lat";

type EmbedOptions = {
  contactOff: boolean;
  compact: boolean;
  height: string;
};

const DEFAULT_EMBED_OPTIONS: EmbedOptions = {
  contactOff: false,
  compact: false,
  height: "800",
};

function buildEmbedSnippet(slug: string, opts: EmbedOptions): string {
  const params = new URLSearchParams();
  if (opts.contactOff) params.set("contact", "off");
  if (opts.compact) params.set("compact", "true");
  const qs = params.toString();
  const src = `${PUBLIC_ORIGIN}/embed/${slug}${qs ? `?${qs}` : ""}`;
  return [
    `<iframe`,
    `  src="${src}"`,
    `  width="100%"`,
    `  height="${opts.height}"`,
    `  frameborder="0"`,
    `  allow="camera; microphone"`,
    `  data-skinner-iframe="true"`,
    `></iframe>`,
  ].join("\n");
}

const HELPER_SNIPPET = `<script src="${PUBLIC_ORIGIN}/embed-helper.js" async></script>`;

const EVENTS_SAMPLE = `<script>
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.source !== "skinner") return;
    // e.data.type, e.data.data
    console.log("Skinner event:", e.data.type, e.data.data);
    if (e.data.type === "skinner:analysis_completed") {
      // Ex: dispara um pixel de conversao, abre upsell, etc.
    }
  });
</script>`;

export default function ChannelsPage() {
  const tenant = trpc.tenant.getMine.useQuery();
  const slug = tenant.data?.slug;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3015";
  const analysisUrl = slug ? `${baseUrl}/analise/${slug}` : "";
  const qrApiUrl = slug
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(analysisUrl)}`
    : "";

  const [embedOpts, setEmbedOpts] = useState<EmbedOptions>(DEFAULT_EMBED_OPTIONS);
  const [copied, setCopied] = useState<"snippet" | "helper" | "events" | null>(null);
  const embedSnippet = slug ? buildEmbedSnippet(slug, embedOpts) : "";
  const previewUrl = slug
    ? `${PUBLIC_ORIGIN}/embed/${slug}${
        embedOpts.contactOff || embedOpts.compact
          ? `?${new URLSearchParams({
              ...(embedOpts.contactOff ? { contact: "off" } : {}),
              ...(embedOpts.compact ? { compact: "true" } : {}),
            }).toString()}`
          : ""
      }`
    : "";

  function handleCopy(content: string, key: typeof copied) {
    navigator.clipboard.writeText(content);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

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
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-medium hover:bg-terre transition-colors"
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
                className="px-4 py-2 border border-sable text-terre text-sm font-medium hover:bg-ivoire transition-colors"
              >
                Baixar QR Code
              </a>
            </div>
          )}
        </div>

        {/* Widget Embed */}
        <div className="p-6 bg-white border border-sable/30 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-carbone">Widget Embed</h2>
            <span className="text-xs px-2 py-0.5 bg-ivoire text-pierre uppercase tracking-wider font-light">
              Ativo
            </span>
          </div>
          <p className="text-sm text-pierre font-light">
            Cole o snippet abaixo onde quiser que a analise apareca no seu site.
            Funciona em qualquer plataforma (WordPress, Wix, Nuvemshop, Shopify, HTML puro).
          </p>

          {/* Customization controls */}
          <div className="p-4 bg-blanc-casse border border-sable/20 space-y-3">
            <p className="text-[10px] uppercase tracking-wider font-light text-pierre">
              Personalizacao
            </p>
            <label className="flex items-center gap-3 text-sm text-carbone font-light">
              <input
                type="checkbox"
                checked={embedOpts.contactOff}
                onChange={(e) =>
                  setEmbedOpts((o) => ({ ...o, contactOff: e.target.checked }))
                }
                className="w-4 h-4"
              />
              Pular tela de captura de contato (ja capturei contato no meu site)
            </label>
            <label className="flex items-center gap-3 text-sm text-carbone font-light">
              <input
                type="checkbox"
                checked={embedOpts.compact}
                onChange={(e) =>
                  setEmbedOpts((o) => ({ ...o, compact: e.target.checked }))
                }
                className="w-4 h-4"
              />
              Modo compacto (padding reduzido, ideal para iframes pequenos)
            </label>
            <label className="flex items-center gap-3 text-sm text-carbone font-light">
              <span className="w-32">Altura inicial (px):</span>
              <input
                type="number"
                min={400}
                value={embedOpts.height}
                onChange={(e) => setEmbedOpts((o) => ({ ...o, height: e.target.value }))}
                className="w-24 px-2 py-1 border border-sable/40 bg-white text-sm font-light"
              />
              <span className="text-xs text-pierre/70">
                (auto-resize via embed-helper.js)
              </span>
            </label>
          </div>

          {/* Snippet */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-light text-pierre mb-2">
              Snippet
            </p>
            <pre className="p-4 bg-carbone text-blanc-casse text-xs font-mono overflow-x-auto whitespace-pre">
{embedSnippet}
            </pre>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => handleCopy(embedSnippet, "snippet")}
                className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
              >
                {copied === "snippet" ? "Copiado" : "Copiar codigo"}
              </button>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire"
                >
                  Visualizar preview
                </a>
              )}
            </div>
          </div>

          {/* Helper script */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-light text-pierre mb-2">
              Auto-resize (opcional)
            </p>
            <p className="text-xs text-pierre font-light mb-2">
              Cole este snippet UMA vez no &lt;head&gt; ou final do &lt;body&gt; do seu site
              para que o iframe redimensione automaticamente conforme o conteudo cresce.
              Sem ele, o iframe usa a altura fixa configurada acima.
            </p>
            <pre className="p-4 bg-carbone text-blanc-casse text-xs font-mono overflow-x-auto whitespace-pre">
{HELPER_SNIPPET}
            </pre>
            <button
              onClick={() => handleCopy(HELPER_SNIPPET, "helper")}
              className="mt-3 px-3 py-1.5 border border-sable text-pierre text-xs font-light tracking-wide hover:bg-ivoire"
            >
              {copied === "helper" ? "Copiado" : "Copiar"}
            </button>
          </div>

          {/* Events */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-light text-pierre mb-2">
              Eventos JavaScript (avancado)
            </p>
            <p className="text-xs text-pierre font-light mb-2">
              Use os eventos abaixo para integrar com Google Analytics, Pixel do Facebook,
              Google Tag Manager, ou qualquer ferramenta de tracking. Todos os eventos
              tem <code className="bg-ivoire px-1">source: "skinner"</code> para facilitar
              o filtro.
            </p>
            <ul className="text-xs text-pierre font-light space-y-1 mb-3 ml-4">
              <li><code className="text-carbone">skinner:ready</code> — widget carregou</li>
              <li><code className="text-carbone">skinner:started</code> — paciente clicou Iniciar</li>
              <li><code className="text-carbone">skinner:contact_captured</code> — passou pela tela de contato</li>
              <li><code className="text-carbone">skinner:photo_captured</code> — paciente capturou foto</li>
              <li><code className="text-carbone">skinner:analysis_completed</code> — analise pronta (com analysisId)</li>
              <li><code className="text-carbone">skinner:height_changed</code> — conteudo redimensionado</li>
            </ul>
            <pre className="p-4 bg-carbone text-blanc-casse text-xs font-mono overflow-x-auto whitespace-pre">
{EVENTS_SAMPLE}
            </pre>
            <button
              onClick={() => handleCopy(EVENTS_SAMPLE, "events")}
              className="mt-3 px-3 py-1.5 border border-sable text-pierre text-xs font-light tracking-wide hover:bg-ivoire"
            >
              {copied === "events" ? "Copiado" : "Copiar exemplo"}
            </button>
          </div>

          <div className="text-[10px] text-pierre/70 font-light border-t border-sable/20 pt-4">
            <p>
              <strong>Requisitos:</strong> seu site precisa estar em HTTPS para a
              camera funcionar. Se usa Content Security Policy estrita, adicione{" "}
              <code className="bg-ivoire px-1">frame-src https://app.skinner.lat</code>{" "}
              ao header.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
