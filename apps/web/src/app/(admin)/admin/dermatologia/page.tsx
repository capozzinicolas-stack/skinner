"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const categoryLabels: Record<string, string> = {
  inflammatory: "Inflamatória",
  pigmentation: "Pigmentação",
  aging: "Envelhecimento",
  barrier: "Barreira",
  sensitivity: "Sensibilidade",
};

export default function DermatologyPage() {
  const utils = trpc.useUtils();
  const conditions = trpc.dermatology.listConditions.useQuery();
  const ingredients = trpc.dermatology.listIngredients.useQuery();

  const createCondition = trpc.dermatology.createCondition.useMutation({
    onSuccess: () => {
      utils.dermatology.listConditions.invalidate();
      setShowConditionForm(false);
      resetConditionForm();
    },
  });
  const deleteCondition = trpc.dermatology.deleteCondition.useMutation({
    onSuccess: () => utils.dermatology.listConditions.invalidate(),
  });
  const createIngredient = trpc.dermatology.createIngredient.useMutation({
    onSuccess: () => {
      utils.dermatology.listIngredients.invalidate();
      setShowIngredientForm(false);
      resetIngredientForm();
    },
  });
  const deleteIngredient = trpc.dermatology.deleteIngredient.useMutation({
    onSuccess: () => utils.dermatology.listIngredients.invalidate(),
  });

  const [tab, setTab] = useState<"conditions" | "ingredients">("conditions");
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [showIngredientForm, setShowIngredientForm] = useState(false);

  const [conditionForm, setConditionForm] = useState({
    name: "", displayName: "", description: "", category: "inflammatory",
    commonIngredients: "", avoidIngredients: "",
    severity1Desc: "", severity2Desc: "", severity3Desc: "",
  });
  const [ingredientForm, setIngredientForm] = useState({
    name: "", displayName: "", description: "", category: "",
    treatsConditions: "", skinTypes: "", contraindications: "",
  });

  function resetConditionForm() {
    setConditionForm({
      name: "", displayName: "", description: "", category: "inflammatory",
      commonIngredients: "", avoidIngredients: "",
      severity1Desc: "", severity2Desc: "", severity3Desc: "",
    });
  }
  function resetIngredientForm() {
    setIngredientForm({
      name: "", displayName: "", description: "", category: "",
      treatsConditions: "", skinTypes: "", contraindications: "",
    });
  }

  function textToJson(text: string): string | undefined {
    if (!text.trim()) return undefined;
    return JSON.stringify(text.split(",").map((s) => s.trim()).filter(Boolean));
  }

  function safeParseArray(json: string | null | undefined): string[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Base Dermatológica</h1>
      <p className="text-gray-500 mt-1">
        Gerencie condições de pele e ingredientes ativos da base de conhecimento Skinner.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b">
        <button
          onClick={() => setTab("conditions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "conditions" ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Condições ({conditions.data?.length ?? 0})
        </button>
        <button
          onClick={() => setTab("ingredients")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "ingredients" ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Ingredientes ({ingredients.data?.length ?? 0})
        </button>
      </div>

      {/* Conditions tab */}
      {tab === "conditions" && (
        <div className="mt-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowConditionForm(!showConditionForm)}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              {showConditionForm ? "Cancelar" : "Nova Condição"}
            </button>
          </div>

          {showConditionForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCondition.mutate({
                  ...conditionForm,
                  category: conditionForm.category as any,
                  commonIngredients: textToJson(conditionForm.commonIngredients),
                  avoidIngredients: textToJson(conditionForm.avoidIngredients),
                  severity1Desc: conditionForm.severity1Desc || undefined,
                  severity2Desc: conditionForm.severity2Desc || undefined,
                  severity3Desc: conditionForm.severity3Desc || undefined,
                });
              }}
              className="mb-6 p-6 bg-white rounded-xl border shadow-sm space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID (slug)</label>
                  <input
                    value={conditionForm.name}
                    onChange={(e) => setConditionForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                    required placeholder="acne"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    value={conditionForm.displayName}
                    onChange={(e) => setConditionForm((f) => ({ ...f, displayName: e.target.value }))}
                    required placeholder="Acne"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={conditionForm.category}
                    onChange={(e) => setConditionForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={conditionForm.description}
                  onChange={(e) => setConditionForm((f) => ({ ...f, description: e.target.value }))}
                  required rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ingredientes recomendados</label>
                  <input
                    value={conditionForm.commonIngredients}
                    onChange={(e) => setConditionForm((f) => ({ ...f, commonIngredients: e.target.value }))}
                    placeholder="Ácido Salicílico, Niacinamida"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ingredientes a evitar</label>
                  <input
                    value={conditionForm.avoidIngredients}
                    onChange={(e) => setConditionForm((f) => ({ ...f, avoidIngredients: e.target.value }))}
                    placeholder="Óleos comedogênicos, Lanolina"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Severidade 1 (Leve)</label>
                  <input
                    value={conditionForm.severity1Desc}
                    onChange={(e) => setConditionForm((f) => ({ ...f, severity1Desc: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severidade 2 (Moderada)</label>
                  <input
                    value={conditionForm.severity2Desc}
                    onChange={(e) => setConditionForm((f) => ({ ...f, severity2Desc: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severidade 3 (Severa)</label>
                  <input
                    value={conditionForm.severity3Desc}
                    onChange={(e) => setConditionForm((f) => ({ ...f, severity3Desc: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createCondition.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {createCondition.isPending ? "Criando..." : "Criar Condição"}
              </button>
              {createCondition.error && (
                <p className="text-sm text-red-600">{createCondition.error.message}</p>
              )}
            </form>
          )}

          {/* Conditions list */}
          {conditions.data && conditions.data.length > 0 && (
            <div className="space-y-3">
              {conditions.data.map((c) => (
                <div key={c.id} className="p-4 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{c.displayName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {categoryLabels[c.category] ?? c.category}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{c.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                      {c.commonIngredients && (
                        <p className="text-xs text-green-700 mt-2">
                          Recomendados: {safeParseArray(c.commonIngredients).join(", ")}
                        </p>
                      )}
                      {c.avoidIngredients && (
                        <p className="text-xs text-red-600 mt-1">
                          Evitar: {safeParseArray(c.avoidIngredients).join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Deletar "${c.displayName}"?`))
                          deleteCondition.mutate({ id: c.id });
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ingredients tab */}
      {tab === "ingredients" && (
        <div className="mt-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowIngredientForm(!showIngredientForm)}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              {showIngredientForm ? "Cancelar" : "Novo Ingrediente"}
            </button>
          </div>

          {showIngredientForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createIngredient.mutate({
                  ...ingredientForm,
                  category: ingredientForm.category || undefined,
                  description: ingredientForm.description || undefined,
                  treatsConditions: textToJson(ingredientForm.treatsConditions),
                  skinTypes: textToJson(ingredientForm.skinTypes),
                  contraindications: textToJson(ingredientForm.contraindications),
                });
              }}
              className="mb-6 p-6 bg-white rounded-xl border shadow-sm space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID (slug)</label>
                  <input
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                    required placeholder="retinol"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    value={ingredientForm.displayName}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, displayName: e.target.value }))}
                    required placeholder="Retinol"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input
                    value={ingredientForm.category}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="retinoid, aha, vitamin..."
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={ingredientForm.description}
                  onChange={(e) => setIngredientForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trata condições</label>
                  <input
                    value={ingredientForm.treatsConditions}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, treatsConditions: e.target.value }))}
                    placeholder="acne, aging"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipos de pele</label>
                  <input
                    value={ingredientForm.skinTypes}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, skinTypes: e.target.value }))}
                    placeholder="oily, combination"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contraindicações</label>
                  <input
                    value={ingredientForm.contraindications}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, contraindications: e.target.value }))}
                    placeholder="gravidez, amamentação"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createIngredient.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {createIngredient.isPending ? "Criando..." : "Criar Ingrediente"}
              </button>
              {createIngredient.error && (
                <p className="text-sm text-red-600">{createIngredient.error.message}</p>
              )}
            </form>
          )}

          {/* Ingredients list */}
          {ingredients.data && ingredients.data.length > 0 && (
            <div className="space-y-3">
              {ingredients.data.map((ing) => (
                <div key={ing.id} className="p-4 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{ing.displayName}</h3>
                        {ing.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                            {ing.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">{ing.name}</span>
                      </div>
                      {ing.description && (
                        <p className="text-sm text-gray-500 mt-1">{ing.description}</p>
                      )}
                      {ing.treatsConditions && (
                        <p className="text-xs text-blue-700 mt-2">
                          Trata: {safeParseArray(ing.treatsConditions).join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Deletar "${ing.displayName}"?`))
                          deleteIngredient.mutate({ id: ing.id });
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
