"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { OrganizationTabs } from "@/components/shared/organization-tabs";

export default function BrandConfigPage() {
  const utils = trpc.useUtils();
  const tenant = trpc.tenant.getMine.useQuery();
  const updateBrand = trpc.tenant.updateBrand.useMutation({
    onSuccess: () => {
      utils.tenant.getMine.invalidate();
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 2000);
    },
  });
  const updateConfig = trpc.tenant.updateConfig.useMutation({
    onSuccess: () => {
      utils.tenant.getMine.invalidate();
      setKitSaved(true);
      setTimeout(() => setKitSaved(false), 2000);
    },
  });

  const [form, setForm] = useState({
    logoUrl: "",
    primaryColor: "#0ea5e9",
    secondaryColor: "#075985",
    brandVoice: "",
    disclaimer: "",
  });

  const [kitForm, setKitForm] = useState({
    kitEnabled: true,
    kitDiscount: "",
  });

  const [brandSaved, setBrandSaved] = useState(false);
  const [kitSaved, setKitSaved] = useState(false);

  useEffect(() => {
    if (tenant.data) {
      setForm({
        logoUrl: tenant.data.logoUrl ?? "",
        primaryColor: tenant.data.primaryColor,
        secondaryColor: tenant.data.secondaryColor,
        brandVoice: tenant.data.brandVoice ?? "",
        disclaimer: tenant.data.disclaimer ?? "",
      });
      const config = tenant.data.tenantConfig;
      if (config) {
        setKitForm({
          kitEnabled: config.kitEnabled,
          kitDiscount:
            config.kitDiscount != null ? String(config.kitDiscount) : "",
        });
      }
    }
  }, [tenant.data]);

  function handleBrandSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateBrand.mutate({
      logoUrl: form.logoUrl || undefined,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      brandVoice: form.brandVoice || undefined,
      disclaimer: form.disclaimer || undefined,
    });
  }

  function handleKitSubmit(e: React.FormEvent) {
    e.preventDefault();
    const discountVal = kitForm.kitDiscount !== "" ? parseFloat(kitForm.kitDiscount) : null;
    updateConfig.mutate({
      kitEnabled: kitForm.kitEnabled,
      kitDiscount: isNaN(discountVal as number) ? null : discountVal,
    });
  }

  if (tenant.isLoading)
    return (
      <>
        <OrganizationTabs />
        <div className="p-8 text-pierre font-light text-sm">Carregando...</div>
      </>
    );

  return (
    <>
      <OrganizationTabs />
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-2xl text-carbone">Configuracao de Marca</h1>
      <p className="text-pierre text-sm font-light mt-1">
        Personalize a aparencia da analise para seus clientes.
      </p>

      {/* Brand form */}
      <form onSubmit={handleBrandSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            URL do Logo
          </label>
          <input
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://exemplo.com/logo.png"
            className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
          />
          <p className="text-xs text-pierre font-light mt-1">
            Recomendado: PNG transparente, 200x60px.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
              Cor primaria
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryColor: e.target.value }))
                }
                className="w-10 h-10 border border-sable/40 cursor-pointer"
              />
              <input
                value={form.primaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
              Cor secundaria
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondaryColor: e.target.value }))
                }
                className="w-10 h-10 border border-sable/40 cursor-pointer"
              />
              <input
                value={form.secondaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondaryColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            Voz de marca
          </label>
          <textarea
            value={form.brandVoice}
            onChange={(e) =>
              setForm((f) => ({ ...f, brandVoice: e.target.value }))
            }
            placeholder="Ex: Profissional, acolhedor e educativo. Use linguagem acessivel..."
            rows={3}
            className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
          />
          <p className="text-xs text-pierre font-light mt-1">
            Instrucoes de tom para a IA ao gerar relatorios.
          </p>
        </div>

        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            Disclaimer medico
          </label>
          <textarea
            value={form.disclaimer}
            onChange={(e) =>
              setForm((f) => ({ ...f, disclaimer: e.target.value }))
            }
            placeholder="Ex: Esta analise e apenas informativa e nao substitui a consulta com um dermatologista."
            rows={3}
            className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={updateBrand.isPending}
            className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
          >
            {updateBrand.isPending ? "Salvando..." : "Salvar marca"}
          </button>
          {brandSaved && (
            <span className="text-sm text-pierre font-light">Salvo.</span>
          )}
          {updateBrand.error && (
            <span className="text-sm text-red-600 font-light">
              {updateBrand.error.message}
            </span>
          )}
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-sable/20 my-10" />

      {/* Kit config section */}
      <div>
        <h2 className="font-serif text-xl text-carbone">Kits</h2>
        <p className="text-pierre text-sm font-light mt-1">
          Configure o comportamento dos kits gerados automaticamente pelas analises.
        </p>

        <form onSubmit={handleKitSubmit} className="mt-6 space-y-6">
          {/* Kit enabled toggle */}
          <div className="flex items-start justify-between p-5 bg-white border border-sable/20">
            <div>
              <p className="text-sm text-carbone">Kits habilitados</p>
              <p className="text-xs text-pierre font-light mt-1">
                Quando ativo, cada analise gera um kit de produtos publicamente acessivel.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setKitForm((f) => ({ ...f, kitEnabled: !f.kitEnabled }))
              }
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border transition-colors focus:outline-none ${
                kitForm.kitEnabled
                  ? "bg-carbone border-carbone"
                  : "bg-sable/40 border-sable/40"
              }`}
              role="switch"
              aria-checked={kitForm.kitEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform bg-blanc-casse transition-transform ${
                  kitForm.kitEnabled ? "translate-x-4" : "translate-x-0.5"
                }`}
                style={{ marginTop: "2px" }}
              />
            </button>
          </div>

          {/* Kit discount */}
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
              Desconto do kit (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={kitForm.kitDiscount}
                onChange={(e) =>
                  setKitForm((f) => ({ ...f, kitDiscount: e.target.value }))
                }
                placeholder="0"
                className="w-32 px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
              />
              <span className="text-sm text-pierre font-light">% de desconto sobre o total dos produtos</span>
            </div>
            <p className="text-xs text-pierre font-light mt-1">
              Deixe em branco para nao exibir desconto. Aplica-se aos kits automaticos.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={updateConfig.isPending}
              className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
            >
              {updateConfig.isPending ? "Salvando..." : "Salvar configuracao de kits"}
            </button>
            {kitSaved && (
              <span className="text-sm text-pierre font-light">Salvo.</span>
            )}
            {updateConfig.error && (
              <span className="text-sm text-red-600 font-light">
                {updateConfig.error.message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Preview */}
      <div className="mt-12">
        <h2 className="font-serif text-xl text-carbone mb-4">Preview</h2>
        <div
          className="p-8 border-2 text-center space-y-3"
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
              className="text-2xl font-serif"
              style={{ color: form.primaryColor }}
            >
              {tenant.data?.name ?? "Sua Marca"}
            </div>
          )}
          <p className="text-sm text-pierre font-light">{tenant.data?.name}</p>
          <button
            className="px-6 py-2 text-blanc-casse text-sm font-light"
            style={{ backgroundColor: form.primaryColor }}
          >
            Iniciar Analise
          </button>
          {form.disclaimer && (
            <p className="text-xs text-pierre font-light mt-4 italic">
              {form.disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
