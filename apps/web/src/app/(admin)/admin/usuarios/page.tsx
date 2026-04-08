"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const roleLabels: Record<string, string> = {
  skinner_admin: "Skinner Admin",
  b2b_admin: "Admin",
  b2b_analyst: "Analista",
  b2b_viewer: "Visualizador",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function UsuariosPage() {
  const utils = trpc.useUtils();
  const users = trpc.admin.listAllUsers.useQuery();
  const tenants = trpc.tenant.list.useQuery();

  const createUser = trpc.admin.createUserForTenant.useMutation({
    onSuccess: () => {
      utils.admin.listAllUsers.invalidate();
      setShowCreate(false);
      setForm({ email: "", name: "", password: "", role: "b2b_viewer", tenantId: "" });
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      utils.admin.listAllUsers.invalidate();
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "b2b_viewer",
    tenantId: "",
  });

  const [search, setSearch] = useState("");

  const filtered = users.data
    ? users.data.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.tenant?.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Usuarios</h1>
          <p className="text-sm text-pierre font-light mt-1">
            Todos os usuarios da plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
        >
          {showCreate ? "Cancelar" : "Novo Usuario"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate({
              email: form.email,
              name: form.name,
              password: form.password,
              role: form.role as
                | "skinner_admin"
                | "b2b_admin"
                | "b2b_analyst"
                | "b2b_viewer",
              tenantId: form.tenantId || undefined,
            });
          }}
          className="mb-8 p-6 bg-white border border-sable/20 space-y-4"
        >
          <h2 className="font-serif text-base text-carbone">Criar usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Nome
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="usuario@email.com"
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Senha
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Minimo 6 caracteres"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Perfil
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              >
                <option value="b2b_viewer">Visualizador</option>
                <option value="b2b_analyst">Analista</option>
                <option value="b2b_admin">Admin B2B</option>
                <option value="skinner_admin">Skinner Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Tenant (opcional)
              </label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              >
                <option value="">Sem tenant (admin global)</option>
                {tenants.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={createUser.isPending}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {createUser.isPending ? "Criando..." : "Criar"}
            </button>
            {createUser.error && (
              <p className="text-sm text-pierre font-light">
                {createUser.error.message}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou tenant..."
          className="w-full max-w-md px-3 py-2 border border-sable/30 bg-white text-sm text-carbone font-light focus:outline-none focus:border-pierre"
        />
      </div>

      {users.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {!users.isLoading && filtered.length === 0 && (
        <p className="text-sm text-pierre font-light">Nenhum usuario encontrado.</p>
      )}

      {filtered.length > 0 && (
        <div className="bg-white border border-sable/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  E-mail
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Perfil
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Tenant
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Criado em
                </th>
                <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/10">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-ivoire/40">
                  <td className="px-6 py-4 text-sm text-carbone font-light">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-pierre font-light">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-pierre font-light">
                    {u.tenant?.name ?? (
                      <span className="text-[10px] uppercase tracking-wider text-pierre/60">
                        global
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-pierre font-light">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remover o usuario "${u.name}"? Esta acao nao pode ser desfeita.`)) {
                          deleteUser.mutate({ id: u.id });
                        }
                      }}
                      disabled={deleteUser.isPending}
                      className="text-xs text-pierre font-light hover:underline disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-sable/20 bg-ivoire">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
              {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
