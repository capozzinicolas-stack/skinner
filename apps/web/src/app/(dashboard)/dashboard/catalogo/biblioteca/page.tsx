"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { conditionLabels, serviceCategoryLabels } from "@/lib/sae/labels";

// Procedure library (Oct-2026): Skinner-maintained procedures the clinic adds
// to its catalog with one click. Imported items become regular services the
// clinic can rename, reprice and edit in /dashboard/catalogo.

const CATEGORY_ORDER = ["injectables", "technologies", "skin"] as const;

function capitalize(v: string): string {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
}

function parseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function formatBRL(v: number | null | undefined): string {
  if (v == null) return "";
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProcedureLibraryPage() {
  const utils = trpc.useUtils();
  const library = trpc.product.libraryList.useQuery();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bookingLink, setBookingLink] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const importMutation = trpc.product.importFromLibrary.useMutation({
    onSuccess: (res) => {
      setSelected(new Set());
      utils.product.libraryList.invalidate();
      utils.product.list.invalidate();
      utils.product.stats.invalidate();
      setMessage(
        res.created === 1
          ? "1 procedimento adicionado ao seu catálogo."
          : `${res.created} procedimentos adicionados ao seu catálogo.` +
              (res.skipped > 0 ? ` ${res.skipped} já estavam no catálogo.` : "")
      );
    },
    onError: () => {
      setMessage("Não foi possível adicionar os procedimentos. Tente novamente.");
    },
  });

  const grouped = useMemo(() => {
    const items = library.data ?? [];
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: items.filter((i) => i.category === category),
    })).filter((g) => g.items.length > 0);
  }, [library.data]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllAvailable() {
    setSelected(new Set((library.data ?? []).filter((i) => !i.imported).map((i) => i.id)));
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
            <Link href="/dashboard/catalogo" className="hover:text-carbone">
              Catálogo
            </Link>{" "}
            / Biblioteca
          </p>
          <h1 className="font-serif text-xl md:text-2xl text-carbone mt-1">
            Biblioteca de procedimentos
          </h1>
          <p className="text-sm text-pierre font-light mt-1 max-w-2xl">
            Procedimentos estéticos já configurados pela Skinner com indicações, contraindicações e
            curva de resultado. Selecione os que a sua clínica realiza e adicione ao catálogo. Depois
            você pode renomear, ajustar o preço e incluir complementos em cada um.
          </p>
        </div>
      </div>

      <div className="mt-6 p-5 bg-white border border-sable/20 space-y-3">
        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
            Link de agendamento (opcional, aplicado aos procedimentos adicionados)
          </label>
          <input
            value={bookingLink}
            onChange={(e) => setBookingLink(e.target.value)}
            placeholder="https://agenda.suaclinica.com.br"
            className="w-full md:w-[28rem] px-3 py-2 border border-sable/40 text-sm text-carbone font-light focus:outline-none focus:border-pierre bg-blanc-casse"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              importMutation.mutate({
                ids: Array.from(selected),
                bookingLink: bookingLink.trim() || undefined,
              })
            }
            disabled={selected.size === 0 || importMutation.isPending}
            className="px-5 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-40 min-h-[44px] md:min-h-0"
          >
            {importMutation.isPending
              ? "Adicionando..."
              : selected.size === 1
                ? "Adicionar 1 procedimento"
                : `Adicionar ${selected.size} procedimentos`}
          </button>
          <button
            onClick={selectAllAvailable}
            className="text-sm text-pierre font-light underline"
          >
            Selecionar todos os disponíveis
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-pierre font-light underline"
            >
              Limpar seleção
            </button>
          )}
          {message && <span className="text-sm text-terre font-light">{message}</span>}
        </div>
      </div>

      {library.isLoading && (
        <p className="text-sm text-pierre font-light mt-6">Carregando...</p>
      )}
      {!library.isLoading && grouped.length === 0 && (
        <p className="text-sm text-pierre font-light mt-6">
          A biblioteca ainda não tem procedimentos disponíveis.
        </p>
      )}

      {grouped.map((group) => (
        <div key={group.category} className="mt-8">
          <h2 className="font-serif text-lg text-carbone mb-3">
            {capitalize(serviceCategoryLabels[group.category] ?? group.category)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.items.map((item) => {
              const isSelected = selected.has(item.id);
              const concerns = parseArray(item.concernTags)
                .map((c) => conditionLabels[c] ?? c)
                .join(", ");
              return (
                <label
                  key={item.id}
                  className={`p-4 border bg-white flex gap-3 ${
                    item.imported
                      ? "border-sable/20 opacity-60 cursor-default"
                      : isSelected
                        ? "border-carbone cursor-pointer"
                        : "border-sable/20 hover:border-sable cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={item.imported}
                    onChange={() => toggle(item.id)}
                    className="mt-1 accent-carbone"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-carbone">{item.name}</p>
                      {item.suggestedPrice != null && (
                        <span className="text-xs text-pierre font-light whitespace-nowrap">
                          {formatBRL(item.suggestedPrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-pierre font-light mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    {concerns && (
                      <p className="text-[11px] text-pierre/80 font-light mt-2">
                        Trata: {concerns}
                      </p>
                    )}
                    <p className="text-[11px] text-pierre/80 font-light mt-1">
                      {item.sessionCount
                        ? `${item.sessionCount} ${item.sessionCount === 1 ? "sessão" : "sessões"}`
                        : ""}
                      {item.sessionFrequency ? ` · ${item.sessionFrequency}` : ""}
                      {item.projectionPeakWeeks != null
                        ? ` · resultado máximo em ${item.projectionPeakWeeks} ${item.projectionPeakWeeks === 1 ? "semana" : "semanas"}`
                        : ""}
                    </p>
                    {item.imported && (
                      <p className="text-[10px] text-terre uppercase tracking-wider font-light mt-2">
                        Já está no seu catálogo
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
