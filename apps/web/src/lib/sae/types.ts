import type { VisibleSign } from "./visible-signs";

export type AnalysisInput = {
  tenantId: string;
  photoBase64: string;
  questionnaire: Record<string, string | string[]>;
  // Locale for patient-facing output text (summary, conditions[].description,
  // action_plan, alert_signs, etc.). Default pt-BR. Resolved by analysis.run
  // from channel.overrides.locale → tenant.defaultLocale → "pt-BR".
  // The KB IDs (conditions[].name) are NEVER translated — they're identifiers
  // used by the matcher.
  locale?: "pt-BR" | "es" | "en";
  // Tenant.segment. "aesthetic_clinic" makes Claude frame the action plan
  // and timeline around in-clinic procedures (see claude-analyzer.ts).
  segment?: string;
};

export type FaceZone =
  | "forehead"
  | "left_cheek"
  | "right_cheek"
  | "nose"
  | "chin"
  | "under_eyes"
  | "jawline";

export type ZoneStatus = "good" | "attention" | "concern";

export type ZoneAnnotation = {
  zone: FaceZone;
  status: ZoneStatus;
  title: string;
  observation: string;
  related_conditions: string[];
};

export type AnalysisOutput = {
  skin_type: string;
  skin_type_self_reported?: string;
  skin_type_discrepancy?: string;
  conditions: { name: string; severity: number; description: string }[];
  barrier_status: "healthy" | "compromised" | "needs_attention";
  fitzpatrick: string;
  primary_objective: string;
  summary: string;
  action_plan: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
  alert_signs: string[];
  timeline: {
    weeks4: string;
    weeks8: string;
    weeks12: string;
  };
  zone_annotations: ZoneAnnotation[];
  // Procedure clinics: procedure names Claude chose (clinic catalog only), in
  // priority order. The matcher recommends these first.
  recommended_procedures?: string[];
  // Procedure clinics (Nov-2026): concrete localized signs seen in the photo,
  // graded 0–4. Internal (English descriptions), never rendered — the skin
  // projection uses them as per-sign targets. See lib/sae/visible-signs.ts.
  visible_signs?: VisibleSign[];
  // Procedure clinics: glasses hide the glabella and eye area, so the
  // projection asks the patient to retake the photo without them.
  photo_has_glasses?: boolean;
};

export type MatchedProduct = {
  productId: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  ecommerceLink: string | null;
  stepRoutine: string | null;
  useTime: string;
  matchScore: number;
  reason: string;
  howToUse: string;
  type: string;
  bookingLink: string | null;
  sessionCount: number | null;
  sessionFrequency: string | null;
  durationMinutes: number | null;
  recommendationTag: "recomendado" | "alternativa";
  activeIngredients: string[];
  // Procedure-clinic fields (Oct-2026). Optional: absent for products and for
  // analyses persisted before the segment feature.
  serviceCategory?: string | null;
  concernTags?: string[];
  addOns?: { name: string; description?: string; price?: number }[];
  projectionOnsetWeeks?: number | null;
  projectionPeakWeeks?: number | null;
  projectionImprovementPct?: number | null;
};

export type FullAnalysisResult = {
  analysisId: string;
  kitLink: string;
  analysis: AnalysisOutput;
  recommendations: MatchedProduct[];
  latencyMs: number;
  photoBase64?: string;
};
