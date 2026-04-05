"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function BrandConfigPage() {
  const utils = trpc.useUtils();
  const tenant = trpc.tenant.getMine.useQuery();
  const updateBrand = trpc.tenant.updateBrand.useMutation({
    onSuccess: () => {
      utils.tenant.getMine.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [form, setForm] = useState({
    logoUrl: "",
    primaryColor: "#0ea5e9",
    secondaryColor: "#075985",
    brandVoice: "",
    disclaimer: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant.data) {
      setForm({
        logoUrl: tenant.data.logoUrl ?? "",
        primaryColor: tenant.data.primaryColor,
        secondaryColor: tenant.data.secondaryColor,
        brandVoice: tenant.data.brandVoice ?? "",
        disclaimer: tenant.data.disclaimer ?? "",
      });
    }
  }, [tenant.data]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateBrand.mutate({
      logoUrl: form.logoUrl || undefined,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      brandVoice: form.brandVoice || undefined,
      disclaimer: form.disclaimer || undefined,
    });
  }

  if (tenant.isLoading) return <div className="p-8 text-gray-500">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configuração de Marca</h1>
      <p className="text-gray-500 mt-1">
        Personalize a aparência da análise para seus clientes.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">URL do Logo</label>
          <input
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://exemplo.com/logo.png"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Recomendado: PNG transparente, 200x60px.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cor primária
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryColor: e.target.value }))
                }
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                value={form.primaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Cor secundária
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondaryColor: e.target.value }))
                }
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                value={form.secondaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondaryColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Voz de marca
          </label>
          <textarea
            value={form.brandVoice}
            onChange={(e) =>
              setForm((f) => ({ ...f, brandVoice: e.target.value }))
            }
            placeholder="Ex: Profissional, acolhedor e educativo. Use linguagem acessível..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Instruções de tom para a IA ao gerar relatórios.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Disclaimer médico
          </label>
          <textarea
            value={form.disclaimer}
            onChange={(e) =>
              setForm((f) => ({ ...f, disclaimer: e.target.value }))
            }
            placeholder="Ex: Esta análise é apenas informativa e não substitui a consulta com um dermatologista."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={updateBrand.isPending}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {updateBrand.isPending ? "Salvando..." : "Salvar"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              Salvo com sucesso!
            </span>
          )}
          {updateBrand.error && (
            <span className="text-sm text-red-600">
              {updateBrand.error.message}
            </span>
          )}
        </div>
      </form>

      {/* Preview */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Preview
        </h2>
        <div
          className="p-8 rounded-xl border-2 text-center space-y-3"
          style={{ borderColor: form.primaryColor }}
        >
          {form.logoUrl ? (
            <img
              src={form.logoUrl}
              alt="Logo"
              className="h-12 mx-auto object-contain"
            />
          ) : (
            <div
              className="text-2xl font-bold"
              style={{ color: form.primaryColor }}
            >
              {tenant.data?.name ?? "Sua Marca"}
            </div>
          )}
          <p className="text-sm text-gray-500">{tenant.data?.name}</p>
          <button
            className="px-6 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: form.primaryColor }}
          >
            Iniciar Análise
          </button>
          {form.disclaimer && (
            <p className="text-xs text-gray-400 mt-4 italic">
              {form.disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
