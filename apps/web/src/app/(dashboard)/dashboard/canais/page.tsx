"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { OrganizationTabs } from "@/components/shared/organization-tabs";
import { useI18n } from "@/lib/i18n/client";

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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(d));
}

type ChannelRow = {
  id: string;
  slug: string;
  label: string;
  isDefault: boolean;
  status: string;
  expiresAt: Date | string | null;
  maxAnalyses: number | null;
  analysisCount: number;
  isExpired: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  tenantId: string;
};

export default function ChannelsPage() {
  const { t } = useI18n();
  const tenant = trpc.tenant.getMine.useQuery();
  const channelsQuery = trpc.analysisChannel.list.useQuery();
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const tenantSlug = tenant.data?.slug ?? "";
  const channels = channelsQuery.data?.channels ?? [];
  const maxChannels = channelsQuery.data?.maxChannels ?? 1;
  const planName = channelsQuery.data?.planName ?? "—";
  const channelsRemaining = Math.max(0, maxChannels - channels.length);
  const canCreate = channelsRemaining > 0;

  // Default-select the first/default channel for the inspect view.
  const activeChannel =
    channels.find((c) => c.id === activeChannelId) ??
    channels.find((c) => c.isDefault) ??
    channels[0] ??
    null;

  if (tenant.isLoading || channelsQuery.isLoading) {
    return (
      <>
        <OrganizationTabs />
        <div className="p-8 text-pierre font-light text-sm">Carregando...</div>
      </>
    );
  }

  return (
    <>
      <OrganizationTabs />
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="border-b border-sable/20 pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl md:text-2xl text-carbone">{t.dashboardPages.chan_title}</h1>
          <p className="text-pierre text-sm font-light mt-1">
            {t.dashboardPages.chan_subtitle}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Plano {planName}</p>
          <p className="text-sm text-carbone font-light mt-1">
            {t.dashboardPages.chan_plan_cap.replace("{count}", String(channels.length)).replace("{max}", String(maxChannels))}
          </p>
        </div>
      </div>

      {/* Channel list */}
      <div className="bg-white border border-sable/20 mb-8">
        <div className="border-b border-sable/20 px-5 py-3 flex items-center justify-between bg-ivoire/40">
          <h2 className="font-serif text-base text-carbone">{t.dashboardPages.chan_your_channels}</h2>
          <button
            onClick={() => setShowCreate(true)}
            disabled={!canCreate}
            className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.dashboardPages.chan_new_button}
          </button>
        </div>
        {!canCreate && (
          <div className="px-5 py-3 bg-ivoire border-b border-sable/20 text-xs text-pierre font-light">
            {t.dashboardPages.chan_limit_intro.replace("{plan}", planName)}{" "}
            <a href="/dashboard/faturamento" className="text-carbone underline">
              {t.dashboard.nav_billing}
            </a>{" "}
            {t.dashboardPages.chan_limit_tail}
          </div>
        )}
        <div className="divide-y divide-sable/10">
          {channels.map((c) => {
            const isActive = activeChannel?.id === c.id;
            const isLive = c.status === "active" && !c.isExpired;
            return (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`w-full text-left px-5 py-3 flex items-center justify-between ${
                  isActive ? "bg-ivoire/60" : "hover:bg-ivoire/30"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-carbone font-light truncate">{c.label}</span>
                    {c.isDefault && (
                      <span className="text-[10px] text-pierre uppercase tracking-wider font-light">{t.dashboardPages.chan_default}</span>
                    )}
                    <span
                      className={`text-[10px] uppercase tracking-wider font-light px-2 py-0.5 ${
                        isLive
                          ? "bg-carbone/10 text-carbone"
                          : c.isExpired
                          ? "bg-terre/20 text-terre"
                          : "bg-sable/30 text-pierre"
                      }`}
                    >
                      {c.isExpired
                        ? t.dashboardPages.chan_status_expired
                        : c.status === "paused"
                          ? t.dashboardPages.chan_status_paused
                          : t.dashboardPages.chan_status_active}
                    </span>
                  </div>
                  <p className="text-[11px] text-pierre/70 font-mono mt-0.5 truncate">
                    /{c.slug}
                  </p>
                </div>
                <div className="text-right text-xs text-pierre font-light flex-shrink-0 ml-4">
                  <div>{t.dashboardPages.chan_analyses_count.replace("{count}", String(c.analysisCount))}</div>
                  {c.expiresAt && (
                    <div className="text-[10px] text-pierre/60">{t.dashboardPages.chan_expires_label.replace("{date}", fmtDate(c.expiresAt))}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <CreateChannelModal
          tenantSlug={tenantSlug}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            utils.analysisChannel.list.invalidate();
            setShowCreate(false);
          }}
        />
      )}

      {/* Channel detail (link / qr / embed) */}
      {activeChannel && <ChannelDetail channel={activeChannel} />}
    </div>
    </>
  );
}

function ChannelDetail({ channel }: { channel: ChannelRow }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"link" | "qr" | "embed" | "personalize">("link");
  const [embedOpts, setEmbedOpts] = useState<EmbedOptions>(DEFAULT_EMBED_OPTIONS);
  const [copied, setCopied] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const updateMutation = trpc.analysisChannel.update.useMutation({
    onSuccess: () => utils.analysisChannel.list.invalidate(),
  });
  const archiveMutation = trpc.analysisChannel.archive.useMutation({
    onSuccess: () => utils.analysisChannel.list.invalidate(),
  });

  const analysisUrl = `${PUBLIC_ORIGIN}/analise/${channel.slug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(analysisUrl)}`;
  const embedSnippet = buildEmbedSnippet(channel.slug, embedOpts);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="bg-white border border-sable/20">
      <div className="px-5 py-4 border-b border-sable/20 flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">{t.dashboardPages.chan_selected}</p>
          <h2 className="font-serif text-lg text-carbone truncate">{channel.label}</h2>
        </div>
        <div className="flex items-center gap-2">
          {!channel.isDefault && channel.status === "active" && (
            <button
              onClick={() =>
                updateMutation.mutate({ id: channel.id, status: "paused" })
              }
              className="px-3 py-1.5 border border-sable text-pierre text-xs font-light"
            >
              {t.dashboardPages.chan_pause}
            </button>
          )}
          {!channel.isDefault && channel.status === "paused" && (
            <button
              onClick={() =>
                updateMutation.mutate({ id: channel.id, status: "active" })
              }
              className="px-3 py-1.5 border border-sable text-carbone text-xs font-light"
            >
              {t.dashboardPages.chan_reactivate}
            </button>
          )}
          {!channel.isDefault && (
            <button
              onClick={() => {
                if (
                  confirm(
                    t.dashboardPages.chan_confirm_delete.replace("{label}", channel.label)
                  )
                ) {
                  archiveMutation.mutate({ id: channel.id });
                }
              }}
              className="px-3 py-1.5 border border-terre/40 text-terre text-xs font-light"
            >
              {t.dashboardPages.chan_delete}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-b border-sable/20 flex gap-1 flex-wrap">
        {(["link", "qr", "embed", "personalize"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 text-xs font-light tracking-wide ${
              tab === tabKey ? "bg-carbone text-blanc-casse" : "text-pierre hover:bg-ivoire/40"
            }`}
          >
            {tabKey === "link"
              ? t.dashboardPages.chan_tab_link
              : tabKey === "qr"
              ? t.dashboardPages.chan_tab_qr
              : tabKey === "embed"
              ? t.dashboardPages.chan_tab_widget
              : t.dashboardPages.chan_tab_branding}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "link" && (
          <div className="space-y-3">
            <p className="text-sm text-pierre font-light">
              {t.dashboardPages.chan_link_intro}
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={analysisUrl}
                className="flex-1 px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
              />
              <button
                onClick={() => copy(analysisUrl, "link")}
                className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
              >
                {copied === "link" ? t.dashboardPages.chan_copied : t.dashboardPages.chan_copy}
              </button>
            </div>
          </div>
        )}

        {tab === "qr" && (
          <div className="space-y-3">
            <p className="text-sm text-pierre font-light">
              {t.dashboardPages.chan_qr_intro}
            </p>
            <div className="flex flex-col items-center gap-3">
              <img src={qrApiUrl} alt="QR Code" className="w-48 h-48 border border-sable/30" />
              <a
                href={qrApiUrl}
                download={`skinner-qr-${channel.slug}.png`}
                className="px-4 py-2 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire"
              >
                {t.dashboardPages.chan_qr_download}
              </a>
            </div>
          </div>
        )}

        {tab === "embed" && (
          <div className="space-y-5">
            <p className="text-sm text-pierre font-light">
              {t.dashboardPages.chan_embed_intro}
            </p>

            <div className="p-4 bg-blanc-casse border border-sable/20 space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-light text-pierre">{t.dashboardPages.chan_embed_personalize}</p>
              <label className="flex items-center gap-3 text-sm text-carbone font-light">
                <input
                  type="checkbox"
                  checked={embedOpts.contactOff}
                  onChange={(e) =>
                    setEmbedOpts((o) => ({ ...o, contactOff: e.target.checked }))
                  }
                />
                {t.dashboardPages.chan_embed_skip_contact}
              </label>
              <label className="flex items-center gap-3 text-sm text-carbone font-light">
                <input
                  type="checkbox"
                  checked={embedOpts.compact}
                  onChange={(e) =>
                    setEmbedOpts((o) => ({ ...o, compact: e.target.checked }))
                  }
                />
                {t.dashboardPages.chan_embed_compact}
              </label>
              <label className="flex items-center gap-3 text-sm text-carbone font-light">
                <span className="w-32">{t.dashboardPages.chan_embed_height}</span>
                <input
                  type="number"
                  min={400}
                  value={embedOpts.height}
                  onChange={(e) => setEmbedOpts((o) => ({ ...o, height: e.target.value }))}
                  className="w-24 px-2 py-1 border border-sable/40 bg-white text-sm font-light"
                />
              </label>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-light text-pierre mb-2">{t.dashboardPages.chan_embed_snippet}</p>
              <pre className="p-4 bg-carbone text-blanc-casse text-xs font-mono overflow-x-auto whitespace-pre">
{embedSnippet}
              </pre>
              <button
                onClick={() => copy(embedSnippet, "snippet")}
                className="mt-3 px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
              >
                {copied === "snippet" ? t.dashboardPages.chan_copied : t.dashboardPages.chan_embed_copy_code}
              </button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-light text-pierre mb-2">{t.dashboardPages.chan_embed_helper_title}</p>
              <p className="text-xs text-pierre font-light mb-2">
                {t.dashboardPages.chan_embed_helper_intro}
              </p>
              <pre className="p-4 bg-carbone text-blanc-casse text-xs font-mono overflow-x-auto whitespace-pre">
{HELPER_SNIPPET}
              </pre>
              <button
                onClick={() => copy(HELPER_SNIPPET, "helper")}
                className="mt-3 px-3 py-1.5 border border-sable text-pierre text-xs font-light"
              >
                {copied === "helper" ? t.dashboardPages.chan_copied : t.dashboardPages.chan_copy}
              </button>
            </div>
          </div>
        )}

        {tab === "personalize" && <ChannelOverridesForm channelId={channel.id} />}
      </div>
    </div>
  );
}

// Subset of TenantConfig fields that a channel can override. Keep aligned with
// CHANNEL_OVERRIDE_FIELDS in apps/web/src/server/routers/analysis-channel.ts.
const OVERRIDE_FIELDS: Array<{
  key: string;
  label: string;
  type: "text" | "textarea" | "boolean";
  hint?: string;
}> = [
  { key: "welcomeTitle", label: "Titulo da tela inicial", type: "text" },
  { key: "welcomeDescription", label: "Descricao da tela inicial", type: "textarea" },
  { key: "welcomeCtaText", label: "Texto do botao Iniciar", type: "text" },
  { key: "welcomeSubtext", label: "Subtexto da tela inicial", type: "text" },
  { key: "consentExtraText", label: "Texto extra do consentimento", type: "textarea" },
  { key: "consentButtonText", label: "Texto do botao de consentimento", type: "text" },
  { key: "contactCaptureEnabled", label: "Mostrar tela de captura de contato", type: "boolean" },
  { key: "contactCaptureRequired", label: "Tornar contato obrigatorio", type: "boolean" },
  { key: "contactCustomMessage", label: "Mensagem da tela de contato", type: "textarea" },
  { key: "productCtaText", label: "Texto do botao do produto", type: "text" },
  { key: "serviceCtaText", label: "Texto do botao do servico", type: "text" },
  { key: "resultsTopMessage", label: "Mensagem topo do resultado", type: "textarea" },
  { key: "resultsFooterText", label: "Mensagem rodape do resultado", type: "textarea" },
];

function ChannelOverridesForm({ channelId }: { channelId: string }) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const channelsQuery = trpc.analysisChannel.list.useQuery();
  const channel = channelsQuery.data?.channels.find((c) => c.id === channelId);
  const allowIdentityLimit = channelsQuery.data?.allowIdentityLimit ?? false;
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [saved, setSaved] = useState(false);

  // Identity limit local state (separate from overrides because it lives on
  // dedicated columns, not the JSON blob).
  const channelIdentityLimit =
    (channel as { identityLimit?: number | null } | undefined)?.identityLimit ?? null;
  const channelIdentityWindow =
    (channel as { identityWindowDays?: number | null } | undefined)?.identityWindowDays ?? null;
  const [identityEnabled, setIdentityEnabled] = useState<boolean>(false);
  const [identityLimitValue, setIdentityLimitValue] = useState<string>("1");
  const [identityWindowValue, setIdentityWindowValue] = useState<string>("30");
  const [identityInitKey, setIdentityInitKey] = useState<string | null>(null);
  const identityKey = `${channelId}::${channelIdentityLimit ?? ""}::${channelIdentityWindow ?? ""}`;
  if (channel && identityInitKey !== identityKey) {
    if (channelIdentityLimit && channelIdentityLimit > 0) {
      setIdentityEnabled(true);
      setIdentityLimitValue(String(channelIdentityLimit));
      setIdentityWindowValue(String(channelIdentityWindow ?? 0));
    } else {
      setIdentityEnabled(false);
    }
    setIdentityInitKey(identityKey);
  }

  // Initialize values from channel.overrides on first render / channel change.
  // Channel comes from the list query; we only init once when it appears.
  const overridesJson = (channel as { overrides?: string | null } | undefined)?.overrides;
  const overridesKey = `${channelId}::${overridesJson ?? ""}`;
  const [initKey, setInitKey] = useState<string | null>(null);
  if (channel && initKey !== overridesKey) {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = overridesJson ? JSON.parse(overridesJson) : {};
    } catch {
      parsed = {};
    }
    const next: Record<string, string | boolean> = {};
    for (const f of OVERRIDE_FIELDS) {
      const v = parsed[f.key];
      if (v === undefined || v === null) continue;
      if (f.type === "boolean") next[f.key] = !!v;
      else next[f.key] = typeof v === "string" ? v : String(v);
    }
    setValues(next);
    setInitKey(overridesKey);
  }

  const updateMutation = trpc.analysisChannel.update.useMutation({
    onSuccess: () => {
      utils.analysisChannel.list.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function setField(key: string, val: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function clearField(key: string) {
    setValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSave() {
    // Strip empty strings so they fall back to tenant defaults instead of
    // overriding with an empty string.
    const overrides: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (typeof v === "string") {
        if (v.trim() !== "") overrides[k] = v;
      } else {
        overrides[k] = v;
      }
    }
    const identityLimit = identityEnabled ? Math.max(1, Number(identityLimitValue) || 1) : 0;
    const identityWindowDays = identityEnabled
      ? Math.max(0, Number(identityWindowValue) || 0)
      : 0;
    updateMutation.mutate({
      id: channelId,
      overrides: Object.keys(overrides).length > 0 ? overrides : null,
      identityLimit: identityEnabled ? identityLimit : null,
      identityWindowDays: identityEnabled ? identityWindowDays : null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-ivoire border border-sable/30">
        <p className="text-xs text-pierre font-light">
          Personalize textos e comportamentos especificos deste canal. Campos vazios usam o
          padrao da clinica configurado em <strong>Analise</strong> e <strong>Marca</strong>.
        </p>
      </div>

      {/* Identity-based abuse limit. Plan-gated — disabled toggle when the
          tenant's plan does not include this capability. */}
      <div className="p-4 bg-white border border-sable/30 space-y-3">
        <div>
          <p className="text-sm text-carbone">Limite por identidade do paciente</p>
          <p className="text-xs text-pierre font-light mt-1">
            Restringe quantas analises um mesmo e-mail ou WhatsApp pode realizar neste canal
            dentro de uma janela de tempo. Reduz abuso e garante que sua quota mensal nao seja
            consumida por poucas pessoas.
          </p>
        </div>

        {!allowIdentityLimit ? (
          <div className="p-3 bg-ivoire border border-sable/30">
            <p className="text-xs text-terre font-light">
              Esta funcionalidade nao esta disponivel no seu plano atual. Faca upgrade para
              Pro ou superior em <strong>Faturamento</strong>.
            </p>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3 text-sm text-carbone font-light">
              <input
                type="checkbox"
                checked={identityEnabled}
                onChange={(e) => setIdentityEnabled(e.target.checked)}
              />
              Ativar limite por paciente neste canal
            </label>

            {identityEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                <div>
                  <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                    Maximo de analises por paciente
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={identityLimitValue}
                    onChange={(e) => setIdentityLimitValue(e.target.value)}
                    className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                    Janela de tempo
                  </label>
                  <select
                    value={identityWindowValue}
                    onChange={(e) => setIdentityWindowValue(e.target.value)}
                    className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
                  >
                    <option value="0">Para sempre</option>
                    <option value="7">Ultimos 7 dias</option>
                    <option value="14">Ultimas 2 semanas</option>
                    <option value="30">Ultimos 30 dias</option>
                    <option value="60">Ultimos 60 dias</option>
                    <option value="90">Ultimos 90 dias</option>
                    <option value="180">Ultimos 6 meses</option>
                    <option value="365">Ultimo ano</option>
                  </select>
                </div>
              </div>
            )}

            {identityEnabled && (
              <div className="p-3 bg-ivoire border border-sable/30">
                <p className="text-xs text-pierre font-light">
                  <strong className="text-carbone">Atencao:</strong> ao ativar este limite, a
                  captura de contato (e-mail ou WhatsApp) vira obrigatoria neste canal. Pacientes
                  sem contato nao conseguirao realizar a analise. Configure em <strong>Analise</strong> ou
                  override neste canal abaixo se quiser ajustar mensagens.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Locale override — rendered separately because it's a select, not a
          text/textarea/boolean like the rest of OVERRIDE_FIELDS. Reads/writes
          the same overrides.locale slot the create modal seeds. */}
      <div className="border-b border-sable/15 pb-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light">
            {t.dashboardPages.chan_branding_locale}
          </label>
          {typeof values.locale === "string" && values.locale !== "" && (
            <button
              type="button"
              onClick={() => clearField("locale")}
              className="text-[10px] text-pierre hover:text-terre underline font-light"
            >
              {t.dashboardPages.chan_branding_locale_reset}
            </button>
          )}
        </div>
        <select
          value={typeof values.locale === "string" ? values.locale : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") clearField("locale");
            else setField("locale", v);
          }}
          className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
        >
          <option value="">{t.dashboardPages.chan_modal_locale_inherit}</option>
          <option value="pt-BR">Portugues (Brasil)</option>
          <option value="es">Espanol</option>
          <option value="en">English</option>
        </select>
        <p className="text-[10px] text-pierre/70 font-light mt-1">
          {t.dashboardPages.chan_modal_locale_hint}
        </p>
      </div>

      {OVERRIDE_FIELDS.map((field) => {
        const v = values[field.key];
        const isSet = v !== undefined;
        return (
          <div key={field.key} className="border-b border-sable/15 pb-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light">
                {field.label}
              </label>
              {isSet && (
                <button
                  type="button"
                  onClick={() => clearField(field.key)}
                  className="text-[10px] text-pierre hover:text-terre underline font-light"
                >
                  Voltar ao padrao
                </button>
              )}
            </div>
            {field.type === "boolean" ? (
              <label className="flex items-center gap-3 text-sm text-carbone font-light">
                <input
                  type="checkbox"
                  checked={typeof v === "boolean" ? v : false}
                  onChange={(e) => setField(field.key, e.target.checked)}
                />
                {isSet ? (typeof v === "boolean" && v ? "ativado" : "desativado") : "usando padrao"}
              </label>
            ) : field.type === "textarea" ? (
              <textarea
                value={typeof v === "string" ? v : ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder="(usando padrao da clinica)"
                rows={2}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
              />
            ) : (
              <input
                type="text"
                value={typeof v === "string" ? v : ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder="(usando padrao da clinica)"
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
              />
            )}
            {field.hint && (
              <p className="text-[10px] text-pierre/70 font-light mt-1">{field.hint}</p>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
        >
          {updateMutation.isPending ? "Salvando..." : "Salvar personalizacao"}
        </button>
        {saved && <span className="text-sm text-pierre font-light">Salvo.</span>}
        {updateMutation.error && (
          <span className="text-sm text-terre font-light">{updateMutation.error.message}</span>
        )}
      </div>
    </div>
  );
}

function CreateChannelModal({
  tenantSlug,
  onClose,
  onCreated,
}: {
  tenantSlug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxAnalyses, setMaxAnalyses] = useState("");
  // "" = inherit from Tenant.defaultLocale; otherwise persist an explicit
  // override on channel.overrides.locale.
  const [locale, setLocaleValue] = useState<"" | "pt-BR" | "es" | "en">("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.analysisChannel.create.useMutation({
    onSuccess: () => onCreated(),
    onError: (err) => setError(err.message),
  });

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!slugTouched) {
      const auto = slugify(value);
      setSlug(auto ? `${tenantSlug}-${auto}` : "");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      label: label.trim(),
      slug: slug.trim(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      maxAnalyses: maxAnalyses ? parseInt(maxAnalyses, 10) : null,
      locale: locale === "" ? null : locale,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-carbone/60 flex items-start justify-center overflow-y-auto py-12 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-sable max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-sable/30">
          <h2 className="font-serif text-lg text-carbone">{t.dashboardPages.chan_modal_title}</h2>
          <button onClick={onClose} className="text-pierre hover:text-carbone text-lg">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.chan_modal_label}
            </label>
            <input
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              required
              maxLength={60}
              placeholder={t.dashboardPages.chan_modal_label_placeholder}
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
            />
          </div>

          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.chan_modal_slug}
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              minLength={3}
              maxLength={60}
              pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-mono"
            />
            <p className="text-[10px] text-pierre/70 font-light mt-1 break-all">
              {t.dashboardPages.chan_modal_url_preview} {PUBLIC_ORIGIN}/analise/{slug || "..."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.chan_modal_expires}
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.chan_modal_max}
              </label>
              <input
                type="number"
                min={1}
                value={maxAnalyses}
                onChange={(e) => setMaxAnalyses(e.target.value)}
                placeholder={t.dashboardPages.chan_modal_max_placeholder}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.chan_modal_locale}
            </label>
            <select
              value={locale}
              onChange={(e) =>
                setLocaleValue(e.target.value as "" | "pt-BR" | "es" | "en")
              }
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light"
            >
              <option value="">{t.dashboardPages.chan_modal_locale_inherit}</option>
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
            <p className="text-[10px] text-pierre/70 font-light mt-1">
              {t.dashboardPages.chan_modal_locale_hint}
            </p>
          </div>

          {error && <p className="text-sm text-terre font-light">{error}</p>}

          <div className="flex items-center gap-3 pt-3 border-t border-sable/20">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {createMutation.isPending ? t.dashboardPages.chan_modal_creating : t.dashboardPages.chan_modal_create}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-sable text-pierre text-sm font-light"
            >
              {t.dashboardPages.common_cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
