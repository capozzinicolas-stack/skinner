"use client";

import { trpc } from "@/lib/trpc/client";

const skinTypeLabels: Record<string, string> = {
  oily: "Oleosa", dry: "Seca", combination: "Mista", normal: "Normal", sensitive: "Sensivel",
};

function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.map((c: any) => c.name ?? c);
    return [];
  } catch { return []; }
}

export default function ReportsPage() {
  const reports = trpc.report.list.useQuery();

  return (
    <div className="p-8">
      <div>
        <h1 className="font-serif text-2xl text-carbone">Relatorios</h1>
        <p className="text-pierre text-sm font-light mt-1">
          Historico de analises realizadas pelos seus clientes.
        </p>
      </div>

      <div className="mt-8">
        {reports.isLoading && <p className="text-pierre font-light">Carregando...</p>}

        {reports.data && reports.data.length === 0 && (
          <div className="text-center py-16 bg-white border border-sable/20">
            <p className="text-pierre font-light">Nenhuma analise realizada ainda.</p>
          </div>
        )}

        {reports.data && reports.data.length > 0 && (
          <div className="bg-white border border-sable/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sable/20 bg-ivoire/50">
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Data
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Cliente
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Tipo de Pele
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Condicoes
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Produtos
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Latencia
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sable/10">
                {reports.data.map((analysis) => {
                  const conditions = safeParseArray(analysis.conditions);
                  return (
                    <tr key={analysis.id} className="hover:bg-ivoire/30">
                      <td className="px-5 py-4 text-sm text-carbone font-light">
                        {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm text-carbone font-light">
                            {analysis.clientName ?? "Anonimo"}
                          </p>
                          {analysis.clientEmail && (
                            <p className="text-xs text-pierre font-light">{analysis.clientEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-carbone font-light">
                        {analysis.skinType ? skinTypeLabels[analysis.skinType] ?? analysis.skinType : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {conditions.slice(0, 3).map((c) => (
                            <span key={c} className="text-xs px-2 py-0.5 bg-ivoire text-terre font-light">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-pierre font-light">
                          {analysis.recommendations.map((r) => r.product.name).join(", ") || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-pierre font-light">
                        {analysis.latencyMs ? `${(analysis.latencyMs / 1000).toFixed(1)}s` : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={`/api/report/${analysis.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-carbone hover:text-terre underline font-light"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
