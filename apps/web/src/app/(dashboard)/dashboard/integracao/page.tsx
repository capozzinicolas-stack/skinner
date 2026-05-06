"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { OrganizationTabs } from "@/components/shared/organization-tabs";

const DEFAULT_WHATSAPP_MESSAGE =
  "Ola, gostaria de adquirir o produto {produto} (R$ {preco}) recomendado pela analise Skinner.";

type CtaMode = "whatsapp" | "mercadopago" | "both" | "external";

const ctaModeOptions: { value: CtaMode; label: string; description: string }[] = [
  {
    value: "external",
    label: "Link externo",
    description: "Usa o link de ecommerce cadastrado em cada produto. Comportamento atual.",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    description: "Cada produto exibe um botao que abre o WhatsApp com uma mensagem pre-preenchida.",
  },
  {
    value: "mercadopago",
    label: "MercadoPago",
    description: "Cada produto exibe um botao de pagamento via MercadoPago.",
  },
  {
    value: "both",
    label: "Ambos",
    description: "Exibe simultaneamente o botao de WhatsApp e o de pagamento MercadoPago.",
  },
];

const otherIntegrations = [
  {
    name: "VTEX",
    description: "Integracao enterprise com plataforma VTEX.",
    badge: "Em breve",
  },
  {
    name: "Bling ERP",
    description: "Controle de inventario e sincronizacao de estoque.",
    badge: "Em breve",
  },
  {
    name: "Tiny ERP",
    description: "Controle de inventario e sincronizacao de estoque.",
    badge: "Em breve",
  },
];

function NuvemshopCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  const status = trpc.integration.getStatus.useQuery();
  const connectMutation = trpc.integration.connectNuvemshop.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
  const disconnectMutation = trpc.integration.disconnect.useMutation({
    onSuccess: () => {
      utils.integration.getStatus.invalidate();
      utils.integration.getLastSync.invalidate();
    },
  });
  const syncMutation = trpc.integration.syncProducts.useMutation({
    onSuccess: () => {
      utils.integration.getStatus.invalidate();
      utils.integration.getLastSync.invalidate();
      setSyncResult(syncMutation.data ?? null);
    },
  });
  const lastSync = trpc.integration.getLastSync.useQuery();

  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);

  const matchMutation = trpc.integration.refreshNuvemshopMatch.useMutation({
    onSuccess: () => {
      utils.integration.getStatus.invalidate();
    },
  });

  // Handle ?nuvemshop=connected query param feedback
  useEffect(() => {
    const param = searchParams.get("nuvemshop");
    if (param === "connected") {
      utils.integration.getStatus.invalidate();
      utils.integration.getLastSync.invalidate();
      // Clean the URL without re-mounting
      const url = new URL(window.location.href);
      url.searchParams.delete("nuvemshop");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, utils]);

  const integration = status.data;
  const isConnected = integration?.status === "active";

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-carbone">Nuvemshop</p>
          <p className="text-xs text-pierre font-light mt-0.5">
            Sincronizacao de catalogo e webhook de compras.
          </p>
        </div>
        {isConnected ? (
          <span className="text-[10px] text-terre uppercase tracking-wider font-light px-3 py-1 border border-terre/30 flex-shrink-0">
            Conectado
          </span>
        ) : (
          <span className="text-[10px] text-pierre uppercase tracking-wider font-light px-3 py-1 border border-sable/30 flex-shrink-0">
            Desconectado
          </span>
        )}
      </div>

      {isConnected && (
        <div className="mt-4 pt-4 border-t border-sable/20 space-y-3">
          <div className="flex items-center gap-6 text-xs text-pierre font-light flex-wrap">
            <span>
              Loja ID:{" "}
              <span className="text-carbone">{integration?.storeId ?? "—"}</span>
            </span>
            {integration?.storeUrl && (
              <span>
                Loja:{" "}
                <a
                  href={integration.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-carbone hover:underline"
                >
                  {integration.storeUrl.replace(/^https?:\/\//, "")}
                </a>
              </span>
            )}
            <span>
              Ultima sincronizacao:{" "}
              <span className="text-carbone">
                {formatDate(lastSync.data?.lastSyncAt)}
              </span>
            </span>
          </div>

          {/* SKU match status — refreshed manually. Helps the tenant see how
              many of their Skinner-recommended products will actually deep-link
              to the Nuvemshop cart vs fall back to per-product external links. */}
          {(() => {
            let stats: {
              skinnerCount: number;
              externalCount: number;
              matchedCount: number;
              lastChecked: string;
            } | null = null;
            try {
              if (integration?.matchStats) {
                stats = JSON.parse(integration.matchStats);
              }
            } catch {
              stats = null;
            }
            return (
              <div className="p-3 bg-ivoire border border-sable/20 flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-pierre font-light">
                  {stats ? (
                    <>
                      <span className="text-carbone">
                        {stats.matchedCount} de {stats.skinnerCount}
                      </span>{" "}
                      produto{stats.skinnerCount !== 1 ? "s" : ""} do seu catalogo
                      Skinner tem SKU correspondente em Nuvemshop ({stats.externalCount} produtos na loja).
                      <br />
                      <span className="text-pierre/70">
                        Ultima verificacao: {formatDate(stats.lastChecked)}
                      </span>
                    </>
                  ) : (
                    <>Match SKU ainda nao verificado.</>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => matchMutation.mutate()}
                  disabled={matchMutation.isPending}
                  className="px-3 py-1.5 border border-sable text-pierre text-xs font-light tracking-wide hover:bg-blanc-casse disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {matchMutation.isPending ? "Verificando..." : "Atualizar match"}
                </button>
              </div>
            );
          })()}

          {syncResult && (
            <div className="p-3 bg-ivoire border border-sable/20">
              <p className="text-xs text-carbone font-light">
                {syncResult.synced} produto{syncResult.synced !== 1 ? "s" : ""} sincronizado{syncResult.synced !== 1 ? "s" : ""}.
              </p>
              {syncResult.errors.length > 0 && (
                <p className="text-xs text-red-600 font-light mt-1">
                  {syncResult.errors.length} erro{syncResult.errors.length !== 1 ? "s" : ""}: {syncResult.errors[0]}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSyncResult(null);
                syncMutation.mutate();
              }}
              disabled={syncMutation.isPending}
              className="px-4 py-1.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
            >
              {syncMutation.isPending ? "Sincronizando..." : "Sincronizar produtos"}
            </button>
            <button
              type="button"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="px-4 py-1.5 border border-sable text-terre text-xs font-light tracking-wide hover:bg-ivoire disabled:opacity-50 transition-colors"
            >
              {disconnectMutation.isPending ? "Desconectando..." : "Desconectar"}
            </button>
          </div>

          {syncMutation.error && (
            <p className="text-xs text-red-600 font-light">{syncMutation.error.message}</p>
          )}
          {disconnectMutation.error && (
            <p className="text-xs text-red-600 font-light">{disconnectMutation.error.message}</p>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 pt-4 border-t border-sable/20">
          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="px-4 py-1.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
          >
            {connectMutation.isPending ? "Redirecionando..." : "Conectar Nuvemshop"}
          </button>
          {connectMutation.error && (
            <p className="text-xs text-red-600 font-light mt-2">
              {connectMutation.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ShopifyCard() {
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  const status = trpc.integration.getStatusByPlatform.useQuery({ platform: "shopify" });
  const lastSync = status.data?.lastSyncAt ?? null;

  const connectMutation = trpc.integration.connectShopify.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
  const disconnectMutation = trpc.integration.disconnectShopify.useMutation({
    onSuccess: () => {
      utils.integration.getStatusByPlatform.invalidate({ platform: "shopify" });
    },
  });
  const syncMutation = trpc.integration.syncShopifyProducts.useMutation({
    onSuccess: () => {
      utils.integration.getStatusByPlatform.invalidate({ platform: "shopify" });
      setSyncResult(syncMutation.data ?? null);
    },
  });

  const [shopInput, setShopInput] = useState("");
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);

  // Handle ?shopify=connected query param feedback
  useEffect(() => {
    const param = searchParams.get("shopify");
    if (param === "connected") {
      utils.integration.getStatusByPlatform.invalidate({ platform: "shopify" });
      const url = new URL(window.location.href);
      url.searchParams.delete("shopify");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, utils]);

  const integration = status.data;
  const isConnected = integration?.status === "active";

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function handleConnect() {
    if (!shopInput.trim()) return;
    connectMutation.mutate({ shop: shopInput.trim() });
  }

  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-carbone">Shopify</p>
          <p className="text-xs text-pierre font-light mt-0.5">
            Sincronizacao de catalogo e webhook de compras.
          </p>
        </div>
        {isConnected ? (
          <span className="text-[10px] text-terre uppercase tracking-wider font-light px-3 py-1 border border-terre/30 flex-shrink-0">
            Conectado
          </span>
        ) : (
          <span className="text-[10px] text-pierre uppercase tracking-wider font-light px-3 py-1 border border-sable/30 flex-shrink-0">
            Desconectado
          </span>
        )}
      </div>

      {isConnected && (
        <div className="mt-4 pt-4 border-t border-sable/20 space-y-3">
          <div className="flex items-center gap-6 text-xs text-pierre font-light">
            <span>
              Loja:{" "}
              <span className="text-carbone">{integration?.storeId ?? "—"}</span>
            </span>
            <span>
              Ultima sincronizacao:{" "}
              <span className="text-carbone">{formatDate(lastSync)}</span>
            </span>
          </div>

          {syncResult && (
            <div className="p-3 bg-ivoire border border-sable/20">
              <p className="text-xs text-carbone font-light">
                {syncResult.synced} produto{syncResult.synced !== 1 ? "s" : ""} sincronizado{syncResult.synced !== 1 ? "s" : ""}.
              </p>
              {syncResult.errors.length > 0 && (
                <p className="text-xs text-red-600 font-light mt-1">
                  {syncResult.errors.length} erro{syncResult.errors.length !== 1 ? "s" : ""}: {syncResult.errors[0]}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSyncResult(null);
                syncMutation.mutate();
              }}
              disabled={syncMutation.isPending}
              className="px-4 py-1.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
            >
              {syncMutation.isPending ? "Sincronizando..." : "Sincronizar produtos"}
            </button>
            <button
              type="button"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="px-4 py-1.5 border border-sable text-terre text-xs font-light tracking-wide hover:bg-ivoire disabled:opacity-50 transition-colors"
            >
              {disconnectMutation.isPending ? "Desconectando..." : "Desconectar"}
            </button>
          </div>

          {syncMutation.error && (
            <p className="text-xs text-red-600 font-light">{syncMutation.error.message}</p>
          )}
          {disconnectMutation.error && (
            <p className="text-xs text-red-600 font-light">{disconnectMutation.error.message}</p>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 pt-4 border-t border-sable/20 space-y-3">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Dominio da loja
            </label>
            <input
              type="text"
              value={shopInput}
              onChange={(e) => setShopInput(e.target.value)}
              placeholder="minha-loja.myshopify.com"
              className="w-full px-3 py-2 border border-sable/40 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
            <p className="text-[10px] text-pierre font-light mt-1">
              Use o dominio completo .myshopify.com ou apenas o subdominio.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={connectMutation.isPending || !shopInput.trim()}
            className="px-4 py-1.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
          >
            {connectMutation.isPending ? "Redirecionando..." : "Conectar Shopify"}
          </button>
          {connectMutation.error && (
            <p className="text-xs text-red-600 font-light mt-2">
              {connectMutation.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function IntegracaoPage() {
  const utils = trpc.useUtils();
  const tenant = trpc.tenant.getMine.useQuery();
  const updateConfig = trpc.tenant.updateConfig.useMutation({
    onSuccess: () => {
      utils.tenant.getMine.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [ctaMode, setCtaMode] = useState<CtaMode>("external");
  const [storefrontEnabled, setStorefrontEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(DEFAULT_WHATSAPP_MESSAGE);
  const [mercadoPagoEnabled, setMercadoPagoEnabled] = useState(false);
  const [mercadoPagoEmail, setMercadoPagoEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = tenant.data?.tenantConfig;
    if (config) {
      setStorefrontEnabled(config.storefrontEnabled ?? false);
      setCtaMode((config.storefrontCtaMode as CtaMode) ?? "external");
      setWhatsappNumber(config.whatsappNumber ?? "");
      setWhatsappMessage(config.whatsappMessage ?? DEFAULT_WHATSAPP_MESSAGE);
      setMercadoPagoEnabled(config.mercadoPagoEnabled ?? false);
      setMercadoPagoEmail(config.mercadoPagoEmail ?? "");
    }
  }, [tenant.data]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateConfig.mutate({
      storefrontEnabled,
      storefrontCtaMode: ctaMode,
      whatsappNumber: whatsappNumber || undefined,
      whatsappMessage: whatsappMessage || null,
      mercadoPagoEnabled,
      mercadoPagoEmail: mercadoPagoEmail || null,
    });
  }

  // Build preview WhatsApp URL
  const previewMessage = whatsappMessage
    .replace("{produto}", "Serum Vitamina C")
    .replace("{preco}", "89.90")
    .replace("{kit}", "Kit Anti-Acne")
    .replace("{cliente}", "Maria");

  const showWhatsAppSection = ctaMode === "whatsapp" || ctaMode === "both";
  const showMercadoPagoSection = ctaMode === "mercadopago" || ctaMode === "both";

  if (tenant.isLoading) {
    return <div className="p-8 text-pierre font-light text-sm">Carregando...</div>;
  }

  return (
    <>
      <OrganizationTabs />
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-2xl text-carbone">Integracoes e Vendas</h1>
      <p className="text-pierre text-sm font-light mt-1">
        Configure como seus clientes compram os produtos recomendados.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">

        {/* Section 1: Storefront enable toggle */}
        <div>
          <h2 className="font-serif text-xl text-carbone mb-1">Storefront Lite</h2>
          <p className="text-pierre text-sm font-light mb-4">
            Ative para usar as opcoes de venda abaixo. Quando desativado, os produtos so exibem CTA se tiverem link externo cadastrado.
          </p>
          <div className="flex items-start justify-between p-5 bg-white border border-sable/20">
            <div>
              <p className="text-sm text-carbone">Habilitar Storefront Lite</p>
              <p className="text-xs text-pierre font-light mt-1">
                Permite vender diretamente via WhatsApp ou MercadoPago sem loja virtual.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStorefrontEnabled((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border transition-colors focus:outline-none ${
                storefrontEnabled
                  ? "bg-carbone border-carbone"
                  : "bg-sable/40 border-sable/40"
              }`}
              role="switch"
              aria-checked={storefrontEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform bg-blanc-casse transition-transform ${
                  storefrontEnabled ? "translate-x-4" : "translate-x-0.5"
                }`}
                style={{ marginTop: "2px" }}
              />
            </button>
          </div>
        </div>

        {/* Section 2: Modo de Venda */}
        <div>
          <h2 className="font-serif text-xl text-carbone mb-1">Modo de Venda</h2>
          <p className="text-pierre text-sm font-light mb-4">
            Escolha como o botao de compra aparece para os consumidores nas telas de resultado e kit.
          </p>
          <div className="space-y-2">
            {ctaModeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-4 p-4 border cursor-pointer transition-colors ${
                  ctaMode === option.value
                    ? "border-carbone bg-white"
                    : "border-sable/20 bg-white hover:bg-ivoire"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-4 h-4 border flex items-center justify-center ${
                      ctaMode === option.value
                        ? "border-carbone"
                        : "border-sable/40"
                    }`}
                  >
                    {ctaMode === option.value && (
                      <div className="w-2 h-2 bg-carbone" />
                    )}
                  </div>
                </div>
                <input
                  type="radio"
                  name="ctaMode"
                  value={option.value}
                  checked={ctaMode === option.value}
                  onChange={() => setCtaMode(option.value)}
                  className="sr-only"
                />
                <div>
                  <p className="text-sm text-carbone">{option.label}</p>
                  <p className="text-xs text-pierre font-light mt-0.5">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section 3: WhatsApp Config */}
        {showWhatsAppSection && (
          <div>
            <h2 className="font-serif text-xl text-carbone mb-1">
              Configuracao do WhatsApp
            </h2>
            <p className="text-pierre text-sm font-light mb-4">
              Defina o numero e a mensagem enviada quando o consumidor clicar em Comprar via WhatsApp.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                  Numero do WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
                />
                <p className="text-xs text-pierre font-light mt-1">
                  Formato recomendado: +55 11 99999-9999. Inclua o codigo do pais e DDD.
                </p>
              </div>

              <div>
                <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                  Modelo de mensagem
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
                />
                <p className="text-xs text-pierre font-light mt-1">
                  Variaveis disponiveis: {"{produto}"}, {"{preco}"}, {"{kit}"}, {"{cliente}"}
                </p>
              </div>

              {/* Preview */}
              {whatsappNumber && (
                <div className="p-4 bg-ivoire border border-sable/20">
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                    Preview da mensagem
                  </p>
                  <p className="text-xs text-terre font-light leading-relaxed">
                    {previewMessage}
                  </p>
                  <p className="text-[10px] text-pierre font-light mt-2">
                    Enviado para: {whatsappNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: MercadoPago Config */}
        {showMercadoPagoSection && (
          <div>
            <h2 className="font-serif text-xl text-carbone mb-1">
              Configuracao do MercadoPago
            </h2>
            <p className="text-pierre text-sm font-light mb-4">
              Configure o recebimento de pagamentos via MercadoPago.
            </p>
            <div className="space-y-5">
              <div className="flex items-start justify-between p-5 bg-white border border-sable/20">
                <div>
                  <p className="text-sm text-carbone">Habilitar MercadoPago</p>
                  <p className="text-xs text-pierre font-light mt-1">
                    Exibe o botao de pagamento nos produtos recomendados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMercadoPagoEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border transition-colors focus:outline-none ${
                    mercadoPagoEnabled
                      ? "bg-carbone border-carbone"
                      : "bg-sable/40 border-sable/40"
                  }`}
                  role="switch"
                  aria-checked={mercadoPagoEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform bg-blanc-casse transition-transform ${
                      mercadoPagoEnabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                    style={{ marginTop: "2px" }}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                  Email do MercadoPago
                </label>
                <input
                  type="email"
                  value={mercadoPagoEmail}
                  onChange={(e) => setMercadoPagoEmail(e.target.value)}
                  placeholder="pagamentos@suamarca.com.br"
                  className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
                />
                <p className="text-xs text-pierre font-light mt-1">
                  Email associado a sua conta MercadoPago para receber os pagamentos.
                </p>
              </div>

              <div className="p-4 bg-ivoire border border-sable/20">
                <p className="text-xs text-terre font-light leading-relaxed">
                  O sistema gera um link de pagamento MercadoPago por produto no momento do clique.
                  Integracao completa com checkout disponivel em breve.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={updateConfig.isPending}
            className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
          >
            {updateConfig.isPending ? "Salvando..." : "Salvar configuracoes"}
          </button>
          {saved && (
            <span className="text-sm text-pierre font-light">Salvo.</span>
          )}
          {updateConfig.error && (
            <span className="text-sm text-red-600 font-light">
              {updateConfig.error.message}
            </span>
          )}
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-sable/20 my-12" />

      {/* Section 5: Integrations */}
      <div>
        <h2 className="font-serif text-xl text-carbone mb-1">Integracoes</h2>
        <p className="text-pierre text-sm font-light mb-6">
          Conexoes diretas com plataformas de ecommerce e ERP.
        </p>
        <div className="space-y-3">
          <NuvemshopCard />
          <ShopifyCard />
          {otherIntegrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-5 bg-white border border-sable/20"
            >
              <div>
                <p className="text-sm text-carbone">{integration.name}</p>
                <p className="text-xs text-pierre font-light mt-0.5">
                  {integration.description}
                </p>
              </div>
              <span className="text-[10px] text-pierre uppercase tracking-wider font-light px-3 py-1 border border-sable/30 flex-shrink-0">
                {integration.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
