export type AnalysisInput = {
  tenantId: string;
  photoBase64: string;
  questionnaire: {
    sex: string;
    skin_type: string;
    concerns: string[];
    primary_objective: string;
    allergies: string;
    age_range: string;
    sunscreen_frequency: string;
    pregnant_or_nursing: string;
  };
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
};

export type FullAnalysisResult = {
  analysisId: string;
  kitLink: string;
  analysis: AnalysisOutput;
  recommendations: MatchedProduct[];
  latencyMs: number;
  photoBase64?: string;
};
