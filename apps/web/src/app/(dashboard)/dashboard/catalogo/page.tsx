"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const stepLabels: Record<string, string> = {
  cleanser: "Limpeza",
  toner: "Tônico",
  serum: "Sérum",
  moisturizer: "Hidratante",
  SPF: "Protetor Solar",
  treatment: "Tratamento",
  mask: "Máscara",
  exfoliant: "Esfoliante",
  "eye-cream": "Área dos olhos",
};

const severityColors = ["", "bg-green-100 text-green-700", "bg-yellow-100 text-yellow-700", "bg-red-100 text-red-700"];

export default function CatalogPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [concernFilter, setConcernFilter] = useState("");
  const [stepFilter, setStepFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const products = trpc.product.list.useQuery({
    search: search || undefined,
    concernTag: concernFilter || undefined,
    step: stepFilter || undefined,
    activeOnly: !showInactive,
  });
  const stats = trpc.product.stats.useQuery();
  const tags = trpc.product.tagOptions.useQuery();
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
    },
  });
  const restoreMutation = trpc.product.restore.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
    },
  });

  function parseTags(json: string): string[] {
    try { return JSON.parse(json); } catch { return []; }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">
            {stats.data ? `${stats.data.active} ativos de ${stats.data.total} produtos` : "Carregando..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/catalogo/importar"
            className="px-4 py-2 border border-brand-300 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            Importar CSV
          </Link>
          <Link
            href="/dashboard/catalogo/novo"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="px-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={concernFilter}
          onChange={(e) => setConcernFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todas condições</option>
          {tags.data?.concerns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={stepFilter}
          onChange={(e) => setStepFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todas etapas</option>
          {tags.data?.steps.map((s) => (
            <option key={s} value={s}>{stepLabels[s] ?? s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Mostrar inativos
        </label>
      </div>

      {/* Product list */}
      <div className="mt-6">
        {products.isLoading && <p className="text-gray-500">Carregando...</p>}

        {products.data && products.data.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <p className="text-gray-500">Nenhum produto encontrado.</p>
            <Link
              href="/dashboard/catalogo/novo"
              className="text-brand-600 text-sm hover:underline mt-2 inline-block"
            >
              Adicionar primeiro produto
            </Link>
          </div>
        )}

        {products.data && products.data.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Etapa</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Condições</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Intensidade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.data.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${!product.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            IMG
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.stepRoutine ? stepLabels[product.stepRoutine] ?? product.stepRoutine : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {parseTags(product.concernTags).map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[product.severityLevel]}`}>
                        {product.severityLevel === 1 ? "Leve" : product.severityLevel === 2 ? "Moderado" : "Intenso"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.price ? `R$ ${product.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/dashboard/catalogo/novo?edit=${product.id}`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Editar
                      </Link>
                      {product.isActive ? (
                        <button
                          onClick={() => deleteMutation.mutate({ id: product.id })}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          onClick={() => restoreMutation.mutate({ id: product.id })}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Reativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tag coverage */}
      {stats.data && Object.keys(stats.data.tagCounts).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Cobertura por condição</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.data.tagCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, count]) => (
                <span key={tag} className="text-sm px-3 py-1 rounded-full bg-brand-50 text-brand-700">
                  {tag}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
