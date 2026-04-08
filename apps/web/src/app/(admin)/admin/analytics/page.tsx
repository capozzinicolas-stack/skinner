"use client";

import { trpc } from "@/lib/trpc/client";

function formatDay(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function AnalyticsPage() {
  const analytics = trpc.admin.analytics.useQuery();

  const d = analytics.data;

  return (
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-2xl text-carbone">Analytics</h1>
        <p className="text-sm text-pierre font-light mt-1">
          Desempenho da plataforma nos ultimos 30 dias.
        </p>
      </div>

      {analytics.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {d && (
        <div className="space-y-10">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white border border-sable/20 p-6">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Analises (30 dias)
              </p>
              <p className="font-serif text-3xl text-carbone mt-2">
                {d.totalAnalysed}
              </p>
            </div>
            <div className="bg-white border border-sable/20 p-6">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Latencia media
              </p>
              <p className="font-serif text-3xl text-carbone mt-2">
                {d.avgLatencyMs != null ? `${d.avgLatencyMs}ms` : "—"}
              </p>
            </div>
            <div className="bg-white border border-sable/20 p-6">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Condicoes distintas
              </p>
              <p className="font-serif text-3xl text-carbone mt-2">
                {d.topConditions.length}
              </p>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analyses by day */}
            <div>
              <h2 className="font-serif text-base text-carbone mb-4">
                Analises por dia
              </h2>
              <div className="bg-white border border-sable/20 overflow-hidden">
                {d.analysesByDay.length === 0 ? (
                  <p className="p-6 text-sm text-pierre font-light">
                    Nenhuma analise no periodo.
                  </p>
                ) : (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-sable/20 bg-ivoire">
                          <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            Data
                          </th>
                          <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            Analises
                          </th>
                          <th className="px-6 py-3 w-40" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sable/10">
                        {[...d.analysesByDay].reverse().map((row) => {
                          const max = Math.max(...d.analysesByDay.map((r) => r.count), 1);
                          const pct = (row.count / max) * 100;
                          return (
                            <tr key={row.date} className="hover:bg-ivoire/40">
                              <td className="px-6 py-3 text-sm text-pierre font-light">
                                {formatDay(row.date)}
                              </td>
                              <td className="px-6 py-3 text-sm text-carbone font-light text-right">
                                {row.count}
                              </td>
                              <td className="px-6 py-3">
                                <div className="h-1.5 bg-sable/20">
                                  <div
                                    className="h-1.5 bg-pierre"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>

            {/* Right column: conditions + products */}
            <div className="space-y-8">
              {/* Top conditions */}
              <div>
                <h2 className="font-serif text-base text-carbone mb-4">
                  Condicoes mais detectadas
                </h2>
                <div className="bg-white border border-sable/20 overflow-hidden">
                  {d.topConditions.length === 0 ? (
                    <p className="p-6 text-sm text-pierre font-light">
                      Nenhuma condicao detectada no periodo.
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-sable/20 bg-ivoire">
                          <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            Condicao
                          </th>
                          <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            Ocorrencias
                          </th>
                          <th className="px-6 py-3 w-32" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sable/10">
                        {d.topConditions.map((c) => {
                          const max = d.topConditions[0]?.count ?? 1;
                          const pct = (c.count / max) * 100;
                          return (
                            <tr key={c.name} className="hover:bg-ivoire/40">
                              <td className="px-6 py-3 text-sm text-carbone font-light">
                                {c.name}
                              </td>
                              <td className="px-6 py-3 text-sm text-pierre font-light text-right">
                                {c.count}
                              </td>
                              <td className="px-6 py-3">
                                <div className="h-1.5 bg-sable/20">
                                  <div
                                    className="h-1.5 bg-pierre"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Top products */}
              <div>
                <h2 className="font-serif text-base text-carbone mb-4">
                  Produtos mais recomendados
                </h2>
                <div className="bg-white border border-sable/20 overflow-hidden">
                  {d.topProducts.length === 0 ? (
                    <p className="p-6 text-sm text-pierre font-light">
                      Nenhuma recomendacao no periodo.
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-sable/20 bg-ivoire">
                          <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            Produto
                          </th>
                          <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            SKU
                          </th>
                          <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                            Recomendacoes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sable/10">
                        {d.topProducts.map((p) => (
                          <tr key={p.sku} className="hover:bg-ivoire/40">
                            <td className="px-6 py-3 text-sm text-carbone font-light">
                              {p.name}
                            </td>
                            <td className="px-6 py-3 text-xs text-pierre font-light font-mono">
                              {p.sku}
                            </td>
                            <td className="px-6 py-3 text-sm text-pierre font-light text-right">
                              {p.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
