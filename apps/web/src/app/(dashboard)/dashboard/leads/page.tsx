"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { skinTypeLabels, objectiveLabels, tr } from "@/lib/sae/labels";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 365, label: "12 meses" },
] as const;

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function whatsappLink(phone: string, name: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const greeting = name ? `Ola ${name},` : "Ola,";
  const msg = `${greeting} aqui e da clinica. Vimos que voce realizou nossa analise de pele e gostariamos de conversar sobre os proximos passos.`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

function mailtoLink(email: string, name: string): string {
  const subject = "Sua analise de pele — proximos passos";
  const body = `${name ? `Ola ${name}` : "Ola"},\n\nVimos que voce realizou nossa analise de pele recentemente. Gostariamos de conversar sobre os proximos passos para o seu cuidado.`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function downloadCsv(rows: Array<Record<string, string>>, days: number) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    "﻿" + headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(String(r[h] ?? ""))).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `skinner-leads-${new Date().toISOString().slice(0, 10)}-${days}d.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LeadsPage() {
  const [days, setDays] = useState<number>(30);
  const [channelId, setChannelId] = useState<string | undefined>(undefined);
  const utils = trpc.useUtils();
  const channelsQuery = trpc.analysisChannel.list.useQuery();
  const leads = trpc.leads.list.useQuery({ days, onlyConsented: true, channelId });
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await utils.leads.exportCsv.fetch({ days, channelId });
      downloadCsv(rows, days);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Leads</h1>
          <p className="text-pierre text-sm font-light mt-1">
            Pacientes que autorizaram contato durante a analise.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={channelId ?? ""}
            onChange={(e) => setChannelId(e.target.value || undefined)}
            className="px-3 py-1.5 border border-sable/40 bg-white text-xs text-carbone font-light tracking-wide"
          >
            <option value="">Todos os canais</option>
            {channelsQuery.data?.channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1 border border-sable/40">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-light tracking-wide ${
                  days === opt.value
                    ? "bg-carbone text-blanc-casse"
                    : "bg-white text-pierre hover:bg-ivoire"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || (leads.data?.length ?? 0) === 0}
            className="px-4 py-1.5 border border-sable text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Exportando..." : "Exportar CSV"}
          </button>
        </div>
      </div>

      {leads.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {leads.data && leads.data.length === 0 && (
        <div className="bg-white border border-sable/20 p-12 text-center">
          <p className="text-sm text-pierre font-light">
            Nenhuma lead capturada neste periodo.
          </p>
          <p className="text-xs text-pierre/70 font-light mt-2">
            Verifique se a captura de contato esta ativada em "Analise" e que pacientes
            autorizaram o contato durante a analise.
          </p>
        </div>
      )}

      {leads.data && leads.data.length > 0 && (
        <div className="bg-white border border-sable/20 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Data</th>
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Nome</th>
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Contato</th>
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Tipo de pele</th>
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Objetivo</th>
                <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/10">
              {leads.data.map((lead) => {
                const skin = lead.skinType ? tr(skinTypeLabels, lead.skinType) : "—";
                const obj = lead.primaryObjective
                  ? tr(objectiveLabels, lead.primaryObjective)
                  : "—";
                return (
                  <tr key={lead.id} className="hover:bg-ivoire/40">
                    <td className="px-4 py-3 text-sm text-pierre font-light whitespace-nowrap">
                      {fmtDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-carbone font-light">
                      {lead.clientName || <span className="text-pierre/60">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-pierre font-light">
                      {lead.clientEmail && <div>{lead.clientEmail}</div>}
                      {lead.clientPhone && <div>{lead.clientPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-pierre font-light capitalize">
                      {skin}
                    </td>
                    <td className="px-4 py-3 text-sm text-pierre font-light capitalize">
                      {obj}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {lead.clientPhone && (
                        <a
                          href={whatsappLink(lead.clientPhone, lead.clientName ?? "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-carbone font-light hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                      {lead.clientEmail && (
                        <a
                          href={mailtoLink(lead.clientEmail, lead.clientName ?? "")}
                          className="text-xs text-pierre font-light hover:underline"
                        >
                          E-mail
                        </a>
                      )}
                      <a
                        href={`/api/report/${lead.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pierre font-light hover:underline"
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

      <p className="text-[10px] text-pierre/60 font-light mt-4">
        Apenas pacientes que marcaram explicitamente o consentimento LGPD aparecem nesta lista.
      </p>
    </div>
  );
}
