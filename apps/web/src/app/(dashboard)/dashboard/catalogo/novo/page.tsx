"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ImageUpload } from "@/components/shared/image-upload";

// Static fallbacks — used only when tagOptions returns no data from DB
const fallbackConcernOptions = [
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

// Prefix used to encode category/line in the description field
const META_PREFIX_RE = /^\[Category: (.*?) \| Line: (.*?)\] ?/;

function encodeDescription(
  category: string,
  productLine: string,
  description: string
): string {
  const base = description.replace(META_PREFIX_RE, "");
  if (!category && !productLine) return base;
  return `[Category: ${category} | Line: ${productLine}] ${base}`;
}

function decodeDescription(raw: string | null | undefined): {
  category: string;
  productLine: string;
  description: string;
} {
  if (!raw) return { category: "", productLine: "", description: "" };
  const match = raw.match(META_PREFIX_RE);
  if (!match) return { category: "", productLine: "", description: raw };
  return {
    category: match[1] ?? "",
    productLine: match[2] ?? "",
    description: raw.replace(META_PREFIX_RE, ""),
  };
}

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
      <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
        {label}
      </label>
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
              className={`text-xs px-3 py-1.5 border transition-colors font-light ${
                active
                  ? "bg-carbone text-blanc-casse border-carbone"
                  : "bg-blanc-casse text-pierre border-sable/40 hover:border-pierre"
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

  const tagOptions = trpc.product.tagOptions.useQuery();
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
    category: "",
    productLine: "",
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

  // Controls whether the manual URL text input is shown alongside the uploader
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (existingProduct.data) {
      const p = existingProduct.data;
      const { category, productLine, description } = decodeDescription(p.description);
      setForm({
        sku: p.sku,
        name: p.name,
        category,
        productLine,
        description,
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
      // If an existing product has an external URL (not a local upload path),
      // default to showing the manual URL input in edit mode.
      if (p.imageUrl && !p.imageUrl.startsWith("/uploads/")) {
        setShowUrlInput(true);
      }
    }
  }, [existingProduct.data]);

  function safeParseArray(json: string | null | undefined): string[] {
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  function textToJsonArray(text: string): string {
    if (!text.trim()) return "[]";
    return JSON.stringify(
      text.split(",").map((s) => s.trim()).filter(Boolean)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullDescription =
      encodeDescription(form.category, form.productLine, form.description) || undefined;

    const data = {
      sku: form.sku,
      name: form.name,
      description: fullDescription,
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

  // Resolve options: prefer DB data, fall back to static constants
  const concernOptions =
    tagOptions.data?.concerns && tagOptions.data.concerns.length > 0
      ? tagOptions.data.concerns
      : fallbackConcernOptions;

  const resolvedSkinTypes = tagOptions.data?.skinTypes ?? skinTypeOptions;
  const resolvedObjectives = tagOptions.data?.objectives ?? objectiveOptions;
  const resolvedSteps =
    tagOptions.data?.steps && tagOptions.data.steps.length > 0
      ? tagOptions.data.steps.map((v) => ({
          value: v,
          label: stepOptions.find((s) => s.value === v)?.label ?? v,
        }))
      : stepOptions;

  const inputClass =
    "w-full px-3 py-2 border border-sable/40 text-sm text-carbone font-light focus:outline-none focus:border-pierre bg-blanc-casse";
  const labelClass = "block text-[10px] text-pierre uppercase tracking-wider font-light mb-1";

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-serif text-2xl text-carbone">
        {editId ? "Editar Produto" : "Novo Produto"}
      </h1>
      <p className="text-sm text-pierre font-light mt-1">
        {editId
          ? "Atualize as informações do produto."
          : "Adicione um produto ao seu catálogo."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>SKU *</label>
            <input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              required
              disabled={!!editId}
              placeholder="CLN-001"
              className={`${inputClass} disabled:bg-ivoire disabled:text-pierre`}
            />
          </div>
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Gel de Limpeza Suave"
              className={inputClass}
            />
          </div>
        </div>

        {/* Category and product line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Categoria</label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Ex: Limpeza Facial"
              className={inputClass}
            />
            <p className="text-[10px] text-pierre font-light mt-1 tracking-wide">
              Campo provisório — será migrado para campo próprio.
            </p>
          </div>
          <div>
            <label className={labelClass}>Linha do Produto</label>
            <input
              value={form.productLine}
              onChange={(e) => setForm((f) => ({ ...f, productLine: e.target.value }))}
              placeholder="Ex: Linha Acne Control"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Descreva o produto..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="89.90"
              className={inputClass}
            />
          </div>

          {/* Image — occupies 2 columns on md+ */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>Imagem do Produto</label>
              <button
                type="button"
                onClick={() => setShowUrlInput((v) => !v)}
                className="text-[10px] text-pierre uppercase tracking-wider font-light hover:text-carbone transition-colors"
              >
                {showUrlInput ? "Usar upload" : "Ou inserir URL"}
              </button>
            </div>

            {showUrlInput ? (
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className={inputClass}
              />
            ) : (
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Link e-commerce</label>
          <input
            value={form.ecommerceLink}
            onChange={(e) => setForm((f) => ({ ...f, ecommerceLink: e.target.value }))}
            placeholder="https://loja.com/produto"
            className={inputClass}
          />
        </div>

        {/* Tags — from DB or fallback */}
        <TagSelector
          label="Condições que trata *"
          options={concernOptions}
          selected={form.concernTags}
          onChange={(tags) => setForm((f) => ({ ...f, concernTags: tags }))}
        />

        <TagSelector
          label="Tipos de pele compatíveis *"
          options={resolvedSkinTypes}
          selected={form.skinTypeTags}
          onChange={(tags) => setForm((f) => ({ ...f, skinTypeTags: tags }))}
        />

        <TagSelector
          label="Objetivos *"
          options={resolvedObjectives}
          selected={form.objectiveTags}
          onChange={(tags) => setForm((f) => ({ ...f, objectiveTags: tags }))}
        />

        {/* Classification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Etapa da rotina</label>
            <select
              value={form.stepRoutine}
              onChange={(e) => setForm((f) => ({ ...f, stepRoutine: e.target.value }))}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              {resolvedSteps.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Intensidade</label>
            <select
              value={form.severityLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, severityLevel: parseInt(e.target.value) }))
              }
              className={inputClass}
            >
              <option value={1}>Leve (Tier 1)</option>
              <option value={2}>Moderado (Tier 2)</option>
              <option value={3}>Intenso (Tier 3)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Uso</label>
            <select
              value={form.useTime}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  useTime: e.target.value as "am" | "pm" | "both",
                }))
              }
              className={inputClass}
            >
              <option value="am">Manhã</option>
              <option value="pm">Noite</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Ingredientes ativos</label>
          <input
            value={form.activeIngredients}
            onChange={(e) =>
              setForm((f) => ({ ...f, activeIngredients: e.target.value }))
            }
            placeholder="Ácido Salicílico 0.5%, Niacinamida 2%"
            className={inputClass}
          />
          <p className="text-[10px] text-pierre font-light mt-1">Separe com vírgula.</p>
        </div>

        <div>
          <label className={labelClass}>Contraindicações</label>
          <input
            value={form.contraindications}
            onChange={(e) =>
              setForm((f) => ({ ...f, contraindications: e.target.value }))
            }
            placeholder="gravidez, amamentação"
            className={inputClass}
          />
          <p className="text-[10px] text-pierre font-light mt-1">Separe com vírgula.</p>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-sable/20">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
          >
            {isLoading ? "Salvando..." : editId ? "Atualizar" : "Criar Produto"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/catalogo")}
            className="px-6 py-2 border border-sable text-terre text-sm font-light tracking-wide"
          >
            Cancelar
          </button>
          {error && <p className="text-sm text-red-700 font-light">{error.message}</p>}
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
