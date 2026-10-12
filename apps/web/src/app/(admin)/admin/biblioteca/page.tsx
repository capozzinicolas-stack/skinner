"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { serviceCategoryLabels } from "@/lib/sae/labels";

// Admin editor for the global procedure library (Oct-2026). Clinics import
// these items into their own catalog; editing here never changes copies that
// were already imported.

type Category = "injectables" | "technologies" | "skin";

type FormState = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  category: Category;
  concernTags: string;
  skinTypeTags: string;
  objectiveTags: string;
  severityLevel: number;
  activeIngredients: string;
  contraindications: string;
  sessionCount: string;
  sessionFrequency: string;
  durationMinutes: string;
  suggestedPrice: string;
  projectionOnsetWeeks: string;
  projectionPeakWeeks: string;
  projectionImprovementPct: string;
  addOns: string;
  displayOrder: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  slug: "",
  name: "",
  description: "",
  category: "injectables",
  concernTags: "",
  skinTypeTags: "oily, dry, combination, normal, sensitive",
  objectiveTags: "",
  severityLevel: 2,
  activeIngredients: "",
  contraindications: "gravidez, amamentação",
  sessionCount: "",
  sessionFrequency: "",
  durationMinutes: "",
  suggestedPrice: "",
  projectionOnsetWeeks: "",
  projectionPeakWeeks: "",
  projectionImprovementPct: "",
  addOns: "[]",
  displayOrder: "0",
  isActive: true,
};

function parseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function csv(list: string): string[] {
  return list.split(",").map((s) => s.trim()).filter(Boolean);
}

function intOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export default function AdminLibraryPage() {
  const utils = trpc.useUtils();
  const list = trpc.admin.libraryList.useQuery();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upsert = trpc.admin.libraryUpsert.useMutation({
    onSuccess: () => {
      utils.admin.libraryList.invalidate();
      setForm(null);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  function edit(item: NonNullable<typeof list.data>[number]) {
    setError(null);
    setForm({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      category: item.category as Category,
      concernTags: parseArray(item.concernTags).join(", "),
      skinTypeTags: parseArray(item.skinTypeTags).join(", "),
      objectiveTags: parseArray(item.objectiveTags).join(", "),
      severityLevel: item.severityLevel,
      activeIngredients: parseArray(item.activeIngredients).join(", "),
      contraindications: parseArray(item.contraindications).join(", "),
      sessionCount: item.sessionCount?.toString() ?? "",
      sessionFrequency: item.sessionFrequency ?? "",
      durationMinutes: item.durationMinutes?.toString() ?? "",
      suggestedPrice: item.suggestedPrice?.toString() ?? "",
      projectionOnsetWeeks: item.projectionOnsetWeeks?.toString() ?? "",
      projectionPeakWeeks: item.projectionPeakWeeks?.toString() ?? "",
      projectionImprovementPct: item.projectionImprovementPct?.toString() ?? "",
      addOns: item.addOns ?? "[]",
      displayOrder: item.displayOrder.toString(),
      isActive: item.isActive,
    });
  }

  function save() {
    if (!form) return;
    let addOns: { name: string; description?: string; price?: number }[] = [];
    try {
      const parsed = JSON.parse(form.addOns || "[]");
      if (!Array.isArray(parsed)) throw new Error();
      addOns = parsed;
    } catch {
      setError("Complementos: JSON inválido. Use o formato [{\"name\": \"...\", \"price\": 80}].");
      return;
    }
    upsert.mutate({
      id: form.id,
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      concernTags: csv(form.concernTags),
      skinTypeTags: csv(form.skinTypeTags),
      objectiveTags: csv(form.objectiveTags),
      severityLevel: form.severityLevel,
      activeIngredients: csv(form.activeIngredients),
      contraindications: csv(form.contraindications),
      sessionCount: intOrNull(form.sessionCount),
      sessionFrequency: form.sessionFrequency.trim() || null,
      durationMinutes: intOrNull(form.durationMinutes),
      suggestedPrice: form.suggestedPrice.trim() ? parseFloat(form.suggestedPrice) : null,
      projectionOnsetWeeks: intOrNull(form.projectionOnsetWeeks),
      projectionPeakWeeks: intOrNull(form.projectionPeakWeeks),
      projectionImprovementPct: intOrNull(form.projectionImprovementPct),
      addOns,
      displayOrder: intOrNull(form.displayOrder) ?? 0,
      isActive: form.isActive,
    });
  }

  const inputClass =
    "w-full px-3 py-2 border border-sable/40 text-sm text-carbone font-light focus:outline-none focus:border-pierre bg-blanc-casse";
  const labelClass = "block text-[10px] text-pierre uppercase tracking-wider font-light mb-1";

  function field(key: keyof FormState, label: string, opts?: { type?: string; placeholder?: string }) {
    if (!form) return null;
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <input
          type={opts?.type ?? "text"}
          value={String(form[key] ?? "")}
          placeholder={opts?.placeholder}
          onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-sable/20 pb-6 mb-6">
        <div>
          <h1 className="font-serif text-xl md:text-2xl text-carbone">Biblioteca de procedimentos</h1>
          <p className="text-sm text-pierre font-light mt-1 max-w-2xl">
            Procedimentos que as clínicas podem adicionar ao catálogo com um clique. Alterações aqui
            valem para novas importações; cópias já importadas pelas clínicas não mudam.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setForm({ ...EMPTY });
          }}
          className="px-5 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
        >
          Novo procedimento
        </button>
      </div>

      {form && (
        <div className="mb-8 p-5 bg-white border border-sable/20 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("name", "Nome")}
            {field("slug", "Identificador (slug)", { placeholder: "toxina-botulinica" })}
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => (f ? { ...f, category: e.target.value as Category } : f))}
                className={inputClass}
              >
                {(["injectables", "technologies", "skin"] as const).map((c) => (
                  <option key={c} value={c}>
                    {serviceCategoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Descrição (vista pelo paciente)</label>
            <textarea
              value={form.description}
              rows={2}
              onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("concernTags", "Condições (IDs, vírgula)", { placeholder: "aging, sagging" })}
            {field("objectiveTags", "Objetivos (IDs, vírgula)", { placeholder: "anti-aging, sagging" })}
            {field("skinTypeTags", "Tipos de pele (IDs, vírgula)")}
          </div>
          <p className="text-[10px] text-pierre font-light">
            Condições: acne, hyperpigmentation, aging, dehydration, sensitivity, rosacea, pores, dullness,
            dark_circles, oiliness, sagging, acne_scars, texture. Objetivos: anti-aging, anti-acne, radiance,
            hydration, sensitivity, even-tone, sagging, texture, prevention.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("activeIngredients", "Tecnologias / ativos (vírgula)")}
            {field("contraindications", "Contraindicações (vírgula)")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {field("suggestedPrice", "Preço sugerido (R$)", { type: "number" })}
            {field("sessionCount", "Sessões", { type: "number" })}
            {field("sessionFrequency", "Frequência")}
            {field("durationMinutes", "Duração (min)", { type: "number" })}
            <div>
              <label className={labelClass}>Intensidade</label>
              <select
                value={form.severityLevel}
                onChange={(e) => setForm((f) => (f ? { ...f, severityLevel: parseInt(e.target.value) } : f))}
                className={inputClass}
              >
                <option value={1}>Leve</option>
                <option value={2}>Moderado</option>
                <option value={3}>Intenso</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {field("projectionOnsetWeeks", "Início do efeito (semanas)", { type: "number" })}
            {field("projectionPeakWeeks", "Resultado máximo (semanas)", { type: "number" })}
            {field("projectionImprovementPct", "Melhora esperada (%)", { type: "number" })}
            {field("displayOrder", "Ordem", { type: "number" })}
          </div>
          <div>
            <label className={labelClass}>Complementos (JSON)</label>
            <textarea
              value={form.addOns}
              rows={2}
              onChange={(e) => setForm((f) => (f ? { ...f, addOns: e.target.value } : f))}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-pierre font-light">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => (f ? { ...f, isActive: e.target.checked } : f))}
              className="accent-carbone"
            />
            Disponível para as clínicas
          </label>
          <div className="flex items-center gap-3 pt-2 border-t border-sable/20">
            <button
              onClick={save}
              disabled={upsert.isPending}
              className="px-5 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {upsert.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={() => setForm(null)}
              className="px-5 py-2 border border-sable text-terre text-sm font-light tracking-wide"
            >
              Cancelar
            </button>
            {error && <p className="text-sm text-terre font-light">{error}</p>}
          </div>
        </div>
      )}

      {list.isLoading && <p className="text-sm text-pierre font-light">Carregando...</p>}

      {list.data && (
        <div className="border border-sable/20 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                {["Procedimento", "Categoria", "Preço", "Resultado", "Situação", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/10">
              {list.data.map((item) => (
                <tr key={item.id} className={item.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <p className="text-sm text-carbone font-light">{item.name}</p>
                    <p className="text-[11px] text-pierre font-light font-mono">{item.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-pierre font-light">
                    {serviceCategoryLabels[item.category] ?? item.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-pierre font-light">
                    {item.suggestedPrice != null
                      ? `R$ ${item.suggestedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-pierre font-light">
                    {item.projectionImprovementPct != null
                      ? `${item.projectionImprovementPct}% em ${item.projectionPeakWeeks ?? "?"} sem.`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-pierre font-light">
                    {item.isActive ? "Disponível" : "Oculto"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => edit(item)}
                      className="text-xs text-pierre font-light underline hover:text-terre"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
