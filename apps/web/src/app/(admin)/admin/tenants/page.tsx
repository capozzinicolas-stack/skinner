"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useI18n } from "@/lib/i18n/client";

const planLabels: Record<string, string> = {
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function TenantsPage() {
  const { t } = useI18n();
  const utils = trpc.useUtils();

  // Status config depends on locale, so build inside the component
  const statusConfig: Record<string, { label: string; classes: string }> = {
    active: { label: t.dashboardPages.admin_tenants_status_active_label, classes: "bg-carbone/10 text-carbone" },
    paused: { label: t.dashboardPages.admin_tenants_status_paused_label, classes: "bg-sable/30 text-pierre" },
    deleted: { label: t.dashboardPages.admin_tenants_status_deleted_label, classes: "bg-sable/20 text-pierre" },
  };
  const tenants = trpc.tenant.list.useQuery();
  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: () => {
      utils.tenant.list.invalidate();
      utils.tenant.stats.invalidate();
      setShowCreate(false);
      setForm({ name: "", slug: "", plan: "growth" });
    },
  });
  const updateMutation = trpc.tenant.update.useMutation({
    onSuccess: () => {
      utils.tenant.list.invalidate();
      utils.tenant.stats.invalidate();
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan: "growth" });

  function handleSlugify(name: string) {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setForm((f) => ({ ...f, name, slug }));
  }

  return (
    <div className="p-4 md:p-8">
      <div className="border-b border-sable/20 pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl md:text-2xl text-carbone">{t.dashboardPages.admin_tenants_title}</h1>
          <p className="text-sm text-pierre font-light mt-1">
            {t.dashboardPages.admin_tenants_subtitle_old}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/tenants/novo-custom"
            className="px-4 py-2 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire"
          >
            {t.dashboardPages.admin_tenants_new_custom}
          </Link>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
          >
            {showCreate ? t.dashboardPages.common_cancel : t.dashboardPages.admin_tenants_new}
          </button>
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              slug: form.slug,
              plan: form.plan as "growth" | "pro" | "enterprise",
            });
          }}
          className="mb-8 p-6 bg-white border border-sable/20 space-y-4"
        >
          <h2 className="font-serif text-base text-carbone">{t.dashboardPages.admin_tenants_create_title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.admin_tenants_field_name}
              </label>
              <input
                value={form.name}
                onChange={(e) => handleSlugify(e.target.value)}
                placeholder={t.dashboardPages.admin_tenants_field_name_ph}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.admin_tenants_field_slug}
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder={t.dashboardPages.admin_tenants_field_slug_ph}
                required
                pattern="^[a-z0-9-]+$"
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                {t.dashboardPages.admin_tenants_field_plan}
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              >
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {createMutation.isPending ? t.dashboardPages.admin_tenants_creating : t.dashboardPages.admin_tenants_create}
            </button>
            {createMutation.error && (
              <p className="text-sm text-pierre font-light">
                {createMutation.error.message}
              </p>
            )}
          </div>
        </form>
      )}

      {tenants.isLoading && (
        <p className="text-sm text-pierre font-light">{t.dashboardPages.common_loading}</p>
      )}

      {tenants.data && tenants.data.length === 0 && (
        <p className="text-sm text-pierre font-light">
          {t.dashboardPages.admin_tenants_no_register}
        </p>
      )}

      {tenants.data && tenants.data.length > 0 && (
        <div className="bg-white border border-sable/20 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_name}
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_slug}
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_plan}
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_status}
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_users}
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_products}
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.admin_tenants_th_analyses}
                </th>
                <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.dashboardPages.common_actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/10">
              {tenants.data.map((tenant) => {
                const status = statusConfig[tenant.status] ?? statusConfig.active;
                return (
                  <tr key={tenant.id} className="hover:bg-ivoire/40">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="text-sm text-carbone font-light hover:underline"
                      >
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-pierre font-light">
                      {tenant.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] uppercase tracking-wider font-light text-pierre">
                        {/* Custom plans (signed up via /admin/tenants/novo-custom)
                            carry their own planLabel — show that instead of the
                            generic tier name (Enterprise) so the listing matches
                            the contract. */}
                        {tenant.planLabel ?? planLabels[tenant.plan] ?? tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-light px-2 py-1 ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-pierre font-light">
                      {tenant._count.users}
                    </td>
                    <td className="px-6 py-4 text-sm text-pierre font-light">
                      {tenant._count.products}
                    </td>
                    <td className="px-6 py-4 text-sm text-pierre font-light">
                      {tenant._count.analyses}
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="text-xs text-pierre font-light hover:underline"
                      >
                        {t.dashboardPages.admin_tenants_actions_details}
                      </Link>
                      {tenant.status === "active" && (
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: tenant.id, status: "paused" })
                          }
                          className="text-xs text-pierre font-light hover:underline"
                        >
                          {t.dashboardPages.admin_tenants_action_pause}
                        </button>
                      )}
                      {tenant.status === "paused" && (
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: tenant.id, status: "active" })
                          }
                          className="text-xs text-carbone font-light hover:underline"
                        >
                          {t.dashboardPages.admin_tenants_action_activate}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
