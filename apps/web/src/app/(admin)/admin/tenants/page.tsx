"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const planLabels: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  active: { label: "Ativo", classes: "bg-carbone/10 text-carbone" },
  paused: { label: "Pausado", classes: "bg-sable/30 text-pierre" },
  deleted: { label: "Deletado", classes: "bg-sable/20 text-pierre" },
};

export default function TenantsPage() {
  const utils = trpc.useUtils();
  const tenants = trpc.tenant.list.useQuery();
  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: () => {
      utils.tenant.list.invalidate();
      utils.tenant.stats.invalidate();
      setShowCreate(false);
      setForm({ name: "", slug: "", plan: "starter" });
    },
  });
  const updateMutation = trpc.tenant.update.useMutation({
    onSuccess: () => {
      utils.tenant.list.invalidate();
      utils.tenant.stats.invalidate();
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan: "starter" });

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
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Tenants</h1>
          <p className="text-sm text-pierre font-light mt-1">
            Gerencie clientes B2B da plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
        >
          {showCreate ? "Cancelar" : "Novo Tenant"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              slug: form.slug,
              plan: form.plan as "starter" | "growth" | "enterprise",
            });
          }}
          className="mb-8 p-6 bg-white border border-sable/20 space-y-4"
        >
          <h2 className="font-serif text-base text-carbone">Criar Tenant</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Nome
              </label>
              <input
                value={form.name}
                onChange={(e) => handleSlugify(e.target.value)}
                placeholder="Clinica Exemplo"
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Slug
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="clinica-exemplo"
                required
                pattern="^[a-z0-9-]+$"
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Plano
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
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
              {createMutation.isPending ? "Criando..." : "Criar"}
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
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {tenants.data && tenants.data.length === 0 && (
        <p className="text-sm text-pierre font-light">
          Nenhum tenant cadastrado.
        </p>
      )}

      {tenants.data && tenants.data.length > 0 && (
        <div className="bg-white border border-sable/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Slug
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Plano
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Usuarios
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Produtos
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Analises
                </th>
                <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Acoes
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
                        {planLabels[tenant.plan] ?? tenant.plan}
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
                        Detalhes
                      </Link>
                      {tenant.status === "active" && (
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: tenant.id, status: "paused" })
                          }
                          className="text-xs text-pierre font-light hover:underline"
                        >
                          Pausar
                        </button>
                      )}
                      {tenant.status === "paused" && (
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: tenant.id, status: "active" })
                          }
                          className="text-xs text-carbone font-light hover:underline"
                        >
                          Ativar
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
