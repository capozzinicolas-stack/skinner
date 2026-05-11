"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useI18n } from "@/lib/i18n/client";

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

const sessionFrequencyLabels: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

function parseTags(json: string): string[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function buildCSVRow(values: string[]): string {
  return values
    .map((v) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

const CSV_HEADERS = [
  "sku",
  "name",
  "description",
  "price",
  "ecommerce_link",
  "active_ingredients",
  "concern_tags",
  "skin_type_tags",
  "objective_tags",
  "severity_level",
  "step_routine",
  "use_time",
  "contraindications",
  "is_active",
];

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  ecommerceLink: string | null;
  activeIngredients: string | null;
  concernTags: string;
  skinTypeTags: string;
  objectiveTags: string;
  severityLevel: number;
  stepRoutine: string | null;
  useTime: string;
  contraindications: string | null;
  isActive: boolean;
  type?: string | null;
  bookingLink?: string | null;
  sessionCount?: number | null;
  sessionFrequency?: string | null;
  durationMinutes?: number | null;
};

function ConfirmDialog({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbone/40">
      <div className="bg-blanc-casse border border-sable/30 p-8 max-w-sm w-full mx-4">
        <h3 className="font-serif text-lg text-carbone">Desativar item</h3>
        <p className="text-sm text-pierre font-light mt-3">
          Tem certeza que deseja desativar{" "}
          <span className="text-carbone font-normal">{productName}</span>? O
          item não aparecerá em novas recomendações.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
          >
            Desativar
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-sable text-terre text-sm font-light tracking-wide"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { t } = useI18n();
  const utils = trpc.useUtils();

  // Filters
  const [search, setSearch] = useState("");
  const [concernFilter, setConcernFilter] = useState("");
  const [stepFilter, setStepFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Deactivate confirmation
  const [pendingDeactivate, setPendingDeactivate] = useState<Product | null>(null);

  const listQuery = trpc.product.list.useQuery({
    search: search || undefined,
    concernTag: concernFilter || undefined,
    step: stepFilter || undefined,
    activeOnly: !showInactive,
    page,
    pageSize: 20,
  });

  const exportQuery = trpc.product.exportList.useQuery(
    {
      search: search || undefined,
      concernTag: concernFilter || undefined,
      step: stepFilter || undefined,
      activeOnly: !showInactive,
    },
    { enabled: false }
  );

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
  const bulkDeactivate = trpc.product.bulkDeactivate.useMutation({
    onSuccess: () => {
      setSelectedIds(new Set());
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
    },
  });
  const bulkReactivate = trpc.product.bulkReactivate.useMutation({
    onSuccess: () => {
      setSelectedIds(new Set());
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
    },
  });

  const allProducts = listQuery.data?.items ?? [];

  // Client-side type filter (additive on top of server filters)
  const products = typeFilter
    ? allProducts.filter((p) => {
        const pType = (p as Product).type ?? "product";
        if (typeFilter === "produto") return pType === "product" || !pType;
        if (typeFilter === "servico") return pType === "service";
        return true;
      })
    : allProducts;

  const pageCount = listQuery.data?.pageCount ?? 1;
  const total = listQuery.data?.total ?? 0;

  // --- Selection helpers ---
  const allCurrentSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allCurrentSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        products.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        products.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Filter change resets page ---
  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handleConcernChange(v: string) {
    setConcernFilter(v);
    setPage(1);
  }
  function handleStepChange(v: string) {
    setStepFilter(v);
    setPage(1);
  }
  function handleTypeChange(v: string) {
    setTypeFilter(v);
    setPage(1);
  }
  function handleShowInactiveChange(v: boolean) {
    setShowInactive(v);
    setPage(1);
  }

  // --- CSV Export ---
  async function handleExportCSV() {
    const result = await exportQuery.refetch();
    const data = result.data ?? [];

    const rows = [
      buildCSVRow(CSV_HEADERS),
      ...data.map((p) =>
        buildCSVRow([
          p.sku,
          p.name,
          p.description ?? "",
          p.price != null ? String(p.price) : "",
          p.ecommerceLink ?? "",
          parseTags(p.activeIngredients ?? "[]").join(";"),
          parseTags(p.concernTags).join(";"),
          parseTags(p.skinTypeTags).join(";"),
          parseTags(p.objectiveTags).join(";"),
          String(p.severityLevel),
          p.stepRoutine ?? "",
          p.useTime,
          parseTags(p.contraindications ?? "[]").join(";"),
          p.isActive ? "sim" : "não",
        ])
      ),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalogo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Deactivate confirmation flow ---
  function requestDeactivate(product: Product) {
    setPendingDeactivate(product);
  }

  function confirmDeactivate() {
    if (!pendingDeactivate) return;
    deleteMutation.mutate({ id: pendingDeactivate.id });
    setPendingDeactivate(null);
  }

  return (
    <div className="p-4 md:p-8">
      {/* Confirmation dialog */}
      {pendingDeactivate && (
        <ConfirmDialog
          productName={pendingDeactivate.name}
          onConfirm={confirmDeactivate}
          onCancel={() => setPendingDeactivate(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl md:text-2xl text-carbone">{t.dashboardPages.cat_title}</h1>
          <p className="text-sm text-pierre font-light mt-1">
            {stats.data
              ? t.dashboardPages.cat_summary
                  .replace("{active}", String(stats.data.active))
                  .replace("{total}", String(stats.data.total))
              : t.dashboardPages.common_loading}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exportQuery.isFetching}
            className="px-4 py-2 border border-sable text-terre text-sm font-light tracking-wide disabled:opacity-50 min-h-[44px] md:min-h-0"
          >
            {exportQuery.isFetching ? t.dashboardPages.common_exporting : t.dashboardPages.common_export_csv}
          </button>
          <Link
            href="/dashboard/catalogo/importar"
            className="px-4 py-2 border border-sable text-terre text-sm font-light tracking-wide min-h-[44px] md:min-h-0 flex items-center"
          >
            {t.dashboardPages.cat_import_csv}
          </Link>
          <Link
            href="/dashboard/catalogo/novo"
            className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide min-h-[44px] md:min-h-0 flex items-center"
          >
            {t.dashboardPages.cat_new_product}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t.dashboardPages.cat_search_placeholder}
          className="px-3 py-2 border border-sable/40 text-sm text-carbone font-light w-full md:w-64 focus:outline-none focus:border-pierre bg-blanc-casse"
        />
        <select
          value={concernFilter}
          onChange={(e) => handleConcernChange(e.target.value)}
          className="px-3 py-2 border border-sable/40 text-sm text-carbone font-light focus:outline-none focus:border-pierre bg-blanc-casse"
        >
          <option value="">{t.dashboardPages.cat_filter_all_concerns}</option>
          {tags.data?.concerns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={stepFilter}
          onChange={(e) => handleStepChange(e.target.value)}
          className="px-3 py-2 border border-sable/40 text-sm text-carbone font-light focus:outline-none focus:border-pierre bg-blanc-casse"
        >
          <option value="">{t.dashboardPages.cat_filter_all_steps}</option>
          {tags.data?.steps.map((s) => (
            <option key={s} value={s}>
              {stepLabels[s] ?? s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="px-3 py-2 border border-sable/40 text-sm text-carbone font-light focus:outline-none focus:border-pierre bg-blanc-casse"
        >
          <option value="">{t.dashboardPages.cat_filter_all_types}</option>
          <option value="produto">{t.dashboardPages.cat_filter_products}</option>
          <option value="servico">{t.dashboardPages.cat_filter_services}</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-pierre font-light">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => handleShowInactiveChange(e.target.checked)}
          />
          {t.dashboardPages.cat_show_inactive}
        </label>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 p-3 border border-sable/30 bg-ivoire">
          <span className="text-sm text-pierre font-light">
            {(selectedIds.size === 1 ? t.dashboardPages.cat_selected_count_one : t.dashboardPages.cat_selected_count_many).replace("{n}", String(selectedIds.size))}
          </span>
          <button
            onClick={() => bulkDeactivate.mutate({ ids: Array.from(selectedIds) })}
            disabled={bulkDeactivate.isPending}
            className="px-4 py-1.5 border border-sable text-terre text-sm font-light tracking-wide disabled:opacity-50"
          >
            {bulkDeactivate.isPending ? t.dashboardPages.cat_bulk_deactivating : t.dashboardPages.cat_bulk_deactivate}
          </button>
          <button
            onClick={() => bulkReactivate.mutate({ ids: Array.from(selectedIds) })}
            disabled={bulkReactivate.isPending}
            className="px-4 py-1.5 border border-sable text-terre text-sm font-light tracking-wide disabled:opacity-50"
          >
            {bulkReactivate.isPending ? t.dashboardPages.cat_bulk_reactivating : t.dashboardPages.cat_bulk_reactivate}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-pierre font-light underline"
          >
            {t.dashboardPages.cat_clear_selection}
          </button>
        </div>
      )}

      {/* Product list */}
      <div className="mt-6">
        {listQuery.isLoading && (
          <p className="text-sm text-pierre font-light">{t.dashboardPages.common_loading}</p>
        )}

        {!listQuery.isLoading && products.length === 0 && (
          <div className="text-center py-12 border border-sable/20 bg-blanc-casse">
            <p className="text-sm text-pierre font-light">{t.dashboardPages.cat_empty}</p>
            <Link
              href="/dashboard/catalogo/novo"
              className="text-sm text-terre font-light underline mt-2 inline-block"
            >
              {t.dashboardPages.cat_add_first}
            </Link>
          </div>
        )}

        {products.length > 0 && (
          <div className="border border-sable/20 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-sable/20 bg-ivoire">
                  <th className="px-4 py-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      title="Selecionar todos"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.cat_th_item}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.cat_th_sku}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.cat_th_type_step}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.cat_th_concerns}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.cat_th_intensity}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.cat_th_price}
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {t.dashboardPages.common_actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sable/10">
                {products.map((product) => {
                  const p = product as Product;
                  const isService = p.type === "service";
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-ivoire/60 transition-colors ${
                        !p.isActive ? "opacity-40" : ""
                      } ${selectedIds.has(p.id) ? "bg-ivoire" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="w-10 h-10 object-cover border border-sable/20"
                            />
                          ) : (
                            <div className="w-10 h-10 border border-sable/20 bg-ivoire flex items-center justify-center text-[10px] text-pierre tracking-wider uppercase">
                              {isService ? "SVC" : "IMG"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-carbone font-light">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-pierre font-light truncate max-w-xs">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-pierre font-light font-mono">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 w-fit uppercase tracking-wider font-light border ${
                              isService
                                ? "border-terre/40 text-terre bg-ivoire"
                                : "border-sable/30 text-pierre"
                            }`}
                          >
                            {isService ? t.dashboardPages.cat_label_service : t.dashboardPages.cat_label_product}
                          </span>
                          {isService ? (
                            p.sessionCount || p.sessionFrequency ? (
                              <span className="text-xs text-pierre font-light">
                                {p.sessionCount ? `${p.sessionCount}x` : ""}
                                {p.sessionCount && p.sessionFrequency ? " " : ""}
                                {p.sessionFrequency ? sessionFrequencyLabels[p.sessionFrequency] ?? p.sessionFrequency : ""}
                                {p.durationMinutes ? ` · ${p.durationMinutes}min` : ""}
                              </span>
                            ) : null
                          ) : (
                            p.stepRoutine ? (
                              <span className="text-xs text-pierre font-light">
                                {stepLabels[p.stepRoutine] ?? p.stepRoutine}
                              </span>
                            ) : null
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {parseTags(p.concernTags).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 border border-sable/30 text-pierre uppercase tracking-wider font-light"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-pierre font-light">
                          {p.severityLevel === 1
                            ? t.dashboardPages.cat_intensity_light
                            : p.severityLevel === 2
                            ? t.dashboardPages.cat_intensity_moderate
                            : t.dashboardPages.cat_intensity_intense}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-pierre font-light">
                        {p.price != null ? `R$ ${p.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <Link
                          href={`/dashboard/catalogo/novo?edit=${p.id}`}
                          className="text-xs text-pierre font-light underline hover:text-terre"
                        >
                          {t.dashboardPages.common_edit}
                        </Link>
                        {p.isActive ? (
                          <button
                            onClick={() => requestDeactivate(p)}
                            className="text-xs text-pierre font-light underline hover:text-terre"
                          >
                            {t.dashboardPages.cat_deactivate}
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreMutation.mutate({ id: p.id })}
                            className="text-xs text-pierre font-light underline hover:text-terre"
                          >
                            {t.dashboardPages.cat_reactivate}
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

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-pierre font-light">
              {t.dashboardPages.cat_pagination.replace("{page}", String(page)).replace("{pageCount}", String(pageCount)).replace("{total}", String(total))}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 border border-sable text-terre text-sm font-light tracking-wide disabled:opacity-30"
              >
                {t.dashboardPages.common_previous}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="px-4 py-1.5 border border-sable text-terre text-sm font-light tracking-wide disabled:opacity-30"
              >
                {t.dashboardPages.common_next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tag coverage */}
      {stats.data && Object.keys(stats.data.tagCounts).length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-lg text-carbone mb-3">{t.dashboardPages.cat_coverage_title}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.data.tagCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, count]) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 border border-sable/30 text-pierre font-light uppercase tracking-wider"
                >
                  {tag}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
