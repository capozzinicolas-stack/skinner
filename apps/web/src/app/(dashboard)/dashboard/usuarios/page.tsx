"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const roleLabels: Record<string, string> = {
  b2b_admin: "Admin",
  b2b_analyst: "Analista",
  b2b_viewer: "Visualizador",
};

export default function UsersPage() {
  const utils = trpc.useUtils();
  const users = trpc.user.listByTenant.useQuery();
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.listByTenant.invalidate();
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "b2b_viewer" });
    },
  });
  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => utils.user.listByTenant.invalidate(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "b2b_viewer",
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie a equipe do seu portal.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          {showCreate ? "Cancelar" : "Convidar Usuário"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role as "b2b_admin" | "b2b_analyst" | "b2b_viewer",
            });
          }}
          className="mt-6 p-6 bg-white rounded-xl border shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold">Novo Usuário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Papel</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="b2b_viewer">Visualizador</option>
                <option value="b2b_analyst">Analista</option>
                <option value="b2b_admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Criando..." : "Criar Usuário"}
          </button>
          {createMutation.error && (
            <p className="text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </form>
      )}

      <div className="mt-8">
        {users.isLoading && <p className="text-gray-500">Carregando...</p>}

        {users.data && users.data.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    E-mail
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Papel
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${user.name}?`)) {
                            deleteMutation.mutate({ id: user.id });
                          }
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
