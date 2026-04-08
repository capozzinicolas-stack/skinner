"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const CONCERN_TAGS = [
  "acne",
  "hyperpigmentation",
  "aging",
  "dehydration",
  "sensitivity",
  "rosacea",
  "dark_circles",
  "pores",
  "oiliness",
  "dullness",
] as const;

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"] as const;

const conditionLabels: Record<string, string> = {
  acne: "Acne",
  hyperpigmentation: "Hiperpigmentacao",
  aging: "Envelhecimento",
  dehydration: "Desidratacao",
  sensitivity: "Sensibilidade",
  rosacea: "Rosácea",
  dark_circles: "Olheiras",
  pores: "Poros dilatados",
  oiliness: "Oleosidade",
  dullness: "Opacidade",
};

const skinTypeLabels: Record<string, string> = {
  oily: "Oleosa",
  dry: "Seca",
  combination: "Mista",
  normal: "Normal",
  sensitive: "Sensivel",
};

type KitItemDraft = {
  productId: string;
  productName: string;
  productPrice: number | null;
  rank: number;
  note: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NovoKitPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const productsQuery = trpc.product.list.useQuery({
    activeOnly: true,
    pageSize: 100,
  });

  const createKit = trpc.kit.create.useMutation({
    onSuccess: () => {
      utils.kit.list.invalidate();
      router.push("/dashboard/kits");
    },
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [targetConditions, setTargetConditions] = useState<string[]>([]);
  const [targetSkinTypes, setTargetSkinTypes] = useState<string[]>([]);
  const [items, setItems] = useState<KitItemDraft[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productNote, setProductNote] = useState("");

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual && name) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  function toggleCondition(tag: string) {
    setTargetConditions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleSkinType(type: string) {
    setTargetSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function addProduct() {
    if (!selectedProductId) return;
    if (items.some((i) => i.productId === selectedProductId)) return;

    const product = productsQuery.data?.items.find(
      (p) => p.id === selectedProductId
    );
    if (!product) return;

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productPrice: product.price ?? null,
        rank: prev.length + 1,
        note: productNote,
      },
    ]);
    setSelectedProductId("");
    setProductNote("");
  }

  function removeItem(productId: string) {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.productId !== productId);
      return filtered.map((item, idx) => ({ ...item, rank: idx + 1 }));
    });
  }

  function moveItem(index: number, direction: "up" | "down") {
    setItems((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, idx) => ({ ...item, rank: idx + 1 }));
    });
  }

  function updateItemNote(productId: string, note: string) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, note } : i))
    );
  }

  const totalPrice = items.reduce((sum, i) => sum + (i.productPrice ?? 0), 0);
  const discountVal = discount !== "" ? parseFloat(discount) : null;
  const discountedTotal =
    discountVal != null && !isNaN(discountVal) && totalPrice > 0
      ? totalPrice * (1 - discountVal / 100)
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    createKit.mutate({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      discount:
        discountVal != null && !isNaN(discountVal) ? discountVal : undefined,
      targetConditions: targetConditions.length > 0 ? targetConditions : undefined,
      targetSkinTypes: targetSkinTypes.length > 0 ? targetSkinTypes : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        rank: item.rank,
        note: item.note || undefined,
      })),
    });
  }

  const availableProducts =
    productsQuery.data?.items.filter(
      (p) => !items.some((i) => i.productId === p.id)
    ) ?? [];

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-pierre hover:text-carbone font-light underline"
        >
          Voltar
        </button>
        <span className="text-sable/40 font-light">/</span>
        <h1 className="font-serif text-2xl text-carbone">Novo kit manual</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <section>
          <h2 className="font-serif text-lg text-carbone mb-4">
            Informacoes basicas
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                Nome do kit
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Kit Anti-Acne Verao"
                required
                className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
              />
            </div>

            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="kit-anti-acne-verao"
                required
                pattern="[a-z0-9-]+"
                title="Apenas letras minusculas, numeros e hifens"
                className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
              />
              <p className="text-xs text-pierre font-light mt-1">
                Apenas letras minusculas, numeros e hifens. Sera usado na URL publica.
              </p>
            </div>

            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                Descricao (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao breve do kit e seus beneficios..."
                rows={3}
                className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
              />
            </div>

            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                Desconto (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-32 px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
                />
                <span className="text-sm text-pierre font-light">
                  % sobre o total dos produtos
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-sable/20" />

        {/* Target audience */}
        <section>
          <h2 className="font-serif text-lg text-carbone mb-1">
            Publico-alvo
          </h2>
          <p className="text-xs text-pierre font-light mb-4">
            Opcional. Indica para quais perfis este kit e mais adequado.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                Condicoes alvo
              </label>
              <div className="flex flex-wrap gap-2">
                {CONCERN_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleCondition(tag)}
                    className={`px-3 py-1.5 text-xs font-light transition-colors ${
                      targetConditions.includes(tag)
                        ? "bg-carbone text-blanc-casse"
                        : "bg-white border border-sable/40 text-pierre hover:border-carbone hover:text-carbone"
                    }`}
                  >
                    {conditionLabels[tag] ?? tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                Tipos de pele alvo
              </label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleSkinType(type)}
                    className={`px-3 py-1.5 text-xs font-light transition-colors ${
                      targetSkinTypes.includes(type)
                        ? "bg-carbone text-blanc-casse"
                        : "bg-white border border-sable/40 text-pierre hover:border-carbone hover:text-carbone"
                    }`}
                  >
                    {skinTypeLabels[type] ?? type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-sable/20" />

        {/* Products */}
        <section>
          <h2 className="font-serif text-lg text-carbone mb-1">Produtos do kit</h2>
          <p className="text-xs text-pierre font-light mb-4">
            Selecione os produtos do seu catalogo e defina a ordem de exibicao.
          </p>

          {/* Product selector */}
          <div className="flex gap-2 mb-4">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
            >
              <option value="">Selecionar produto...</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.price != null ? ` — R$ ${p.price.toFixed(2)}` : ""}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={productNote}
              onChange={(e) => setProductNote(e.target.value)}
              placeholder="Instrucao (opcional)"
              className="flex-1 px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
            />
            <button
              type="button"
              onClick={addProduct}
              disabled={!selectedProductId}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light hover:bg-terre disabled:opacity-40 transition-colors"
            >
              Adicionar
            </button>
          </div>

          {/* Items list */}
          {items.length === 0 && (
            <div className="py-8 text-center border border-dashed border-sable/30">
              <p className="text-xs text-pierre font-light">
                Nenhum produto adicionado ainda.
              </p>
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.productId}
                  className="p-4 bg-white border border-sable/20 flex items-start gap-3"
                >
                  {/* Rank controls */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="text-[10px] text-pierre hover:text-carbone disabled:opacity-30 leading-none"
                      aria-label="Mover para cima"
                    >
                      ▲
                    </button>
                    <span className="text-[10px] text-pierre font-light text-center leading-none">
                      {item.rank}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1}
                      className="text-[10px] text-pierre hover:text-carbone disabled:opacity-30 leading-none"
                      aria-label="Mover para baixo"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbone">{item.productName}</span>
                      <div className="flex items-center gap-3">
                        {item.productPrice != null && (
                          <span className="text-sm text-pierre font-light">
                            R$ {item.productPrice.toFixed(2)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-xs text-pierre hover:text-carbone font-light underline"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateItemNote(item.productId, e.target.value)}
                      placeholder="Instrucao de uso (opcional)..."
                      className="mt-2 w-full px-2 py-1 border border-sable/20 bg-blanc-casse text-xs text-pierre font-light focus:outline-none focus:border-carbone"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price summary */}
          {totalPrice > 0 && (
            <div className="mt-4 p-4 bg-ivoire border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
                Resumo de preco
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-pierre font-light">
                    Total dos produtos
                  </span>
                  <span
                    className={`text-xs text-carbone font-light ${
                      discountedTotal !== null ? "line-through text-pierre" : ""
                    }`}
                  >
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>
                {discountedTotal !== null && discountVal !== null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pierre font-light">
                        Desconto ({discountVal}%)
                      </span>
                      <span className="text-xs text-terre font-light">
                        - R$ {(totalPrice - discountedTotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-px bg-sable/20" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-carbone">Total com desconto</span>
                      <span className="text-sm text-carbone font-serif">
                        R$ {discountedTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-sable/20" />

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={createKit.isPending || !name.trim() || !slug.trim()}
            className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
          >
            {createKit.isPending ? "Criando..." : "Criar kit"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-sable text-terre text-sm font-light hover:border-carbone hover:text-carbone transition-colors"
          >
            Cancelar
          </button>
          {createKit.error && (
            <span className="text-sm text-red-600 font-light">
              {createKit.error.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
