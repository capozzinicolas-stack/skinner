"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = {
  email: string;
  monthlyPriceBRL: string;
  analysisLimit: string;
  commissionRate: string;
  maxUsers: string;
  skipSetupFee: boolean;
  planLabel: string;
};

const initialForm: FormState = {
  email: "",
  monthlyPriceBRL: "",
  analysisLimit: "500",
  commissionRate: "2.5",
  maxUsers: "5",
  skipSetupFee: true,
  planLabel: "Custom",
};

export default function NovoCustomPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLink(null);
    setCopied(false);
    try {
      const res = await fetch("/api/billing/admin-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          monthlyPriceBRL: Number(form.monthlyPriceBRL),
          analysisLimit: Number(form.analysisLimit),
          commissionRate: Number(form.commissionRate) / 100,
          maxUsers: Number(form.maxUsers),
          skipSetupFee: form.skipSetupFee,
          planLabel: form.planLabel.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro desconhecido");
        return;
      }
      setLink(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function whatsappUrl(): string {
    if (!link) return "";
    const msg = `Ola, segue o link para finalizar a contratacao do plano Skinner ${form.planLabel}:\n\n${link}\n\nApos o pagamento voce recebera um e-mail com login e senha temporaria para acessar a plataforma.`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="border-b border-sable/20 pb-6 mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Novo Plano Custom</h1>
          <p className="text-sm text-pierre font-light mt-1">
            Gere um link de pagamento Stripe com preco e limites negociados manualmente.
          </p>
        </div>
        <Link
          href="/admin/tenants"
          className="text-xs text-pierre font-light hover:underline"
        >
          ← Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-sable/20 p-6">
        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
            E-mail do cliente
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="contato@cliente.com.br"
            className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
          />
          <p className="text-[10px] text-pierre font-light mt-1">
            Stripe usa este e-mail no Checkout. O webhook usa o mesmo para criar o usuario.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Mensalidade (R$)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.monthlyPriceBRL}
              onChange={(e) => setForm({ ...form, monthlyPriceBRL: e.target.value })}
              required
              placeholder="750"
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Rotulo do plano
            </label>
            <input
              type="text"
              value={form.planLabel}
              onChange={(e) => setForm({ ...form, planLabel: e.target.value })}
              maxLength={50}
              placeholder="Custom"
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Limite de analises/mes
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.analysisLimit}
              onChange={(e) => setForm({ ...form, analysisLimit: e.target.value })}
              required
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Comissao (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
              required
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
            <p className="text-[10px] text-pierre font-light mt-1">Ex.: 2.5 = 2,5%</p>
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Max. usuarios
            </label>
            <input
              type="number"
              min={1}
              max={999}
              step={1}
              value={form.maxUsers}
              onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
              required
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-carbone font-light">
          <input
            type="checkbox"
            checked={form.skipSetupFee}
            onChange={(e) => setForm({ ...form, skipSetupFee: e.target.checked })}
            className="w-4 h-4"
          />
          Waivear setup fee (recomendado para clientes negociados manualmente)
        </label>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar link de pagamento"}
          </button>
          {error && <p className="text-sm text-pierre font-light">{error}</p>}
        </div>
      </form>

      {link && (
        <div className="mt-8 p-6 bg-ivoire border border-sable">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            Link gerado
          </p>
          <div className="bg-white border border-sable/30 p-3 text-xs text-carbone font-mono break-all">
            {link}
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide"
            >
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-sable text-terre text-xs font-light tracking-wide hover:bg-blanc-casse"
            >
              Enviar via WhatsApp
            </a>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-sable text-terre text-xs font-light tracking-wide hover:bg-blanc-casse"
            >
              Abrir Checkout
            </a>
          </div>
          <p className="text-[10px] text-pierre font-light mt-4">
            Este link e de uso unico. Apos o pagamento, o webhook cria o tenant + usuario
            automaticamente e envia o e-mail de boas-vindas com a senha temporaria.
          </p>
        </div>
      )}
    </div>
  );
}
