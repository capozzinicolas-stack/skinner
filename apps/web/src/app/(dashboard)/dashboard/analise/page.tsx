"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

// ─── Plan restriction helpers ─────────────────────────────────────────────────

type PlanId = "growth" | "pro" | "enterprise";

// Returns the restriction reason for a field given the current plan, or null if allowed.
// Note: Apr-2026 rename — what was "starter" is now "growth"; what was "growth" is now "pro".
function getPlanRestriction(plan: PlanId, field: string): string | null {
  if (plan === "enterprise") return null;

  const growthRestricted = [
    "questionPregnantEnabled",
    "resultsShowAlertSigns",
    "photoOnlyMode",
  ];

  // Pro cannot use photoOnlyMode unless admin explicitly enables it
  const proRestricted = ["photoOnlyMode"];

  if (plan === "growth" && growthRestricted.includes(field)) {
    return "Disponivel nos planos Pro e Enterprise";
  }
  if (plan === "pro" && proRestricted.includes(field)) {
    return "Disponivel apenas no plano Enterprise ou com aprovacao do administrador";
  }
  return null;
}

// ─── Score calculation ────────────────────────────────────────────────────────

type AnalysisFormState = {
  // Tone of the patient-facing analysis output
  analysisTone: "humanized" | "technical";
  // Cross-tenant benchmark opt-in
  benchmarkOptIn: boolean;
  // Questionnaire
  questionAllergiesEnabled: boolean;
  questionSunscreenEnabled: boolean;
  questionPregnantEnabled: boolean;
  photoOnlyMode: boolean;
  // Welcome screen
  welcomeTitle: string;
  welcomeDescription: string;
  welcomeCtaText: string;
  welcomeSubtext: string;
  welcomeSubtextVisible: boolean;
  // Consent
  consentExtraText: string;
  consentButtonText: string;
  // Photo
  photoTitle: string;
  photoInstruction: string;
  photoExtraText: string;
  // Results toggles
  resultsShowBarrier: boolean;
  resultsShowConditions: boolean;
  resultsShowConditionsDesc: boolean;
  resultsShowSeverityBars: boolean;
  resultsShowActionPlan: boolean;
  resultsShowTimeline: boolean;
  resultsShowAlertSigns: boolean;
  resultsShowProducts: boolean;
  resultsShowServices: boolean;
  resultsShowMatchScore: boolean;
  resultsShowPdfButton: boolean;
  resultsShowPrices: boolean;
  // Skin projection
  projectionEnabled: boolean;
  // Results text
  resultsTopMessage: string;
  resultsFooterText: string;
  productCtaText: string;
  serviceCtaText: string;
  // Limits
  maxProductRecs: string;
  maxServiceRecs: string;
};

const DEFAULT_FORM: AnalysisFormState = {
  analysisTone: "humanized",
  benchmarkOptIn: false,
  questionAllergiesEnabled: true,
  questionSunscreenEnabled: true,
  questionPregnantEnabled: true,
  photoOnlyMode: false,
  welcomeTitle: "",
  welcomeDescription: "",
  welcomeCtaText: "",
  welcomeSubtext: "",
  welcomeSubtextVisible: true,
  consentExtraText: "",
  consentButtonText: "",
  photoTitle: "",
  photoInstruction: "",
  photoExtraText: "",
  resultsShowBarrier: true,
  resultsShowConditions: true,
  resultsShowConditionsDesc: true,
  resultsShowSeverityBars: true,
  resultsShowActionPlan: true,
  resultsShowTimeline: true,
  resultsShowAlertSigns: true,
  resultsShowProducts: true,
  resultsShowServices: true,
  resultsShowMatchScore: true,
  resultsShowPdfButton: true,
  resultsShowPrices: true,
  projectionEnabled: true,
  resultsTopMessage: "",
  resultsFooterText: "",
  productCtaText: "",
  serviceCtaText: "",
  maxProductRecs: "",
  maxServiceRecs: "",
};

function calcScore(f: AnalysisFormState): number {
  let score = 100;
  if (!f.questionAllergiesEnabled) score -= 8;
  if (!f.questionSunscreenEnabled) score -= 5;
  if (!f.questionPregnantEnabled) score -= 12;
  if (f.photoOnlyMode) score -= 40;
  if (!f.resultsShowConditions) score -= 10;
  if (!f.resultsShowAlertSigns) score -= 15;
  if (!f.resultsShowActionPlan) score -= 7;
  return Math.max(0, score);
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-carbone";
  if (score >= 60) return "text-terre";
  return "text-red-700";
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border transition-colors focus:outline-none ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-sable/30 border-sable/30"
          : checked
          ? "bg-carbone border-carbone"
          : "bg-sable/40 border-sable/40"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform bg-blanc-casse transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
        style={{ marginTop: "2px" }}
      />
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <h2 className="font-serif text-xl text-carbone">{title}</h2>
      {description && (
        <p className="text-pierre text-sm font-light mt-1">{description}</p>
      )}
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  locked = false,
  lockReason,
  warning,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  lockReason?: string;
  warning?: string;
}) {
  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-carbone">{label}</p>
            {locked && (
              <span className="text-[10px] text-pierre uppercase tracking-wider font-light px-2 py-0.5 bg-ivoire border border-sable/20">
                bloqueado
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-pierre font-light mt-1">{description}</p>
          )}
          {locked && lockReason && (
            <p className="text-xs text-pierre font-light mt-2 border-l-2 border-sable/40 pl-2">
              {lockReason}
            </p>
          )}
          {warning && !checked && !locked && (
            <p className="text-xs text-terre font-light mt-2 border-l-2 border-terre/40 pl-2">
              {warning}
            </p>
          )}
        </div>
        <Toggle checked={checked} onChange={onChange} disabled={locked} />
      </div>
    </div>
  );
}

// ─── Text field ───────────────────────────────────────────────────────────────

function TextField({
  label,
  placeholder,
  value,
  onChange,
  hint,
  multiline = false,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
        />
      )}
      {hint && (
        <p className="text-xs text-pierre font-light mt-1">{hint}</p>
      )}
    </div>
  );
}

// ─── Live Preview Panel ───────────────────────────────────────────────────────

type PreviewTab = "boas-vindas" | "questionario" | "foto" | "resultado";

const PREVIEW_TABS: { id: PreviewTab; label: string }[] = [
  { id: "boas-vindas", label: "Boas-vindas" },
  { id: "questionario", label: "Questionario" },
  { id: "foto", label: "Foto" },
  { id: "resultado", label: "Resultado" },
];

function PreviewBoasVindas({ form }: { form: AnalysisFormState }) {
  const title = form.welcomeTitle || "Analise de Pele";
  const description =
    form.welcomeDescription ||
    "Descubra o tipo da sua pele e receba recomendacoes personalizadas.";
  const cta = form.welcomeCtaText || "Iniciar Analise";
  const subtext = form.welcomeSubtext || "Gratuito e sem cadastro";

  return (
    <div className="flex flex-col h-full px-3 py-4 justify-between">
      <div className="flex flex-col gap-3 flex-1 justify-center">
        <div className="h-px bg-sable/30 w-8 mx-auto" />
        <h2
          className="font-serif text-[13px] text-carbone text-center leading-tight"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {title}
        </h2>
        <p className="text-[9px] text-pierre font-light text-center leading-relaxed px-1">
          {description}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1.5 pb-3">
        <button className="w-full py-2 bg-carbone text-blanc-casse text-[9px] font-light tracking-wide text-center">
          {cta}
        </button>
        {form.welcomeSubtextVisible && (
          <p className="text-[8px] text-pierre font-light text-center">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

const QUESTIONS = [
  { key: "type", label: "Como voce descreveria sua pele geralmente?", locked: true },
  { key: "concerns", label: "Quais sao suas principais preocupacoes?", locked: true },
  { key: "goal", label: "Qual e seu principal objetivo com o tratamento?", locked: true },
  { key: "age", label: "Qual e a sua faixa etaria?", locked: true },
  {
    key: "questionAllergiesEnabled",
    label: "Voce tem alguma alergia ou sensibilidade?",
    locked: false,
  },
  {
    key: "questionSunscreenEnabled",
    label: "Com que frequencia usa protetor solar?",
    locked: false,
  },
  {
    key: "questionPregnantEnabled",
    label: "Esta gravida ou amamentando?",
    locked: false,
  },
];

function PreviewQuestionario({ form }: { form: AnalysisFormState }) {
  if (form.photoOnlyMode) {
    return (
      <div className="flex flex-col h-full px-3 py-4 justify-center items-center gap-2">
        <div className="w-8 h-8 border border-sable/30 flex items-center justify-center">
          <span className="text-[10px] text-pierre">foto</span>
        </div>
        <p className="text-[9px] text-terre font-light text-center leading-relaxed px-2">
          Modo foto-only: questionario sera ignorado
        </p>
      </div>
    );
  }

  function isEnabled(key: string): boolean {
    if (key === "questionAllergiesEnabled") return form.questionAllergiesEnabled;
    if (key === "questionSunscreenEnabled") return form.questionSunscreenEnabled;
    if (key === "questionPregnantEnabled") return form.questionPregnantEnabled;
    return true;
  }

  return (
    <div className="flex flex-col h-full px-3 py-3">
      <p className="text-[8px] text-pierre uppercase tracking-wider font-light mb-2">
        Perguntas
      </p>
      <div className="flex flex-col gap-1.5">
        {QUESTIONS.map((q, i) => {
          const enabled = isEnabled(q.key);
          return (
            <div key={q.key} className="flex items-start gap-1.5">
              <span className="text-[8px] text-sable font-light mt-0.5 shrink-0">
                {i + 1}.
              </span>
              <p
                className={`text-[9px] leading-tight font-light ${
                  enabled ? "text-carbone" : "text-sable line-through"
                }`}
              >
                {q.label}
                {!enabled && (
                  <span className="text-[8px] text-pierre not-italic ml-1 no-underline">
                    (desativado)
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewFoto({ form }: { form: AnalysisFormState }) {
  const title = form.photoTitle || "Foto da Pele";
  const instruction =
    form.photoInstruction ||
    "Posicione seu rosto no centro da camera.";
  const extra =
    form.photoExtraText ||
    "Certifique-se de estar em ambiente bem iluminado.";

  const tips = [
    "Boa iluminacao natural",
    "Rosto sem maquiagem",
    "Camera na altura dos olhos",
  ];

  return (
    <div className="flex flex-col h-full px-3 py-3 gap-2">
      <h3
        className="font-serif text-[11px] text-carbone"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {title}
      </h3>
      <p className="text-[9px] text-pierre font-light leading-relaxed">
        {instruction}
      </p>
      {/* Camera frame placeholder */}
      <div className="border border-sable/40 bg-ivoire/60 flex items-center justify-center h-20 mx-1">
        <div className="text-center">
          <div className="w-8 h-8 border border-sable/50 mx-auto mb-1" />
          <p className="text-[8px] text-pierre font-light">Camera</p>
        </div>
      </div>
      {form.photoExtraText || true ? (
        <p className="text-[8px] text-pierre font-light leading-relaxed italic">
          {extra}
        </p>
      ) : null}
      <div className="mt-1">
        <p className="text-[8px] text-pierre uppercase tracking-wider font-light mb-1">
          Dicas
        </p>
        <div className="flex flex-col gap-0.5">
          {tips.map((tip) => (
            <div key={tip} className="flex items-start gap-1">
              <span className="text-[8px] text-sable mt-0.5">—</span>
              <p className="text-[8px] text-pierre font-light">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewResultado({ form }: { form: AnalysisFormState }) {
  const productCta = form.productCtaText || "Comprar";
  const serviceCta = form.serviceCtaText || "Agendar";

  return (
    <div className="flex flex-col px-3 py-3 gap-2">
      {/* Top message */}
      {form.resultsTopMessage && (
        <div className="border-l-2 border-sable/40 pl-2">
          <p className="text-[8px] text-pierre font-light leading-relaxed italic">
            {form.resultsTopMessage}
          </p>
        </div>
      )}

      {/* Skin type header */}
      <div className="text-center py-1.5 border-b border-sable/20">
        <p className="text-[8px] text-pierre uppercase tracking-wider font-light">
          Resultado
        </p>
        <h3
          className="font-serif text-[12px] text-carbone mt-0.5"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Sua pele e Normal
        </h3>
      </div>

      {/* Barrier status */}
      {form.resultsShowBarrier && (
        <div className="border border-sable/20 bg-ivoire/40 px-2 py-1.5">
          <p className="text-[8px] text-pierre uppercase tracking-wider font-light">
            Barreira Cutanea
          </p>
          <p className="text-[9px] text-carbone font-light mt-0.5">
            Barreira integra — Nivel normal
          </p>
        </div>
      )}

      {/* Conditions */}
      {form.resultsShowConditions && (
        <div>
          <p className="text-[8px] text-pierre uppercase tracking-wider font-light mb-1">
            Condicoes identificadas
          </p>
          <div className="flex flex-col gap-1">
            {["Oleosidade leve", "Poros dilatados"].map((c) => (
              <div key={c} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 bg-sable/60 mt-1 shrink-0" />
                <p className="text-[9px] text-carbone font-light">{c}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Severity bars */}
      {form.resultsShowSeverityBars && (
        <div className="flex flex-col gap-1">
          {[
            { label: "Oleosidade", val: 55 },
            { label: "Sensibilidade", val: 30 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-0.5">
                <p className="text-[8px] text-pierre font-light">{item.label}</p>
                <p className="text-[8px] text-pierre font-light">{item.val}%</p>
              </div>
              <div className="h-0.5 bg-sable/20">
                <div
                  className="h-full bg-carbone"
                  style={{ width: `${item.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action plan */}
      {form.resultsShowActionPlan && (
        <div className="border border-sable/20 px-2 py-1.5">
          <p className="text-[8px] text-pierre uppercase tracking-wider font-light mb-1">
            Plano de Acao
          </p>
          <div className="flex flex-col gap-0.5">
            {["Limpeza matinal", "Hidratacao diaria", "Protetor solar"].map(
              (step) => (
                <div key={step} className="flex items-start gap-1">
                  <span className="text-[8px] text-sable shrink-0">—</span>
                  <p className="text-[8px] text-carbone font-light">{step}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Products */}
      {form.resultsShowProducts && (
        <div>
          <p className="text-[8px] text-pierre uppercase tracking-wider font-light mb-1">
            Produtos Recomendados
          </p>
          <div className="flex flex-col gap-1">
            {["Gel de Limpeza", "Hidratante Oil-Free"].map((prod) => (
              <div
                key={prod}
                className="border border-sable/20 px-2 py-1 flex items-center justify-between gap-1"
              >
                <div>
                  <p className="text-[9px] text-carbone font-light">{prod}</p>
                  {form.resultsShowMatchScore && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <div className="h-0.5 w-8 bg-sable/20">
                        <div className="h-full bg-carbone" style={{ width: "88%" }} />
                      </div>
                      <p className="text-[7px] text-pierre font-light">88%</p>
                    </div>
                  )}
                  {form.resultsShowPrices && (
                    <p className="text-[8px] text-pierre font-light mt-0.5">
                      R$ 89,90
                    </p>
                  )}
                </div>
                <button className="text-[7px] bg-carbone text-blanc-casse px-1.5 py-0.5 shrink-0">
                  {productCta}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {form.resultsShowServices && (
        <div>
          <p className="text-[8px] text-pierre uppercase tracking-wider font-light mb-1">
            Tratamentos Recomendados
          </p>
          <div className="border border-sable/20 px-2 py-1 flex items-center justify-between gap-1">
            <div>
              <p className="text-[9px] text-carbone font-light">Limpeza de Pele</p>
              {form.resultsShowPrices && (
                <p className="text-[8px] text-pierre font-light mt-0.5">
                  R$ 120,00
                </p>
              )}
            </div>
            <button className="text-[7px] bg-carbone text-blanc-casse px-1.5 py-0.5 shrink-0">
              {serviceCta}
            </button>
          </div>
        </div>
      )}

      {/* PDF button */}
      {form.resultsShowPdfButton && (
        <button className="w-full py-1.5 border border-sable/40 text-[8px] text-pierre font-light tracking-wide text-center">
          Baixar relatorio em PDF
        </button>
      )}

      {/* Footer text */}
      {form.resultsFooterText && (
        <p className="text-[8px] text-pierre font-light leading-relaxed italic text-center border-t border-sable/20 pt-1.5">
          {form.resultsFooterText}
        </p>
      )}
    </div>
  );
}

function LivePreview({ form }: { form: AnalysisFormState }) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("boas-vindas");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
        Preview
      </p>

      {/* Phone frame */}
      <div className="border border-sable/30 bg-white" style={{ width: 280 }}>
        {/* Tab bar */}
        <div className="border-b border-sable/20 flex">
          {PREVIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-[8px] font-light tracking-wide transition-colors border-r border-sable/20 last:border-r-0 ${
                activeTab === tab.id
                  ? "bg-carbone text-blanc-casse"
                  : "bg-blanc-casse text-pierre hover:bg-ivoire"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Screen content */}
        <div
          className="bg-white overflow-y-auto"
          style={{ height: 460 }}
        >
          {activeTab === "boas-vindas" && <PreviewBoasVindas form={form} />}
          {activeTab === "questionario" && <PreviewQuestionario form={form} />}
          {activeTab === "foto" && <PreviewFoto form={form} />}
          {activeTab === "resultado" && <PreviewResultado form={form} />}
        </div>

        {/* Phone bottom bar */}
        <div className="border-t border-sable/20 flex items-center justify-center py-1.5">
          <div className="w-10 h-0.5 bg-sable/40" />
        </div>
      </div>

      <p className="text-[8px] text-pierre font-light" style={{ width: 280 }}>
        Visualizacao aproximada. Atualiza em tempo real conforme as configuracoes.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnaliseConfigPage() {
  const utils = trpc.useUtils();
  // Use getMine (tenantProcedure) which already includes tenantConfig
  const tenantQuery = trpc.tenant.getMine.useQuery();
  const updateMutation = trpc.tenant.updateAnalysisConfig.useMutation({
    onSuccess: () => {
      utils.tenant.getMine.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const [form, setForm] = useState<AnalysisFormState>(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  // Derive plan and locked fields from the loaded data
  const plan = (tenantQuery.data?.plan ?? "growth") as PlanId;
  const cfg = tenantQuery.data?.tenantConfig as Record<string, unknown> | null | undefined;

  let adminLockedFields: string[] = [];
  try {
    const raw = cfg?.adminLockedFields as string | null | undefined;
    adminLockedFields = raw ? JSON.parse(raw) : [];
  } catch {
    adminLockedFields = [];
  }

  // Determine if a field is locked (either by plan or by admin)
  function isLocked(field: string): boolean {
    if (adminLockedFields.includes(field)) return true;
    return getPlanRestriction(plan, field) !== null;
  }

  function getLockReason(field: string): string | undefined {
    if (adminLockedFields.includes(field)) {
      return "Esta configuracao foi bloqueada pelo administrador da plataforma.";
    }
    return getPlanRestriction(plan, field) ?? undefined;
  }

  useEffect(() => {
    if (!cfg) return;
    setForm({
      analysisTone: ((cfg.analysisTone as string) === "technical" ? "technical" : "humanized") as "humanized" | "technical",
      benchmarkOptIn: (cfg.benchmarkOptIn as boolean) ?? false,
      questionAllergiesEnabled: (cfg.questionAllergiesEnabled as boolean) ?? true,
      questionSunscreenEnabled: (cfg.questionSunscreenEnabled as boolean) ?? true,
      questionPregnantEnabled: (cfg.questionPregnantEnabled as boolean) ?? true,
      photoOnlyMode: (cfg.photoOnlyMode as boolean) ?? false,
      welcomeTitle: (cfg.welcomeTitle as string) ?? "",
      welcomeDescription: (cfg.welcomeDescription as string) ?? "",
      welcomeCtaText: (cfg.welcomeCtaText as string) ?? "",
      welcomeSubtext: (cfg.welcomeSubtext as string) ?? "",
      welcomeSubtextVisible: (cfg.welcomeSubtextVisible as boolean) ?? true,
      consentExtraText: (cfg.consentExtraText as string) ?? "",
      consentButtonText: (cfg.consentButtonText as string) ?? "",
      photoTitle: (cfg.photoTitle as string) ?? "",
      photoInstruction: (cfg.photoInstruction as string) ?? "",
      photoExtraText: (cfg.photoExtraText as string) ?? "",
      resultsShowBarrier: (cfg.resultsShowBarrier as boolean) ?? true,
      resultsShowConditions: (cfg.resultsShowConditions as boolean) ?? true,
      resultsShowConditionsDesc: (cfg.resultsShowConditionsDesc as boolean) ?? true,
      resultsShowSeverityBars: (cfg.resultsShowSeverityBars as boolean) ?? true,
      resultsShowActionPlan: (cfg.resultsShowActionPlan as boolean) ?? true,
      resultsShowTimeline: (cfg.resultsShowTimeline as boolean) ?? true,
      resultsShowAlertSigns: (cfg.resultsShowAlertSigns as boolean) ?? true,
      resultsShowProducts: (cfg.resultsShowProducts as boolean) ?? true,
      resultsShowServices: (cfg.resultsShowServices as boolean) ?? true,
      resultsShowMatchScore: (cfg.resultsShowMatchScore as boolean) ?? true,
      resultsShowPdfButton: (cfg.resultsShowPdfButton as boolean) ?? true,
      resultsShowPrices: (cfg.resultsShowPrices as boolean) ?? true,
      projectionEnabled: (cfg.projectionEnabled as boolean) ?? true,
      resultsTopMessage: (cfg.resultsTopMessage as string) ?? "",
      resultsFooterText: (cfg.resultsFooterText as string) ?? "",
      productCtaText: (cfg.productCtaText as string) ?? "",
      serviceCtaText: (cfg.serviceCtaText as string) ?? "",
      maxProductRecs:
        cfg.maxProductRecs != null ? String(cfg.maxProductRecs) : "",
      maxServiceRecs:
        cfg.maxServiceRecs != null ? String(cfg.maxServiceRecs) : "",
    });
  }, [tenantQuery.data]);

  function set<K extends keyof AnalysisFormState>(
    key: K,
    value: AnalysisFormState[K]
  ) {
    // Do not allow setting locked fields
    if (isLocked(key)) return;
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const maxProducts =
      form.maxProductRecs !== "" ? parseInt(form.maxProductRecs) : null;
    const maxServices =
      form.maxServiceRecs !== "" ? parseInt(form.maxServiceRecs) : null;

    updateMutation.mutate({
      analysisTone: form.analysisTone,
      benchmarkOptIn: form.benchmarkOptIn,
      questionAllergiesEnabled: form.questionAllergiesEnabled,
      questionSunscreenEnabled: form.questionSunscreenEnabled,
      questionPregnantEnabled: form.questionPregnantEnabled,
      photoOnlyMode: form.photoOnlyMode,
      welcomeTitle: form.welcomeTitle || null,
      welcomeDescription: form.welcomeDescription || null,
      welcomeCtaText: form.welcomeCtaText || null,
      welcomeSubtext: form.welcomeSubtext || null,
      welcomeSubtextVisible: form.welcomeSubtextVisible,
      consentExtraText: form.consentExtraText || null,
      consentButtonText: form.consentButtonText || null,
      photoTitle: form.photoTitle || null,
      photoInstruction: form.photoInstruction || null,
      photoExtraText: form.photoExtraText || null,
      resultsShowBarrier: form.resultsShowBarrier,
      resultsShowConditions: form.resultsShowConditions,
      resultsShowConditionsDesc: form.resultsShowConditionsDesc,
      resultsShowSeverityBars: form.resultsShowSeverityBars,
      resultsShowActionPlan: form.resultsShowActionPlan,
      resultsShowTimeline: form.resultsShowTimeline,
      resultsShowAlertSigns: form.resultsShowAlertSigns,
      resultsShowProducts: form.resultsShowProducts,
      resultsShowServices: form.resultsShowServices,
      resultsShowMatchScore: form.resultsShowMatchScore,
      resultsShowPdfButton: form.resultsShowPdfButton,
      resultsShowPrices: form.resultsShowPrices,
      projectionEnabled: form.projectionEnabled,
      resultsTopMessage: form.resultsTopMessage || null,
      resultsFooterText: form.resultsFooterText || null,
      productCtaText: form.productCtaText || null,
      serviceCtaText: form.serviceCtaText || null,
      maxProductRecs:
        maxProducts != null && !isNaN(maxProducts) ? maxProducts : null,
      maxServiceRecs:
        maxServices != null && !isNaN(maxServices) ? maxServices : null,
    });
  }

  const score = calcScore(form);

  if (tenantQuery.isLoading) {
    return (
      <div className="p-8 text-pierre font-light text-sm">Carregando...</div>
    );
  }

  return (
    <div className="pb-24">
      {/* Sticky score bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-sable/20 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
              Score de Precisao
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`font-serif text-3xl ${scoreColor(score)}`}>
                {score}
              </span>
              <span className="text-xs text-pierre font-light">/ 100</span>
            </div>
          </div>
          <div className="w-40 h-0.5 bg-sable/30">
            <div
              className={`h-full transition-all duration-500 ${
                score >= 80
                  ? "bg-carbone"
                  : score >= 60
                  ? "bg-terre"
                  : "bg-red-700"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          {score < 80 && (
            <p className="text-xs text-terre font-light">
              {score < 60
                ? "Precisao significativamente reduzida"
                : "Precisao parcialmente reduzida"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <span className="text-sm text-pierre font-light">Salvo.</span>
          )}
          {updateMutation.error && (
            <span className="text-sm text-red-600 font-light">
              {updateMutation.error.message}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar configuracao"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex items-start gap-8 px-8">
        {/* ── LEFT COLUMN: config form (60%) ─────────────────────── */}
        <div className="flex-[3] min-w-0 max-w-2xl">
          <div className="pt-8">
            <h1 className="font-serif text-2xl text-carbone">
              Configuracao de Analise
            </h1>
            <p className="text-pierre text-sm font-light mt-1">
              Personalize o fluxo de analise e os resultados exibidos para seus clientes.
            </p>

            {/* Plan badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border border-sable/30 bg-ivoire">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Plano atual
              </p>
              <span className="text-[10px] text-carbone uppercase tracking-wider font-light">
                {plan === "growth" ? "Growth" : plan === "pro" ? "Pro" : "Enterprise"}
              </span>
            </div>

            {/* ── PRE-ANALISE ─────────────────────────────────────── */}
            <div className="mt-10">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Pre-Analise
              </p>
              <div className="h-px bg-sable/20 mt-2" />
            </div>

            {/* Welcome screen texts */}
            <Section
              title="Tela de Boas-vindas"
              description="Personalize os textos exibidos antes do cliente iniciar a analise."
            >
              <div className="p-5 bg-white border border-sable/20 space-y-4">
                <TextField
                  label="Titulo"
                  placeholder="Analise de Pele"
                  value={form.welcomeTitle}
                  onChange={(v) => set("welcomeTitle", v)}
                  hint="Padrao: Analise de Pele"
                />
                <TextField
                  label="Descricao"
                  placeholder="Descubra o tipo da sua pele e receba recomendacoes personalizadas..."
                  value={form.welcomeDescription}
                  onChange={(v) => set("welcomeDescription", v)}
                  multiline
                  hint="Deixe em branco para usar o texto padrao."
                />
                <TextField
                  label="Texto do botao de acao"
                  placeholder="Iniciar Analise"
                  value={form.welcomeCtaText}
                  onChange={(v) => set("welcomeCtaText", v)}
                />
                <div>
                  <TextField
                    label="Texto secundario"
                    placeholder="Gratuito e sem cadastro"
                    value={form.welcomeSubtext}
                    onChange={(v) => set("welcomeSubtext", v)}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-pierre font-light">
                      Exibir texto secundario abaixo do botao
                    </p>
                    <Toggle
                      checked={form.welcomeSubtextVisible}
                      onChange={(v) => set("welcomeSubtextVisible", v)}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Consent screen */}
            <Section
              title="Tela de Consentimento"
              description="Adicione texto extra ou personalize o botao de confirmacao."
            >
              <div className="p-5 bg-white border border-sable/20 space-y-4">
                <TextField
                  label="Texto adicional de consentimento"
                  placeholder="Informacoes especificas da sua clinica ou politica de privacidade..."
                  value={form.consentExtraText}
                  onChange={(v) => set("consentExtraText", v)}
                  multiline
                  hint="Exibido apos o texto de consentimento padrao da LGPD."
                />
                <TextField
                  label="Texto do botao de confirmacao"
                  placeholder="Concordo e continuar"
                  value={form.consentButtonText}
                  onChange={(v) => set("consentButtonText", v)}
                />
              </div>
            </Section>

            {/* Photo screen */}
            <Section
              title="Tela de Foto"
              description="Instrucoes exibidas ao cliente no momento da captura da foto."
            >
              <div className="p-5 bg-white border border-sable/20 space-y-4">
                <TextField
                  label="Titulo da tela de foto"
                  placeholder="Foto da Pele"
                  value={form.photoTitle}
                  onChange={(v) => set("photoTitle", v)}
                />
                <TextField
                  label="Instrucao principal"
                  placeholder="Posicione seu rosto no centro da camera..."
                  value={form.photoInstruction}
                  onChange={(v) => set("photoInstruction", v)}
                  multiline
                />
                <TextField
                  label="Texto adicional"
                  placeholder="Certifique-se de estar em um ambiente bem iluminado."
                  value={form.photoExtraText}
                  onChange={(v) => set("photoExtraText", v)}
                  multiline
                />
              </div>
            </Section>

            {/* Questionnaire toggles */}
            <Section
              title="Questionario"
              description="Controle quais perguntas sao exibidas durante a analise. Perguntas bloqueadas sao essenciais para o resultado."
            >
              <ToggleRow
                label="Tipo de pele"
                description="Como voce descreveria sua pele geralmente?"
                checked={true}
                onChange={() => {}}
                locked
              />
              <ToggleRow
                label="Preocupacoes"
                description="Quais sao suas principais preocupacoes?"
                checked={true}
                onChange={() => {}}
                locked
              />
              <ToggleRow
                label="Objetivo principal"
                description="Qual e seu principal objetivo com o tratamento?"
                checked={true}
                onChange={() => {}}
                locked
              />
              <ToggleRow
                label="Faixa etaria"
                description="Qual e a sua faixa etaria?"
                checked={true}
                onChange={() => {}}
                locked
              />
              <ToggleRow
                label="Alergias"
                description="Voce tem alguma alergia ou sensibilidade conhecida?"
                checked={form.questionAllergiesEnabled}
                onChange={(v) => set("questionAllergiesEnabled", v)}
                locked={isLocked("questionAllergiesEnabled")}
                lockReason={getLockReason("questionAllergiesEnabled")}
                warning="Sem esta informacao, a IA nao pode filtrar ingredientes alergenos. Risco de recomendacoes inadequadas. Score -8."
              />
              <ToggleRow
                label="Frequencia de protetor solar"
                description="Com que frequencia voce usa protetor solar?"
                checked={form.questionSunscreenEnabled}
                onChange={(v) => set("questionSunscreenEnabled", v)}
                locked={isLocked("questionSunscreenEnabled")}
                lockReason={getLockReason("questionSunscreenEnabled")}
                warning="Sem esta informacao, a analise de fotodano sera menos precisa. Score -5."
              />
              <ToggleRow
                label="Gravidez ou amamentacao"
                description="Esta gravida ou amamentando?"
                checked={form.questionPregnantEnabled}
                onChange={(v) => set("questionPregnantEnabled", v)}
                locked={isLocked("questionPregnantEnabled")}
                lockReason={getLockReason("questionPregnantEnabled")}
                warning="Sem esta informacao, a IA pode recomendar ativos contraindicados para gestantes. Score -12."
              />
            </Section>

            {/* Photo-only mode */}
            <Section title="Modo Somente Foto">
              <div className="p-5 bg-white border border-sable/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-carbone">Desativar questionario</p>
                      {isLocked("photoOnlyMode") && (
                        <span className="text-[10px] text-pierre uppercase tracking-wider font-light px-2 py-0.5 bg-ivoire border border-sable/20">
                          bloqueado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-pierre font-light mt-1">
                      Quando ativado, o cliente pula o questionario e a analise e baseada
                      apenas na foto. Recomendado apenas para demos rapidos.
                    </p>
                    {isLocked("photoOnlyMode") && (
                      <p className="text-xs text-pierre font-light mt-2 border-l-2 border-sable/40 pl-2">
                        {getLockReason("photoOnlyMode")}
                      </p>
                    )}
                    {form.photoOnlyMode && !isLocked("photoOnlyMode") && (
                      <div className="mt-3 p-3 bg-ivoire border border-sable/30">
                        <p className="text-xs text-terre font-light">
                          Atencao: o modo somente foto reduz significativamente a
                          qualidade das recomendacoes. A IA nao tera informacoes sobre
                          alergias, objetivos ou condicoes medicas do cliente.
                          Score -40.
                        </p>
                      </div>
                    )}
                  </div>
                  <Toggle
                    checked={form.photoOnlyMode}
                    onChange={(v) => set("photoOnlyMode", v)}
                    disabled={isLocked("photoOnlyMode")}
                  />
                </div>
              </div>
            </Section>

            {/* ── POS-ANALISE ─────────────────────────────────────── */}
            <div className="mt-12">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                Pos-Analise
              </p>
              <div className="h-px bg-sable/20 mt-2" />
            </div>

            {/* Tom da analise */}
            <Section
              title="Tom da analise"
              description="Define como a IA escreve o resultado para o paciente."
            >
              <div className="p-5 bg-white border border-sable/20 space-y-4">
                <div>
                  <label className="block text-xs text-pierre uppercase tracking-wider font-light mb-3">
                    Linguagem do diagnostico
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => set("analysisTone", "humanized")}
                      className={`text-left p-4 border transition-colors ${
                        form.analysisTone === "humanized"
                          ? "border-carbone bg-ivoire"
                          : "border-sable/30 bg-white hover:border-sable"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-carbone font-medium">Humanizada</span>
                        {form.analysisTone === "humanized" && (
                          <span className="text-[10px] text-carbone uppercase tracking-wider">Ativa</span>
                        )}
                      </div>
                      <p className="text-xs text-pierre font-light leading-relaxed">
                        Linguagem clara e acolhedora, como uma esteticista experiente conversando
                        com a cliente. Termos tecnicos sao traduzidos automaticamente
                        ("comedoes" vira "cravos pretos e brancos"). Recomendado para B2C.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => set("analysisTone", "technical")}
                      className={`text-left p-4 border transition-colors ${
                        form.analysisTone === "technical"
                          ? "border-carbone bg-ivoire"
                          : "border-sable/30 bg-white hover:border-sable"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-carbone font-medium">Tecnica</span>
                        {form.analysisTone === "technical" && (
                          <span className="text-[10px] text-carbone uppercase tracking-wider">Ativa</span>
                        )}
                      </div>
                      <p className="text-xs text-pierre font-light leading-relaxed">
                        Terminologia clinica completa para reforcar credibilidade medica.
                        Indicado para clinicas dermatologicas e centros que preferem
                        manter linguagem profissional no diagnostico.
                      </p>
                    </button>
                  </div>
                  <p className="text-xs text-pierre font-light mt-3">
                    Esta configuracao afeta os campos: resumo, descricao das condicoes,
                    plano de cuidado, observacoes por zona e sinais de alerta.
                    Nao afeta o motor de recomendacao nem a precisao do diagnostico.
                  </p>
                </div>
              </div>
            </Section>

            {/* Benchmark cross-tenant opt-in */}
            <Section
              title="Benchmark da plataforma"
              description="Compare seus indicadores com a media de outros clientes Skinner."
            >
              <div className="p-5 bg-white border border-sable/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-carbone font-medium mb-1">
                      Participar do benchmark anonimo
                    </p>
                    <p className="text-xs text-pierre font-light leading-relaxed">
                      Ao ativar, sua taxa de conversao, taxa de conclusao e ticket medio
                      sao agregados anonimamente com os de outros tenants opt-in. Voce
                      passa a ver a media da plataforma no seu dashboard. Nenhum
                      cliente jamais ve os dados individuais de outro — apenas a media
                      agregada. Minimo de 3 tenants opt-in para que qualquer numero
                      seja exibido.
                    </p>
                    <p className="text-[11px] text-pierre font-light mt-2 italic">
                      Voce pode desativar a qualquer momento. Off por padrao.
                    </p>
                  </div>
                  <Toggle
                    checked={form.benchmarkOptIn}
                    onChange={(v) => set("benchmarkOptIn", v)}
                  />
                </div>
              </div>
            </Section>

            {/* Results text */}
            <Section
              title="Textos dos Resultados"
              description="Mensagens personalizadas exibidas na tela de resultados."
            >
              <div className="p-5 bg-white border border-sable/20 space-y-4">
                <TextField
                  label="Mensagem no topo dos resultados"
                  placeholder="Sua analise esta pronta. Confira as recomendacoes personalizadas abaixo."
                  value={form.resultsTopMessage}
                  onChange={(v) => set("resultsTopMessage", v)}
                  multiline
                />
                <TextField
                  label="Texto de rodape dos resultados"
                  placeholder="Esta analise e informativa e nao substitui consulta medica."
                  value={form.resultsFooterText}
                  onChange={(v) => set("resultsFooterText", v)}
                  multiline
                />
                <TextField
                  label="Texto do botao de produto"
                  placeholder="Comprar"
                  value={form.productCtaText}
                  onChange={(v) => set("productCtaText", v)}
                  hint="Texto do botao de compra nos cards de produto."
                />
                <TextField
                  label="Texto do botao de servico"
                  placeholder="Agendar"
                  value={form.serviceCtaText}
                  onChange={(v) => set("serviceCtaText", v)}
                  hint="Texto do botao de agendamento nos cards de servico."
                />
              </div>
            </Section>

            {/* Results section toggles */}
            <Section
              title="Secoes Visiveis"
              description="Controle quais secoes sao exibidas na tela de resultados."
            >
              <ToggleRow
                label="Barreira cutanea"
                description="Exibe o status da barreira cutanea do cliente."
                checked={form.resultsShowBarrier}
                onChange={(v) => set("resultsShowBarrier", v)}
                locked={isLocked("resultsShowBarrier")}
                lockReason={getLockReason("resultsShowBarrier")}
              />
              <ToggleRow
                label="Condicoes identificadas"
                description="Exibe a lista de condicoes de pele encontradas."
                checked={form.resultsShowConditions}
                onChange={(v) => set("resultsShowConditions", v)}
                locked={isLocked("resultsShowConditions")}
                lockReason={getLockReason("resultsShowConditions")}
                warning="Ocultar condicoes reduz a transparencia da analise. Score -10."
              />
              <ToggleRow
                label="Descricao das condicoes"
                description="Exibe a descricao textual de cada condicao."
                checked={form.resultsShowConditionsDesc}
                onChange={(v) => set("resultsShowConditionsDesc", v)}
                locked={isLocked("resultsShowConditionsDesc")}
                lockReason={getLockReason("resultsShowConditionsDesc")}
              />
              <ToggleRow
                label="Barras de severidade"
                description="Exibe as barras de nivel de severidade das condicoes."
                checked={form.resultsShowSeverityBars}
                onChange={(v) => set("resultsShowSeverityBars", v)}
                locked={isLocked("resultsShowSeverityBars")}
                lockReason={getLockReason("resultsShowSeverityBars")}
              />
              <ToggleRow
                label="Plano de acao"
                description="Exibe o plano de tratamento em fases."
                checked={form.resultsShowActionPlan}
                onChange={(v) => set("resultsShowActionPlan", v)}
                locked={isLocked("resultsShowActionPlan")}
                lockReason={getLockReason("resultsShowActionPlan")}
                warning="Sem o plano de acao, o cliente nao tera orientacao sobre como aplicar os produtos. Score -7."
              />
              <ToggleRow
                label="Linha do tempo"
                description="Exibe a linha do tempo de evolucao esperada."
                checked={form.resultsShowTimeline}
                onChange={(v) => set("resultsShowTimeline", v)}
                locked={isLocked("resultsShowTimeline")}
                lockReason={getLockReason("resultsShowTimeline")}
              />
              <ToggleRow
                label="Sinais de alerta"
                description="Exibe os sinais que indicam necessidade de consulta medica."
                checked={form.resultsShowAlertSigns}
                onChange={(v) => set("resultsShowAlertSigns", v)}
                locked={isLocked("resultsShowAlertSigns")}
                lockReason={getLockReason("resultsShowAlertSigns")}
                warning="Ocultar sinais de alerta pode comprometer a seguranca do cliente. Score -15."
              />
              <ToggleRow
                label="Produtos recomendados"
                description="Exibe os produtos do catalogo recomendados pela IA."
                checked={form.resultsShowProducts}
                onChange={(v) => set("resultsShowProducts", v)}
                locked={isLocked("resultsShowProducts")}
                lockReason={getLockReason("resultsShowProducts")}
              />
              <ToggleRow
                label="Servicos recomendados"
                description="Exibe os servicos e tratamentos recomendados pela IA."
                checked={form.resultsShowServices}
                onChange={(v) => set("resultsShowServices", v)}
                locked={isLocked("resultsShowServices")}
                lockReason={getLockReason("resultsShowServices")}
              />
              <ToggleRow
                label="Score de compatibilidade"
                description="Exibe a porcentagem de compatibilidade de cada produto."
                checked={form.resultsShowMatchScore}
                onChange={(v) => set("resultsShowMatchScore", v)}
                locked={isLocked("resultsShowMatchScore")}
                lockReason={getLockReason("resultsShowMatchScore")}
              />
              <ToggleRow
                label="Botao de PDF"
                description="Exibe o botao para baixar o relatorio em PDF."
                checked={form.resultsShowPdfButton}
                onChange={(v) => set("resultsShowPdfButton", v)}
                locked={isLocked("resultsShowPdfButton")}
                lockReason={getLockReason("resultsShowPdfButton")}
              />
              <ToggleRow
                label="Precos"
                description="Exibe o preco dos produtos e servicos nos cards."
                checked={form.resultsShowPrices}
                onChange={(v) => set("resultsShowPrices", v)}
                locked={isLocked("resultsShowPrices")}
                lockReason={getLockReason("resultsShowPrices")}
              />
              <ToggleRow
                label="Projecao de resultado"
                description="Exibe o botao para gerar simulacao visual de evolucao da pele em 4, 8 e 12 semanas. Utiliza Gemini AI (~R$ 0,65 por uso)."
                checked={form.projectionEnabled}
                onChange={(v) => set("projectionEnabled", v)}
                locked={isLocked("projectionEnabled")}
                lockReason={getLockReason("projectionEnabled")}
              />
            </Section>

            {/* Limits */}
            <Section
              title="Limites de Recomendacao"
              description="Define o numero maximo de produtos e servicos exibidos nos resultados."
            >
              <div className="p-5 bg-white border border-sable/20 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                      Max. produtos
                    </label>
                    <select
                      value={form.maxProductRecs}
                      onChange={(e) => set("maxProductRecs", e.target.value)}
                      className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
                    >
                      <option value="">Sem limite</option>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                        <option key={n} value={String(n)}>
                          {n} {n === 1 ? "produto" : "produtos"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                      Max. servicos
                    </label>
                    <select
                      value={form.maxServiceRecs}
                      onChange={(e) => set("maxServiceRecs", e.target.value)}
                      className="w-full px-3 py-2 border border-sable/40 bg-white text-sm text-carbone font-light focus:outline-none focus:border-carbone"
                    >
                      <option value="">Sem limite</option>
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={String(n)}>
                          {n} {n === 1 ? "servico" : "servicos"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* Save button (bottom) */}
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar configuracao"}
              </button>
              {saved && (
                <span className="text-sm text-pierre font-light">Salvo.</span>
              )}
              {updateMutation.error && (
                <span className="text-sm text-red-600 font-light">
                  {updateMutation.error.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: live preview (fixed position) ─────────────── */}
        <div className="hidden lg:block" style={{ width: "320px", flexShrink: 0 }}>
          <div className="fixed" style={{ top: "10rem", width: "320px" }}>
            <LivePreview form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}
