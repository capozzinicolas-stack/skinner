"use client";

import { Fragment, useState } from "react";
import { trpc } from "@/lib/trpc/client";

const segmentLabels: Record<string, string> = {
  laboratorio: "Laboratorio",
  clinica: "Clinica",
  farmacia: "Farmacia",
  spa: "Spa",
  outro: "Outro",
};

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadsPage() {
  const utils = trpc.useUtils();
  const leads = trpc.admin.listLeads.useQuery();
  const deleteLead = trpc.admin.deleteLead.useMutation({
    onSuccess: () => utils.admin.listLeads.invalidate(),
  });

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = leads.data
    ? leads.data.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.email.toLowerCase().includes(search.toLowerCase()) ||
          (l.company ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-2xl text-carbone">Leads</h1>
        <p className="text-sm text-pierre font-light mt-1">
          Contatos recebidos pelo formulario do site.
        </p>
      </div>

      {/* Stats bar */}
      {leads.data && (
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-white border border-sable/20 px-5 py-3">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
              Total
            </p>
            <p className="font-serif text-xl text-carbone mt-1">{leads.data.length}</p>
          </div>
          {Object.entries(segmentLabels).map(([key, label]) => {
            const count = leads.data.filter((l) => l.segment === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="bg-white border border-sable/20 px-5 py-3">
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  {label}
                </p>
                <p className="font-serif text-xl text-carbone mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou empresa..."
          className="w-full max-w-md px-3 py-2 border border-sable/30 bg-white text-sm text-carbone font-light focus:outline-none focus:border-pierre"
        />
      </div>

      {leads.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {!leads.isLoading && filtered.length === 0 && (
        <p className="text-sm text-pierre font-light">Nenhum lead encontrado.</p>
      )}

      {filtered.length > 0 && (
        <div className="bg-white border border-sable/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Data
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  E-mail
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Empresa
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Segmento
                </th>
                <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Mensagem
                </th>
                <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/10">
              {filtered.map((lead) => (
                <Fragment key={lead.id}>
                  <tr
                    className="hover:bg-ivoire/40 cursor-pointer"
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                  >
                    <td className="px-6 py-4 text-xs text-pierre font-light whitespace-nowrap">
                      {formatDateTime(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-carbone font-light">
                      {lead.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-pierre font-light">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-pierre font-light">
                      {lead.company ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      {lead.segment ? (
                        <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                          {segmentLabels[lead.segment] ?? lead.segment}
                        </span>
                      ) : (
                        <span className="text-pierre/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-pierre font-light max-w-[200px] truncate">
                      {lead.message ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover lead de "${lead.name}"?`)) {
                            deleteLead.mutate({ id: lead.id });
                          }
                        }}
                        disabled={deleteLead.isPending}
                        className="text-xs text-pierre font-light hover:underline disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                  {expanded === lead.id && lead.message && (
                    <tr className="bg-ivoire/30">
                      <td colSpan={7} className="px-6 py-4">
                        <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                          Mensagem completa
                        </p>
                        <p className="text-sm text-carbone font-light whitespace-pre-wrap">
                          {lead.message}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-sable/20 bg-ivoire">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
