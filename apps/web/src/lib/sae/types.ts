export type AnalysisInput = {
  tenantId: string;
  photoBase64: string;
  questionnaire: {
    skin_type: string;
    concerns: string[];
    primary_objective: string;
    allergies: string;
    age_range: string;
    sunscreen_frequency: string;
    pregnant_or_nursing: string;
  };
};

export type AnalysisOutput = {
  skin_type: string;
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
};

export type FullAnalysisResult = {
  analysisId: string;
  analysis: AnalysisOutput;
  recommendations: MatchedProduct[];
  latencyMs: number;
};
