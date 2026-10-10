"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ImageUpload } from "@/components/shared/image-upload";
import { encodeDescription, decodeDescription } from "@/lib/catalog/description";
import {
  conditionLabels,
  skinTypeLabels,
  objectiveLabels,
  serviceCategoryLabels,
} from "@/lib/sae/labels";

type AddOn = { name: string; description: string; price: string };

function capitalize(v: string): string {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
}

// Static fallbacks — used only when tagOptions returns no data from DB
const fallbackConcernOptions = [
  "acne", "hyperpigmentation", "aging", "dehydration",
  "sensitivity", "rosacea", "dark_circles", "pores", "oiliness", "dullness",
  "sagging", "acne_scars", "texture",
];
const skinTypeOptions = ["oily", "dry", "combination", "normal", "sensitive"];
const objectiveOptions = [
  "anti-aging", "anti-acne", "radiance", "hydration",
  "sensitivity", "firmness", "pore-control", "even-tone",
  "sagging", "texture", "prevention",
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

const sessionFrequencyOptions = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
];

function TagSelector({
  label,
  options,
  selected,
  onChange,
  labels,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  // Display names for the stored IDs (pt-BR). Unknown IDs show as-is.
  labels?: Record<string, string>;
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
              {capitalize(labels?.[opt] ?? opt)}
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
    type: "product" as "product" | "service",
    sku: "",
    name: "",
    category: "",
    productLine: "",
    brand: "",
    description: "",
    imageUrl: "",
    price: "",
    ecommerceLink: "",
    bookingLink: "",
    sessionCount: "",
    sessionFrequency: "",
    durationMinutes: "",
    serviceCategory: "" as "" | "injectables" | "technologies" | "skin",
    projectionOnsetWeeks: "",
    projectionPeakWeeks: "",
    projectionImprovementPct: "",
    addOns: [] as AddOn[],
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
      const { category, productLine, brand, description } = decodeDescription(p.description);
      setForm({
        type: ((p as { type?: string }).type === "service" ? "service" : "product") as "product" | "service",
        sku: p.sku,
        name: p.name,
        category,
        productLine,
        brand,
        description,
        imageUrl: p.imageUrl ?? "",
        price: p.price?.toString() ?? "",
        ecommerceLink: p.ecommerceLink ?? "",
        bookingLink: ((p as { bookingLink?: string | null }).bookingLink) ?? "",
        sessionCount: ((p as { sessionCount?: number | null }).sessionCount)?.toString() ?? "",
        sessionFrequency: p.sessionFrequency ?? "",
        durationMinutes: ((p as { durationMinutes?: number | null }).durationMinutes)?.toString() ?? "",
        serviceCategory: (p.serviceCategory ?? "") as "" | "injectables" | "technologies" | "skin",
        projectionOnsetWeeks: p.projectionOnsetWeeks?.toString() ?? "",
        projectionPeakWeeks: p.projectionPeakWeeks?.toString() ?? "",
        projectionImprovementPct: p.projectionImprovementPct?.toString() ?? "",
        addOns: parseAddOns(p.addOns),
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

  function parseAddOns(json: string | null | undefined): AddOn[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((a) => a && typeof a.name === "string")
        .map((a) => ({
          name: a.name,
          description: typeof a.description === "string" ? a.description : "",
          price: typeof a.price === "number" ? String(a.price) : "",
        }));
    } catch {
      return [];
    }
  }

  function intOrNull(v: string): number | null {
    if (v.trim() === "") return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }

  function textToJsonArray(text: string): string {
    if (!text.trim()) return "[]";
    return JSON.stringify(
      text.split(",").map((s) => s.trim()).filter(Boolean)
    );
  }

  const isService = form.type === "service";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullDescription =
      encodeDescription(form.category, form.productLine, form.brand, form.description) || undefined;

    const data = {
      sku: form.sku,
      name: form.name,
      description: fullDescription,
      // "" = user removed the image → send null so Prisma writes NULL to
      // the column. undefined would skip the field and the old value
      // would persist (existing bug before May-2026 fix).
      imageUrl: form.imageUrl === "" ? null : form.imageUrl,
      price: form.price ? parseFloat(form.price) : undefined,
      ecommerceLink: !isService ? (form.ecommerceLink || undefined) : undefined,
      type: form.type,
      bookingLink: isService ? (form.bookingLink || undefined) : undefined,
      sessionCount: isService && form.sessionCount ? parseInt(form.sessionCount) : undefined,
      sessionFrequency: isService && form.sessionFrequency ? form.sessionFrequency : undefined,
      durationMinutes: isService && form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
      serviceCategory: isService ? (form.serviceCategory || null) : null,
      projectionOnsetWeeks: isService ? intOrNull(form.projectionOnsetWeeks) : null,
      projectionPeakWeeks: isService ? intOrNull(form.projectionPeakWeeks) : null,
      projectionImprovementPct: isService ? intOrNull(form.projectionImprovementPct) : null,
      addOns: isService
        ? JSON.stringify(
            form.addOns
              .filter((a) => a.name.trim())
              .map((a) => ({
                name: a.name.trim(),
                ...(a.description.trim() ? { description: a.description.trim() } : {}),
                ...(a.price.trim() && !isNaN(parseFloat(a.price)) ? { price: parseFloat(a.price) } : {}),
              }))
          )
        : null,
      activeIngredients: textToJsonArray(form.activeIngredients),
      concernTags: JSON.stringify(form.concernTags),
      skinTypeTags: JSON.stringify(form.skinTypeTags),
      objectiveTags: JSON.stringify(form.objectiveTags),
      severityLevel: form.severityLevel,
      stepRoutine: !isService ? (form.stepRoutine || undefined) : undefined,
      useTime: !isService ? form.useTime : undefined,
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
        {editId
          ? isService ? "Editar Serviço" : "Editar Produto"
          : isService ? "Novo Serviço" : "Novo Produto"}
      </h1>
      <p className="text-sm text-pierre font-light mt-1">
        {editId
          ? isService ? "Atualize as informações do serviço." : "Atualize as informações do produto."
          : isService ? "Adicione um serviço ou tratamento ao seu catálogo." : "Adicione um produto ao seu catálogo."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">

        {/* Type selector */}
        <div>
          <label className={labelClass}>Tipo *</label>
          <div className="flex gap-0 border border-sable/40 w-fit">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "product" }))}
              className={`px-5 py-2 text-sm font-light tracking-wide transition-colors ${
                form.type === "product"
                  ? "bg-carbone text-blanc-casse"
                  : "bg-blanc-casse text-pierre hover:bg-ivoire"
              }`}
            >
              Produto
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "service" }))}
              className={`px-5 py-2 text-sm font-light tracking-wide transition-colors border-l border-sable/40 ${
                form.type === "service"
                  ? "bg-carbone text-blanc-casse"
                  : "bg-blanc-casse text-pierre hover:bg-ivoire"
              }`}
            >
              Serviço
            </button>
          </div>
        </div>

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
              placeholder={isService ? "Peeling Químico Superficial" : "Gel de Limpeza Suave"}
              className={inputClass}
            />
          </div>
        </div>

        {/* Brand, category and product line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Marca</label>
            <input
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              placeholder="Ex: La Roche-Posay"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Categoria</label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder={isService ? "Ex: Procedimento Estético" : "Ex: Limpeza Facial"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Linha do Produto</label>
            <input
              value={form.productLine}
              onChange={(e) => setForm((f) => ({ ...f, productLine: e.target.value }))}
              placeholder="Ex: Effaclar"
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
            placeholder={isService ? "Descreva o serviço ou tratamento..." : "Descreva o produto..."}
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
              <label className={labelClass}>Imagem {isService ? "do Serviço" : "do Produto"}</label>
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

        {/* Product-only fields */}
        {!isService && (
          <div>
            <label className={labelClass}>Link e-commerce</label>
            <input
              value={form.ecommerceLink}
              onChange={(e) => setForm((f) => ({ ...f, ecommerceLink: e.target.value }))}
              placeholder="https://loja.com/produto"
              className={inputClass}
            />
          </div>
        )}

        {/* Service-only fields */}
        {isService && (
          <div className="space-y-4 border-t border-sable/20 pt-6">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Informações do Serviço</p>

            <div>
              <label className={labelClass}>Link de agendamento</label>
              <input
                value={form.bookingLink}
                onChange={(e) => setForm((f) => ({ ...f, bookingLink: e.target.value }))}
                placeholder="https://agenda.com/tratamento"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Número de sessões recomendadas</label>
                <input
                  type="number"
                  min="1"
                  value={form.sessionCount}
                  onChange={(e) => setForm((f) => ({ ...f, sessionCount: e.target.value }))}
                  placeholder="6"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Frequência das sessões</label>
                <input
                  list="session-frequency-options"
                  value={form.sessionFrequency}
                  onChange={(e) => setForm((f) => ({ ...f, sessionFrequency: e.target.value }))}
                  placeholder="mensal, a cada 4-6 meses..."
                  maxLength={60}
                  className={inputClass}
                />
                <datalist id="session-frequency-options">
                  {sessionFrequencyOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>Duração por sessão (minutos)</label>
                <input
                  type="number"
                  min="1"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  placeholder="60"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Categoria do procedimento</label>
              <select
                value={form.serviceCategory}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    serviceCategory: e.target.value as "" | "injectables" | "technologies" | "skin",
                  }))
                }
                className={inputClass}
              >
                <option value="">Sem categoria</option>
                {(["injectables", "technologies", "skin"] as const).map((c) => (
                  <option key={c} value={c}>
                    {capitalize(serviceCategoryLabels[c])}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-pierre font-light mt-1">
                Clínicas de procedimentos recebem o melhor procedimento de cada categoria na recomendação.
              </p>
            </div>

            <div>
              <p className={labelClass}>Curva de resultado (usada na projeção da pele)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                <div>
                  <label className={labelClass}>Início do efeito (semanas)</label>
                  <input
                    type="number"
                    min="0"
                    max="104"
                    value={form.projectionOnsetWeeks}
                    onChange={(e) => setForm((f) => ({ ...f, projectionOnsetWeeks: e.target.value }))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Resultado máximo (semanas)</label>
                  <input
                    type="number"
                    min="0"
                    max="104"
                    value={form.projectionPeakWeeks}
                    onChange={(e) => setForm((f) => ({ ...f, projectionPeakWeeks: e.target.value }))}
                    placeholder="12"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Melhora visível esperada (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.projectionImprovementPct}
                    onChange={(e) => setForm((f) => ({ ...f, projectionImprovementPct: e.target.value }))}
                    placeholder="50"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className={labelClass}>Complementos opcionais</p>
              <p className="text-[10px] text-pierre font-light mb-2">
                Extras que tornam o procedimento mais confortável, rápido ou potente (anestésico, LED, drug delivery...). Aparecem para o paciente junto ao procedimento.
              </p>
              <div className="space-y-2">
                {form.addOns.map((a, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_110px_auto] gap-2">
                    <input
                      value={a.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addOns: f.addOns.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      placeholder="Nome"
                      className={inputClass}
                    />
                    <input
                      value={a.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addOns: f.addOns.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                        }))
                      }
                      placeholder="Benefício (opcional)"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={a.price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addOns: f.addOns.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)),
                        }))
                      }
                      placeholder="R$"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, addOns: f.addOns.filter((_, j) => j !== i) }))}
                      className="px-3 py-2 border border-sable/40 text-xs text-pierre font-light hover:bg-ivoire"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, addOns: [...f.addOns, { name: "", description: "", price: "" }] }))
                }
                className="mt-2 px-4 py-2 border border-sable/40 text-xs text-terre font-light tracking-wide hover:bg-ivoire"
              >
                Adicionar complemento
              </button>
            </div>
          </div>
        )}

        {/* Tags — from DB or fallback */}
        <TagSelector
          label="Condições que trata *"
          labels={conditionLabels}
          options={concernOptions}
          selected={form.concernTags}
          onChange={(tags) => setForm((f) => ({ ...f, concernTags: tags }))}
        />

        <TagSelector
          label="Tipos de pele compatíveis *"
          labels={skinTypeLabels}
          options={resolvedSkinTypes}
          selected={form.skinTypeTags}
          onChange={(tags) => setForm((f) => ({ ...f, skinTypeTags: tags }))}
        />

        <TagSelector
          label="Objetivos *"
          labels={objectiveLabels}
          options={resolvedObjectives}
          selected={form.objectiveTags}
          onChange={(tags) => setForm((f) => ({ ...f, objectiveTags: tags }))}
        />

        {/* Classification — stepRoutine and useTime only for products */}
        <div className={`grid gap-4 ${!isService ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-1"}`}>
          {!isService && (
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
          )}
          <div>
            <label className={labelClass}>Intensidade</label>
            <select
              value={form.severityLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, severityLevel: parseInt(e.target.value) }))
              }
              className={inputClass}
            >
              <option value={1}>Leve (nível 1)</option>
              <option value={2}>Moderado (nível 2)</option>
              <option value={3}>Intenso (nível 3)</option>
            </select>
          </div>
          {!isService && (
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
          )}
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
            {isLoading
              ? "Salvando..."
              : editId
              ? isService ? "Atualizar Serviço" : "Atualizar"
              : isService ? "Criar Serviço" : "Criar Produto"}
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
