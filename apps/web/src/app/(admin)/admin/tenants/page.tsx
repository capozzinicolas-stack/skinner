"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const planLabels: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-700" },
  deleted: { label: "Deletado", color: "bg-red-100 text-red-700" },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">Gerencie clientes B2B.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
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
          className="mt-6 p-6 bg-white rounded-xl border shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold">Criar Tenant</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                value={form.name}
                onChange={(e) => handleSlugify(e.target.value)}
                placeholder="Clínica Exemplo"
                required
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="clinica-exemplo"
                required
                pattern="^[a-z0-9-]+$"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plano</label>
              <select
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Criando..." : "Criar"}
          </button>
          {createMutation.error && (
            <p className="text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </form>
      )}

      <div className="mt-8">
        {tenants.isLoading && <p className="text-gray-500">Carregando...</p>}

        {tenants.data && tenants.data.length === 0 && (
          <p className="text-gray-500">Nenhum tenant cadastrado.</p>
        )}

        {tenants.data && tenants.data.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Slug
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Plano
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Usuários
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Produtos
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Análises
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.data.map((tenant) => {
                  const status = statusLabels[tenant.status] ?? statusLabels.active;
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenant.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-100 text-brand-700">
                          {planLabels[tenant.plan] ?? tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenant._count.users}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenant._count.products}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenant._count.analyses}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {tenant.status === "active" && (
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: tenant.id,
                                status: "paused",
                              })
                            }
                            className="text-xs text-yellow-600 hover:underline"
                          >
                            Pausar
                          </button>
                        )}
                        {tenant.status === "paused" && (
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: tenant.id,
                                status: "active",
                              })
                            }
                            className="text-xs text-green-600 hover:underline"
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
    </div>
  );
}
