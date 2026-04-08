import type { AnalysisInput, AnalysisOutput, ZoneAnnotation } from "./types";

/**
 * Mock analyzer that simulates Claude API responses.
 * Replace with real Claude call when API key is available.
 */
export async function mockAnalyze(input: AnalysisInput): Promise<AnalysisOutput> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

  const { questionnaire: q } = input;
  const concerns = q.concerns ?? [];
  const isPregnant = q.pregnant_or_nursing === "pregnant" || q.pregnant_or_nursing === "nursing";

  // Build conditions from questionnaire
  const conditionMap: Record<string, { severity: number; description: string }> = {
    acne: {
      severity: 2,
      description: "Comedões e pápulas moderadas detectados na zona T e bochechas. Pele apresenta poros obstruídos e oleosidade na região frontal.",
    },
    hyperpigmentation: {
      severity: 1,
      description: "Manchas leves pós-inflamatórias e lentigos solares detectados nas maçãs do rosto. Pigmentação irregular na região periorbital.",
    },
    aging: {
      severity: q.age_range === "45-54" || q.age_range === "55+" ? 2 : 1,
      description: "Linhas finas ao redor dos olhos e boca. Perda leve de firmeza na região do contorno facial.",
    },
    dehydration: {
      severity: 2,
      description: "Barreira cutânea parcialmente comprometida. Pele apresenta textura áspera e falta de luminosidade, indicando desidratação trans-epidérmica.",
    },
    sensitivity: {
      severity: 1,
      description: "Leve vermelhidão nas bochechas e nariz. Pele reativa com sinais de inflamação subclínica.",
    },
    rosacea: {
      severity: 2,
      description: "Eritema persistente na zona central do rosto com telangiectasias visíveis. Possível rosácea subtipo eritematotelangectásica.",
    },
    pores: {
      severity: 1,
      description: "Poros dilatados na zona T, especialmente na região do nariz e bochechas adjacentes.",
    },
    dullness: {
      severity: 1,
      description: "Pele sem luminosidade com acúmulo de células mortas na superfície. Tonalidade irregular.",
    },
    dark_circles: {
      severity: 1,
      description: "Hiperpigmentação periorbital leve, possivelmente de origem vascular e hereditária.",
    },
    oiliness: {
      severity: q.skin_type === "oily" ? 2 : 1,
      description: "Produção sebácea elevada na zona T. Brilho excessivo notável na testa e nariz.",
    },
  };

  const conditions = concerns
    .filter((c) => conditionMap[c])
    .map((c) => ({
      name: c,
      severity: conditionMap[c].severity,
      description: conditionMap[c].description,
    }));

  // If no concerns selected, add a default mild one
  if (conditions.length === 0) {
    conditions.push({
      name: "dehydration",
      severity: 1,
      description: "Pele com leve desidratação. Barreira cutânea saudável mas poderia se beneficiar de hidratação adicional.",
    });
  }

  const hasSevere = conditions.some((c) => c.severity >= 3);
  const barrierStatus = conditions.some(
    (c) => c.name === "dehydration" && c.severity >= 2
  )
    ? "compromised"
    : conditions.some((c) => c.name === "sensitivity" || c.name === "rosacea")
    ? "needs_attention"
    : "healthy";

  const fitzpatrick =
    q.skin_type === "sensitive"
      ? "II"
      : q.age_range === "55+"
      ? "III"
      : "III";

  const summary = `Sua pele é do tipo ${
    {
      oily: "oleosa",
      dry: "seca",
      combination: "mista",
      normal: "normal",
      sensitive: "sensível",
    }[q.skin_type] ?? q.skin_type
  }. Foram identificadas ${conditions.length} condição(ões): ${conditions
    .map((c) => c.name)
    .join(", ")}. ${
    barrierStatus === "healthy"
      ? "Sua barreira cutânea está saudável."
      : barrierStatus === "compromised"
      ? "Sua barreira cutânea está comprometida e precisa de atenção."
      : "Sua barreira cutânea precisa de atenção."
  }${isPregnant ? " Recomendações ajustadas para gestação/amamentação." : ""}`;

  const alertSigns = [
    "Lesões que mudam de cor, formato ou sangram",
    "Vermelhidão intensa que não melhora em 2 semanas",
    "Dor ou ardência persistente",
  ];
  if (hasSevere) {
    alertSigns.unshift(
      "Condição severa detectada — recomendamos consulta com dermatologista"
    );
  }

  // Build zone annotations based on questionnaire concerns
  const hasAcne = concerns.includes("acne");
  const hasOiliness = concerns.includes("oiliness") || q.skin_type === "oily";
  const hasDarkCircles = concerns.includes("dark_circles");
  const hasSensitivity = concerns.includes("sensitivity") || concerns.includes("rosacea");
  const hasAging = concerns.includes("aging");
  const hasPores = concerns.includes("pores");

  const zone_annotations: ZoneAnnotation[] = [
    // Forehead: attention for oiliness/acne, good otherwise
    {
      zone: "forehead",
      status: hasOiliness || hasAcne ? "attention" : "good",
      title: hasOiliness || hasAcne ? "Oleosidade moderada" : "Textura uniforme",
      observation: hasOiliness || hasAcne
        ? "Poros levemente dilatados e produção sebácea elevada na região frontal. Zona T ativa."
        : "Região frontal com textura equilibrada e hidratação adequada.",
      related_conditions: hasOiliness || hasAcne ? ["oiliness", "acne"].filter(c => concerns.includes(c) || (c === "oiliness" && q.skin_type === "oily")) : [],
    },
    // Nose: concern for acne/pores, attention for oiliness
    {
      zone: "nose",
      status: hasAcne || hasPores ? "concern" : hasOiliness ? "attention" : "good",
      title: hasAcne || hasPores ? "Poros obstruídos" : hasOiliness ? "Oleosidade central" : "Sem alterações",
      observation: hasAcne || hasPores
        ? "Cravos e poros obstruídos visíveis na asa nasal e ponta do nariz. Área de maior produção sebácea."
        : hasOiliness
        ? "Produção sebácea moderada na região nasal. Limpeza regular recomendada."
        : "Região nasal sem alterações significativas.",
      related_conditions: [hasAcne ? "acne" : null, hasPores ? "pores" : null].filter(Boolean) as string[],
    },
    // Under eyes: attention for dark circles or aging
    {
      zone: "under_eyes",
      status: hasDarkCircles || hasAging ? "attention" : "good",
      title: hasDarkCircles ? "Olheiras presentes" : hasAging ? "Linhas finas" : "Área periorbital saudável",
      observation: hasDarkCircles
        ? "Hiperpigmentação periorbital de origem mista (vascular e pigmentar). Pele fina e delicada."
        : hasAging
        ? "Linhas finas ao redor dos olhos. Perda de volume periorbital sutil."
        : "Região periorbital sem alterações relevantes. Hidratação adequada.",
      related_conditions: [hasDarkCircles ? "dark_circles" : null, hasAging ? "aging" : null].filter(Boolean) as string[],
    },
    // Left cheek: concern for sensitivity/rosacea, attention for hyperpigmentation
    {
      zone: "left_cheek",
      status: hasSensitivity ? "concern" : concerns.includes("hyperpigmentation") ? "attention" : "good",
      title: hasSensitivity ? "Eritema localizado" : concerns.includes("hyperpigmentation") ? "Manchas leves" : "Tonalidade equilibrada",
      observation: hasSensitivity
        ? "Vermelhidão persistente e vasos dilatados visíveis. Pele reativa ao toque e a variações de temperatura."
        : concerns.includes("hyperpigmentation")
        ? "Manchas pós-inflamatórias leves. Pigmentação irregular na região malar."
        : "Bochecha esquerda com hidratação e tonalidade dentro do esperado.",
      related_conditions: hasSensitivity ? ["sensitivity", "rosacea"].filter(c => concerns.includes(c)) : concerns.includes("hyperpigmentation") ? ["hyperpigmentation"] : [],
    },
    // Right cheek: mirror of left cheek with slight variation
    {
      zone: "right_cheek",
      status: hasSensitivity ? "concern" : "good",
      title: hasSensitivity ? "Eritema leve" : "Região equilibrada",
      observation: hasSensitivity
        ? "Leve eritema difuso. Pele com baixo limiar de irritação, sensível a ativos fortes."
        : "Bochecha direita sem alterações significativas. Barreira cutânea íntegra.",
      related_conditions: hasSensitivity ? ["sensitivity"].filter(c => concerns.includes(c)) : [],
    },
    // Chin: concern for acne, attention for oiliness
    {
      zone: "chin",
      status: hasAcne ? "concern" : hasOiliness ? "attention" : "good",
      title: hasAcne ? "Acne hormonal" : hasOiliness ? "Oleosidade elevada" : "Região estável",
      observation: hasAcne
        ? "Pápulas e comedões concentrados na região do queixo. Padrão sugestivo de acne hormonal."
        : hasOiliness
        ? "Excesso de sebo na região do mento. Poros levemente visíveis."
        : "Região mentual sem lesões ativas ou alterações relevantes.",
      related_conditions: hasAcne ? ["acne"] : [],
    },
    // Jawline: attention for aging/acne, good otherwise
    {
      zone: "jawline",
      status: hasAging || hasAcne ? "attention" : "good",
      title: hasAging ? "Perda de contorno" : hasAcne ? "Lesões no contorno" : "Contorno definido",
      observation: hasAging
        ? "Leve perda de definição mandibular. Diminuição da firmeza ao longo do contorno facial."
        : hasAcne
        ? "Lesões esparsas ao longo da linha mandibular. Associação com acne hormonal possível."
        : "Linha mandibular bem definida sem alterações relevantes.",
      related_conditions: hasAging ? ["aging"] : hasAcne ? ["acne"] : [],
    },
  ];

  return {
    skin_type: q.skin_type,
    conditions,
    barrier_status: barrierStatus,
    fitzpatrick,
    primary_objective: q.primary_objective,
    summary,
    action_plan: {
      phase1:
        "Semanas 1-2: Simplificar a rotina. Limpeza suave + hidratante + protetor solar. Não introduzir ativos fortes ainda.",
      phase2:
        "Semanas 3-8: Introduzir ativos gradualmente. Começar com concentrações baixas, dias alternados. Monitorar tolerância.",
      phase3:
        "Mês 3+: Otimizar a rotina. Aumentar frequência dos ativos conforme tolerância. Avaliar resultados e ajustar.",
    },
    alert_signs: alertSigns,
    timeline: {
      weeks4:
        "Melhora na textura e hidratação. Redução da oleosidade e primeiros sinais de uniformização do tom.",
      weeks8:
        "Redução visível de manchas e inflamação. Pele mais firme e luminosa. Poros menos aparentes.",
      weeks12:
        "Resultados consolidados. Pele equilibrada e saudável. Manutenção com rotina otimizada.",
    },
    zone_annotations,
  };
}
