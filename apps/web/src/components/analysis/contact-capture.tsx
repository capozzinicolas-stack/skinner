"use client";

import { useState } from "react";

export type ContactData = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  consentToContact: boolean;
};

const EMPTY: ContactData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  consentToContact: false,
};

/**
 * Contact-capture step shown between consent and questionnaire when the
 * tenant enables it. All fields are optional by default — the patient can
 * skip and continue anonymously.
 *
 * When `required` is true:
 *   - Both e-mail AND WhatsApp are mandatory (not "either / or"). Required
 *     mode is triggered EITHER by TenantConfig.contactCaptureRequired OR
 *     by the channel having an identityLimit > 0 (May-2026 rule). In both
 *     cases we want a stable identityKey for analysis.run, so collecting
 *     both channels reduces ambiguity (a patient who used phone last time
 *     and email this time would otherwise look like two distinct people).
 *   - LGPD consent checkbox is mandatory.
 *   - "Pular" (skip) button is hidden.
 */
export function ContactCapture({
  tenantName,
  customMessage,
  required = false,
  onComplete,
}: {
  tenantName: string;
  customMessage?: string | null;
  required?: boolean;
  onComplete: (data: ContactData) => void;
}) {
  const [data, setData] = useState<ContactData>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const hasAnyContact =
    data.clientEmail.trim().length > 0 || data.clientPhone.trim().length > 0;
  const hasBothContacts =
    data.clientEmail.trim().length > 0 && data.clientPhone.trim().length > 0;
  const needsConsent = hasAnyContact && !data.consentToContact;

  function handleSkip() {
    onComplete(EMPTY);
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (required) {
      // Both e-mail AND WhatsApp required — see component docstring for why.
      if (!hasBothContacts) {
        setError("Informe seu e-mail E seu WhatsApp para continuar.");
        return;
      }
      if (!data.consentToContact) {
        setError("Marque o consentimento LGPD para continuar.");
        return;
      }
    } else if (needsConsent) {
      setError("Voce informou um contato. Confirme o consentimento LGPD para prosseguir, ou limpe os campos.");
      return;
    }
    onComplete({
      clientName: data.clientName.trim(),
      clientEmail: data.clientEmail.trim(),
      clientPhone: data.clientPhone.trim(),
      consentToContact: data.consentToContact,
    });
  }

  const message =
    customMessage?.trim() ||
    `${tenantName} gostaria de manter contato para acompanhar sua jornada e enviar o resultado completo da analise.`;

  return (
    <div className="w-full max-w-lg mx-auto px-4 space-y-6">
      <div>
        <h2 className="font-serif text-xl text-carbone">
          Para personalizar sua analise
        </h2>
        <p className="text-sm text-pierre font-light mt-2 leading-relaxed">
          {message}
        </p>
      </div>

      <form onSubmit={handleContinue} className="space-y-4">
        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
            Nome (opcional)
          </label>
          <input
            type="text"
            value={data.clientName}
            onChange={(e) => setData((d) => ({ ...d, clientName: e.target.value }))}
            placeholder="Como podemos te chamar"
            className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-pierre"
          />
        </div>
        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
            E-mail {required ? "(obrigatorio)" : "(opcional)"}
          </label>
          <input
            type="email"
            value={data.clientEmail}
            onChange={(e) => setData((d) => ({ ...d, clientEmail: e.target.value }))}
            placeholder="seu@email.com"
            required={required}
            aria-required={required}
            className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-pierre"
          />
        </div>
        <div>
          <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
            WhatsApp {required ? "(obrigatorio)" : "(opcional)"}
          </label>
          <input
            type="tel"
            value={data.clientPhone}
            onChange={(e) => setData((d) => ({ ...d, clientPhone: e.target.value }))}
            placeholder="(11) 99999-9999"
            required={required}
            aria-required={required}
            className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-pierre"
          />
        </div>

        {(hasAnyContact || required) && (
          <label className="flex items-start gap-3 text-sm text-carbone font-light cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={data.consentToContact}
              onChange={(e) =>
                setData((d) => ({ ...d, consentToContact: e.target.checked }))
              }
              className="mt-1 w-4 h-4"
            />
            <span className="leading-snug">
              Concordo em receber contato da {tenantName} sobre o resultado da
              minha analise e recomendacoes de tratamento. Em conformidade com
              a LGPD (Lei 13.709/2018).
            </span>
          </label>
        )}

        {error && (
          <p className="text-sm text-terre font-light">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          {!required && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-sable/40 text-sm font-light text-terre hover:bg-ivoire transition-colors"
            >
              Pular
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
