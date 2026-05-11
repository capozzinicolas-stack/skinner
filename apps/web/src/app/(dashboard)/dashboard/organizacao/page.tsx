"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { OrganizationTabs } from "@/components/shared/organization-tabs";
import { useI18n } from "@/lib/i18n/client";

// Static lists kept inline so we don't fetch them on every page hit.
// Country list focused on LATAM + key Skinner-targeted markets.
const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "BR", name: "Brasil" },
  { code: "AR", name: "Argentina" },
  { code: "MX", name: "Mexico" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguai" },
  { code: "PY", name: "Paraguai" },
  { code: "EC", name: "Equador" },
  { code: "VE", name: "Venezuela" },
  { code: "BO", name: "Bolivia" },
  { code: "ES", name: "Espanha" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "Estados Unidos" },
];

// Common IANA timezones for our markets. Not exhaustive — admin-add-anything
// would require a tz validation lib.
const TIMEZONES: Array<{ value: string; label: string }> = [
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT)" },
  { value: "America/Argentina/Buenos_Aires", label: "America/Argentina/Buenos_Aires (ART)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (CST)" },
  { value: "America/Santiago", label: "America/Santiago (CLT)" },
  { value: "America/Bogota", label: "America/Bogota (COT)" },
  { value: "America/Lima", label: "America/Lima (PET)" },
  { value: "America/Montevideo", label: "America/Montevideo (UYT)" },
  { value: "America/Caracas", label: "America/Caracas (VET)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET)" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon (WET)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
];

export default function MinhaOrganizacaoPage() {
  const { t } = useI18n();
  const router = useRouter();
  const utils = trpc.useUtils();
  const tenant = trpc.tenant.getMine.useQuery();
  const me = trpc.user.me.useQuery();

  const [form, setForm] = useState({
    name: "",
    country: "",
    timezone: "",
    defaultLocale: "pt-BR" as "pt-BR" | "es" | "en",
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (tenant.data) {
      setForm({
        name: tenant.data.name ?? "",
        country: tenant.data.country ?? "",
        timezone: tenant.data.timezone ?? "",
        defaultLocale: (tenant.data.defaultLocale as "pt-BR" | "es" | "en") ?? "pt-BR",
      });
    }
  }, [tenant.data]);

  const update = trpc.tenant.updateOrganization.useMutation({
    onSuccess: () => {
      setMsg({ type: "ok", text: t.dashboardPages.org_saved });
      utils.tenant.getMine.invalidate();
      // The dashboard layout (Server Component) resolves the user/tenant locale
      // on render via resolveDashboardLocale(). Without router.refresh() it
      // keeps serving the old locale until a hard reload. Refresh triggers a
      // re-render of the server tree with the new defaultLocale picked up,
      // which propagates into the I18nProvider that wraps the dashboard.
      router.refresh();
    },
    onError: (err) => setMsg({ type: "err", text: err.message }),
  });

  const isAdmin = me.data?.role === "b2b_admin" || me.data?.role === "skinner_admin";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setMsg(null);
    update.mutate({
      name: form.name,
      country: form.country || null,
      timezone: form.timezone || null,
      defaultLocale: form.defaultLocale,
    });
  }

  if (tenant.isLoading) {
    return <p className="p-8 text-sm text-pierre font-light">{t.dashboardPages.common_loading}</p>;
  }

  return (
    <div>
      <OrganizationTabs />
      <div className="p-4 md:p-8 max-w-3xl">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-xl md:text-2xl text-carbone">{t.dashboardPages.org_title}</h1>
        <p className="text-sm text-pierre font-light mt-1">
          {t.dashboardPages.org_subtitle}
        </p>
      </div>

      {/* Identificadores (read-only) */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">{t.dashboardPages.org_identifiers}</h2>
        <div className="bg-white border border-sable/20 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.org_id_label}
            </p>
            <p className="text-sm text-carbone font-mono">{tenant.data?.id}</p>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.org_slug_label}
            </p>
            <p className="text-sm text-carbone font-mono">{tenant.data?.slug}</p>
            <p className="text-[10px] text-pierre/70 font-light mt-1">
              {t.dashboardPages.org_slug_hint.replace("{slug}", tenant.data?.slug ?? "")}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.org_plan_label}
            </p>
            <p className="text-sm text-carbone font-light">
              {tenant.data?.planLabel ?? tenant.data?.plan}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.org_status_label}
            </p>
            <p className="text-sm text-carbone font-light capitalize">
              {tenant.data?.status}
            </p>
          </div>
        </div>
      </section>

      {/* Dados editaveis */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">{t.dashboardPages.org_data_section}</h2>
        {!isAdmin && (
          <p className="mb-4 px-4 py-3 bg-ivoire border border-sable/30 text-xs text-pierre font-light">
            {t.dashboardPages.org_read_only_notice}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white border border-sable/20 p-6"
        >
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.org_name_label}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              minLength={2}
              maxLength={100}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre disabled:bg-ivoire/50 disabled:text-pierre"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.org_country_label}
              </label>
              <select
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre disabled:bg-ivoire/50 disabled:text-pierre"
              >
                <option value="">{t.dashboardPages.org_country_placeholder}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.org_timezone_label}
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre disabled:bg-ivoire/50 disabled:text-pierre"
              >
                <option value="">{t.dashboardPages.org_timezone_placeholder}</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-pierre/70 font-light mt-1">
                {t.dashboardPages.org_timezone_hint}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.org_locale_label}
            </label>
            <select
              value={form.defaultLocale}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  defaultLocale: e.target.value as "pt-BR" | "es" | "en",
                }))
              }
              disabled={!isAdmin}
              className="w-full max-w-sm px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre disabled:bg-ivoire/50 disabled:text-pierre"
            >
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
            <p className="text-[10px] text-pierre/70 font-light mt-1">
              {t.dashboardPages.org_locale_hint}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={update.isPending}
                className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50 min-h-[44px] md:min-h-0"
              >
                {update.isPending ? t.dashboardPages.org_saving : t.dashboardPages.org_save}
              </button>
              {msg && (
                <p
                  className={`text-sm font-light ${
                    msg.type === "ok" ? "text-carbone" : "text-pierre"
                  }`}
                >
                  {msg.text}
                </p>
              )}
            </div>
          )}
        </form>
      </section>
      </div>
    </div>
  );
}
