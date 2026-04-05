"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const concernOptions = [
  "acne", "hyperpigmentation", "aging", "dehydration",
  "sensitivity", "rosacea", "dark_circles", "pores", "oiliness", "dullness",
];
const skinTypeOptions = ["oily", "dry", "combination", "normal", "sensitive"];
const objectiveOptions = [
  "anti-aging", "anti-acne", "radiance", "hydration",
  "sensitivity", "firmness", "pore-control", "even-tone",
];
const stepOptions = [
  { value: "cleanser", label: "Limpeza" },
  { value: "toner", label: "Tônico" },
  { value: "serum", label: "Sérum" },
  { value: "moisturizer", label: "Hidratante" },
  { value: "SPF", label: "Protetor Solar" },
  { value: "treatment", label: "Tratamento" },
  { value: "mask", label: "Máscara" },
  { value: "exfoliant", label: "Esfoliante" },
  { value: "eye-cream", label: "Área dos olhos" },
];

function TagSelector({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((t) => t !== opt) : [...selected, opt])
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const existingProduct = trpc.product.getById.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  const utils = trpc.useUtils();
  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
      router.push("/dashboard/catalogo");
    },
  });
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      router.push("/dashboard/catalogo");
    },
  });

  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    ecommerceLink: "",
    activeIngredients: "",
    concernTags: [] as string[],
    skinTypeTags: [] as string[],
    objectiveTags: [] as string[],
    severityLevel: 1,
    stepRoutine: "",
    useTime: "both" as "am" | "pm" | "both",
    contraindications: "",
  });

  useEffect(() => {
    if (existingProduct.data) {
      const p = existingProduct.data;
      setForm({
        sku: p.sku,
        name: p.name,
        description: p.description ?? "",
        imageUrl: p.imageUrl ?? "",
        price: p.price?.toString() ?? "",
        ecommerceLink: p.ecommerceLink ?? "",
        activeIngredients: safeParseArray(p.activeIngredients).join(", "),
        concernTags: safeParseArray(p.concernTags),
        skinTypeTags: safeParseArray(p.skinTypeTags),
        objectiveTags: safeParseArray(p.objectiveTags),
        severityLevel: p.severityLevel,
        stepRoutine: p.stepRoutine ?? "",
        useTime: (p.useTime as "am" | "pm" | "both") ?? "both",
        contraindications: safeParseArray(p.contraindications).join(", "),
      });
    }
  }, [existingProduct.data]);

  function safeParseArray(json: string | null | undefined): string[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  function textToJsonArray(text: string): string {
    if (!text.trim()) return "[]";
    return JSON.stringify(text.split(",").map((s) => s.trim()).filter(Boolean));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      sku: form.sku,
      name: form.name,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      ecommerceLink: form.ecommerceLink || undefined,
      activeIngredients: textToJsonArray(form.activeIngredients),
      concernTags: JSON.stringify(form.concernTags),
      skinTypeTags: JSON.stringify(form.skinTypeTags),
      objectiveTags: JSON.stringify(form.objectiveTags),
      severityLevel: form.severityLevel,
      stepRoutine: form.stepRoutine || undefined,
      useTime: form.useTime,
      contraindications: textToJsonArray(form.contraindications),
    };

    if (editId) {
      updateMutation.mutate({ id: editId, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {editId ? "Editar Produto" : "Novo Produto"}
      </h1>
      <p className="text-gray-500 mt-1">
        {editId ? "Atualize as informações do produto." : "Adicione um produto ao seu catálogo."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              required
              disabled={!!editId}
              placeholder="CLN-001"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Gel de Limpeza Suave"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Descreva o produto..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="89.90"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL da Imagem</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link e-commerce</label>
            <input
              value={form.ecommerceLink}
              onChange={(e) => setForm((f) => ({ ...f, ecommerceLink: e.target.value }))}
              placeholder="https://loja.com/produto"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Tags */}
        <TagSelector
          label="Condições que trata *"
          options={concernOptions}
          selected={form.concernTags}
          onChange={(tags) => setForm((f) => ({ ...f, concernTags: tags }))}
        />

        <TagSelector
          label="Tipos de pele compatíveis *"
          options={skinTypeOptions}
          selected={form.skinTypeTags}
          onChange={(tags) => setForm((f) => ({ ...f, skinTypeTags: tags }))}
        />

        <TagSelector
          label="Objetivos *"
          options={objectiveOptions}
          selected={form.objectiveTags}
          onChange={(tags) => setForm((f) => ({ ...f, objectiveTags: tags }))}
        />

        {/* Classification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Etapa da rotina</label>
            <select
              value={form.stepRoutine}
              onChange={(e) => setForm((f) => ({ ...f, stepRoutine: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Selecione...</option>
              {stepOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Intensidade</label>
            <select
              value={form.severityLevel}
              onChange={(e) => setForm((f) => ({ ...f, severityLevel: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={1}>Leve (Tier 1)</option>
              <option value={2}>Moderado (Tier 2)</option>
              <option value={3}>Intenso (Tier 3)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Uso</label>
            <select
              value={form.useTime}
              onChange={(e) => setForm((f) => ({ ...f, useTime: e.target.value as "am" | "pm" | "both" }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="am">Manhã</option>
              <option value="pm">Noite</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ingredientes ativos</label>
          <input
            value={form.activeIngredients}
            onChange={(e) => setForm((f) => ({ ...f, activeIngredients: e.target.value }))}
            placeholder="Ácido Salicílico 0.5%, Niacinamida 2%"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">Separe com vírgula.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraindicações</label>
          <input
            value={form.contraindications}
            onChange={(e) => setForm((f) => ({ ...f, contraindications: e.target.value }))}
            placeholder="gravidez, amamentação"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">Separe com vírgula.</p>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Salvando..." : editId ? "Atualizar" : "Criar Produto"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/catalogo")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          {error && <p className="text-sm text-red-600">{error.message}</p>}
        </div>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense>
      <ProductForm />
    </Suspense>
  );
}
