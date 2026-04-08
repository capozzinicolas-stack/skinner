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

// --- CSV template ---
const TEMPLATE_HEADERS = [
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
];

const TEMPLATE_ROWS = [
  [
    "CLN-001",
    "Gel de Limpeza Suave",
    "Fórmula suave para uso diário",
    "89.90",
    "https://loja.com/gel-limpeza",
    "Ácido Salicílico 0.5%;Niacinamida 2%",
    "acne;oiliness",
    "oily;combination",
    "anti-acne;pore-control",
    "1",
    "cleanser",
    "both",
    "",
  ],
  [
    "SRM-002",
    "Sérum Antiidade FPS 30",
    "Sérum com retinol e filtro solar",
    "249.00",
    "https://loja.com/serum-antiidade",
    "Retinol 0.3%;Vitamina C 10%",
    "aging;hyperpigmentation",
    "dry;normal",
    "anti-aging;radiance",
    "2",
    "serum",
    "am",
    "gravidez;amamentação",
  ],
];

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

function downloadTemplate() {
  const rows = [
    buildCSVRow(TEMPLATE_HEADERS),
    ...TEMPLATE_ROWS.map(buildCSVRow),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-catalogo-skinner.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// --- CSV parsing ---
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
    return idx >= 0 ? (row[idx]?.trim() ?? "") : "";
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
      price:
        col(row, "price") || col(row, "preco")
          ? parseFloat(col(row, "price") || col(row, "preco"))
          : undefined,
      ecommerceLink: col(row, "ecommercelink") || col(row, "link") || undefined,
      activeIngredients: toJsonArray(col(row, "activeingredients") || col(row, "ingredientes")),
      concernTags: toJsonArray(col(row, "concerntags") || col(row, "condicoes")),
      skinTypeTags: toJsonArray(col(row, "skintypetags") || col(row, "tipospele")),
      objectiveTags: toJsonArray(col(row, "objectivetags") || col(row, "objetivos")),
      severityLevel:
        parseInt(col(row, "severitylevel") || col(row, "intensidade") || "1") || 1,
      stepRoutine: col(row, "steproutine") || col(row, "etapa") || undefined,
      useTime: (col(row, "usetime") || col(row, "uso") || "both") as "am" | "pm" | "both",
      contraindications: toJsonArray(
        col(row, "contraindications") || col(row, "contraindicacoes")
      ),
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
        if (p.concernTags === "[]")
          validationErrors.push(`Linha ${i + 2}: Pelo menos uma condição necessária`);
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
      <h1 className="font-serif text-2xl text-carbone">Importar Produtos</h1>
      <p className="text-sm text-pierre font-light mt-1">
        Faça upload de um arquivo CSV com seus produtos.
      </p>

      {/* Template download */}
      <div className="mt-6 p-5 border border-sable/30 bg-ivoire">
        <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
          Formato do CSV
        </p>
        <p className="text-sm text-carbone font-light">
          Colunas:{" "}
          <code className="text-xs text-pierre">
            sku, name, description, price, ecommerce_link, active_ingredients,
            concern_tags, skin_type_tags, objective_tags, severity_level,
            step_routine, use_time, contraindications
          </code>
        </p>
        <p className="text-sm text-pierre font-light mt-2">
          Para múltiplos valores, separe com ponto-e-vírgula:{" "}
          <code className="text-xs">acne;aging;dehydration</code>
        </p>
        <button
          onClick={downloadTemplate}
          className="mt-4 px-4 py-2 border border-sable text-terre text-sm font-light tracking-wide"
        >
          Baixar template
        </button>
      </div>

      {/* Upload */}
      <div className="mt-6">
        <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
          Arquivo CSV
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full text-sm text-pierre font-light
            file:mr-4 file:py-2 file:px-4 file:border file:border-sable
            file:text-sm file:font-light file:text-terre file:bg-blanc-casse
            hover:file:bg-ivoire file:cursor-pointer"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 border border-red-200 bg-red-50">
          <p className="text-sm font-light text-red-800">Erros de validação</p>
          <ul className="mt-2 space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-xs text-red-600 font-light">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && errors.length === 0 && !result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-carbone font-light">
              {preview.length}{" "}
              {preview.length === 1 ? "produto para importar" : "produtos para importar"}
            </p>
            <button
              onClick={handleImport}
              disabled={bulkCreate.isPending}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {bulkCreate.isPending ? "Importando..." : "Confirmar importação"}
            </button>
          </div>
          <div className="border border-sable/20 overflow-auto max-h-96">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sable/20 bg-ivoire">
                  <th className="text-left px-4 py-2 text-[10px] text-pierre uppercase tracking-wider font-light">
                    SKU
                  </th>
                  <th className="text-left px-4 py-2 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Nome
                  </th>
                  <th className="text-left px-4 py-2 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Preço
                  </th>
                  <th className="text-left px-4 py-2 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Condições
                  </th>
                  <th className="text-left px-4 py-2 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Etapa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sable/10">
                {preview.map((p, i) => (
                  <tr key={i} className="hover:bg-ivoire/60">
                    <td className="px-4 py-2 text-sm text-pierre font-mono font-light">
                      {p.sku}
                    </td>
                    <td className="px-4 py-2 text-sm text-carbone font-light">{p.name}</td>
                    <td className="px-4 py-2 text-sm text-pierre font-light">
                      {p.price != null ? `R$ ${p.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-pierre font-light">
                      {p.concernTags}
                    </td>
                    <td className="px-4 py-2 text-sm text-pierre font-light">
                      {p.stepRoutine ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 border border-sable/20 bg-blanc-casse">
          <p className="font-serif text-lg text-carbone">
            {result.created}{" "}
            {result.created === 1
              ? "produto importado com sucesso"
              : "produtos importados com sucesso"}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-light text-pierre">
                {result.errors.length}{" "}
                {result.errors.length === 1 ? "erro" : "erros"}:
              </p>
              <ul className="mt-1 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600 font-light">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => router.push("/dashboard/catalogo")}
            className="mt-4 px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
          >
            Ver catálogo
          </button>
        </div>
      )}
    </div>
  );
}
