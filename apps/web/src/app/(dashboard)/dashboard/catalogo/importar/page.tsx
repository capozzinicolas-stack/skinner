"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type ParsedProduct = {
  sku: string;
  name: string;
  description?: string;
  price?: number;
  ecommerceLink?: string;
  activeIngredients: string;
  concernTags: string;
  skinTypeTags: string;
  objectiveTags: string;
  severityLevel: number;
  stepRoutine?: string;
  useTime: "am" | "pm" | "both";
  contraindications?: string;
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());
    return values;
  });

  return { headers, rows };
}

function csvToProducts(headers: string[], rows: string[][]): ParsedProduct[] {
  const col = (row: string[], name: string) => {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().replace(/[_\s]/g, "") === name.toLowerCase().replace(/[_\s]/g, "")
    );
    return idx >= 0 ? row[idx]?.trim() : "";
  };

  function toJsonArray(val: string): string {
    if (!val) return "[]";
    if (val.startsWith("[")) return val;
    return JSON.stringify(val.split(";").map((s) => s.trim()).filter(Boolean));
  }

  return rows
    .filter((row) => row.some((v) => v))
    .map((row) => ({
      sku: col(row, "sku"),
      name: col(row, "name") || col(row, "nome"),
      description: col(row, "description") || col(row, "descricao") || undefined,
      price: col(row, "price") || col(row, "preco") ? parseFloat(col(row, "price") || col(row, "preco")) : undefined,
      ecommerceLink: col(row, "ecommercelink") || col(row, "link") || undefined,
      activeIngredients: toJsonArray(col(row, "activeingredients") || col(row, "ingredientes")),
      concernTags: toJsonArray(col(row, "concerntags") || col(row, "condicoes")),
      skinTypeTags: toJsonArray(col(row, "skintypetags") || col(row, "tipospele")),
      objectiveTags: toJsonArray(col(row, "objectivetags") || col(row, "objetivos")),
      severityLevel: parseInt(col(row, "severitylevel") || col(row, "intensidade") || "1") || 1,
      stepRoutine: col(row, "steproutine") || col(row, "etapa") || undefined,
      useTime: (col(row, "usetime") || col(row, "uso") || "both") as "am" | "pm" | "both",
      contraindications: toJsonArray(col(row, "contraindications") || col(row, "contraindicacoes")),
    }));
}

export default function ImportPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const bulkCreate = trpc.product.bulkCreate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
    },
  });

  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0) {
        setErrors(["Arquivo vazio ou formato inválido."]);
        return;
      }

      const products = csvToProducts(headers, rows);
      const validationErrors: string[] = [];

      products.forEach((p, i) => {
        if (!p.sku) validationErrors.push(`Linha ${i + 2}: SKU obrigatório`);
        if (!p.name) validationErrors.push(`Linha ${i + 2}: Nome obrigatório`);
        if (p.concernTags === "[]") validationErrors.push(`Linha ${i + 2}: Pelo menos uma condição necessária`);
      });

      setErrors(validationErrors);
      setPreview(products);
      setResult(null);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (preview.length === 0 || errors.length > 0) return;
    bulkCreate.mutate({ products: preview });
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Importar Produtos</h1>
      <p className="text-gray-500 mt-1">
        Faça upload de um arquivo CSV com seus produtos.
      </p>

      {/* Template */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-medium">Formato do CSV</p>
        <p className="text-xs text-blue-600 mt-1">
          Colunas: <code>sku, name, description, price, ecommerce_link, active_ingredients, concern_tags, skin_type_tags, objective_tags, severity_level, step_routine, use_time, contraindications</code>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Para múltiplos valores, separe com ponto-e-vírgula: <code>acne;aging;dehydration</code>
        </p>
      </div>

      {/* Upload */}
      <div className="mt-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-800">Erros de validação</p>
          <ul className="mt-2 space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-xs text-red-600">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && errors.length === 0 && !result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-900">
              {preview.length} produtos para importar
            </p>
            <button
              onClick={handleImport}
              disabled={bulkCreate.isPending}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {bulkCreate.isPending ? "Importando..." : "Confirmar Importação"}
            </button>
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-auto max-h-96">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">SKU</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Nome</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Preço</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Condições</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Etapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono">{p.sku}</td>
                    <td className="px-4 py-2 text-sm">{p.name}</td>
                    <td className="px-4 py-2 text-sm">{p.price ? `R$ ${p.price.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-2 text-xs">{p.concernTags}</td>
                    <td className="px-4 py-2 text-sm">{p.stepRoutine ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-lg font-semibold text-green-700">
            {result.created} produtos importados com sucesso
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-700">{result.errors.length} erros:</p>
              <ul className="mt-1 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600">{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => router.push("/dashboard/catalogo")}
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            Ver Catálogo
          </button>
        </div>
      )}
    </div>
  );
}
