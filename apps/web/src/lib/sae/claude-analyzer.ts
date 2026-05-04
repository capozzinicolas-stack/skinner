import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisInput, AnalysisOutput } from "./types";
import { db } from "@skinner/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Real Claude API analyzer that processes facial photos + questionnaire
 * using multimodal vision to provide clinical-grade skin analysis.
 */
export async function claudeAnalyze(input: AnalysisInput): Promise<AnalysisOutput> {
  // Load dermatological knowledge base
  const conditions = await db.skinCondition.findMany();
  const ingredients = await db.ingredient.findMany();

  // Load tenant config for custom instructions
  const tenantConfig = await db.tenantConfig.findFirst({
    where: { tenantId: input.tenantId },
  });

  // Load tenant for brand voice (lives on Tenant, not TenantConfig).
  // Truncated to 500 chars when injected so a verbose entry doesn't blow up
  // prompt size or cost.
  const tenant = await db.tenant.findUnique({
    where: { id: input.tenantId },
    select: { brandVoice: true },
  });
  const brandVoiceRaw = (tenant?.brandVoice ?? "").trim();
  const brandVoice = brandVoiceRaw.length > 500
    ? brandVoiceRaw.slice(0, 500)
    : brandVoiceRaw;

  // Load global platform rules
  const platformConfig = await db.platformConfig.findUnique({
    where: { id: "default" },
  });

  const conditionsKB = conditions
    .map(
      (c) =>
        `- ${c.name} (${c.displayName}): ${c.description}. Severidade 1: ${c.severity1Desc ?? "leve"}. Severidade 2: ${c.severity2Desc ?? "moderada"}. Severidade 3: ${c.severity3Desc ?? "severa"}.`
    )
    .join("\n");

  const ingredientsKB = ingredients
    .map((i) => `- ${i.name} (${i.displayName}): ${i.description ?? ""}`)
    .join("\n");

  const q = input.questionnaire;
  const concerns = Array.isArray(q.concerns) ? q.concerns : [];

  // Tone configuration — controls how patient-facing fields are written.
  // "humanized" (default) → warm, accessible, jargon translated.
  // "technical" → full clinical terminology (for B2B clinics that prefer medical credibility).
  const tone = tenantConfig?.analysisTone === "technical" ? "technical" : "humanized";

  const toneBlock =
    tone === "humanized"
      ? `
TOM E LINGUAGEM DO PACIENTE (CRITICO):
- Voce esta escrevendo PARA O PACIENTE, nao para outro medico. Imagine uma esteticista experiente conversando com a sua cliente: profissional, mas humana e acolhedora.
- Use linguagem clara, simples e calorosa em TODOS os campos visiveis ao paciente: "summary", "conditions[].description", "skin_type_discrepancy", "action_plan.phaseN", "timeline.weeksN", "alert_signs", "zone_annotations[].observation".
- EVITE jerga clinica nestes campos. NUNCA escreva diretamente: "comedoes", "papulas", "pustulas", "eritema", "telangiectasias", "TEWL", "ptose", "lentigos", "hiperqueratinizacao", "atrofia", "ceratose", "lichenificadas", "Cutibacterium acnes", "Malassezia", "metaloproteinases", "MMPs", "fototipos", "vermelhao labial", "subcorneal", "subtipos eritematotelangectasica", "compartimentos de Rohrich", "ICDermAtroD", nomes em latim, abreviaturas medicas, etc.
- Em vez disso TRADUZA automaticamente:
  - "comedoes abertos" → "cravos pretos"
  - "comedoes fechados" → "cravos brancos"
  - "papulas e pustulas" → "espinhas e pequenas inflamacoes"
  - "eritema persistente" → "vermelhidao que nao passa"
  - "telangiectasias" → "vasinhos visiveis"
  - "ptose tecidual" / "flacidez" → "perda de firmeza"
  - "lentigos solares" → "manchas causadas pelo sol"
  - "hiperpigmentacao pos-inflamatoria" → "marcas escuras deixadas por espinhas ou irritacoes"
  - "barreira cutanea comprometida" → "pele enfraquecida que perde agua e fica mais sensivel"
  - "fitzpatrick" → "tom de pele" (use linguagem comum, nao mencione classificacao)
  - "Malassezia" / "Cutibacterium acnes" → "fungo natural da pele" / "bacteria que causa acne"
  - "ativos" / "principios ativos" → "ingredientes que tratam"
  - "retinoides" → "derivados de vitamina A"
  - "AHA" / "BHA" / "PHA" → "acidos esfoliantes" (explique brevemente quando relevante)
- Se PRECISAR usar um termo tecnico, explique entre parenteses na primeira mencao: por exemplo "rosacea (uma condicao com vermelhidao e vasinhos visiveis no rosto)".
- No "action_plan" e "timeline": escreva o que o paciente VAI FAZER e VAI NOTAR, nao a quimica por tras. Em vez de "aplicar acido salicilico 2% em dias alternados com niacinamida 5%", escreva "use seu serum de tratamento (com acido salicilico) em dias alternados, comecando 3x por semana e aumentando conforme sua pele aceita".
- "alert_signs": escreva como sinais que a pessoa pode RECONHECER no espelho ou no toque, nao em termos clinicos. Em vez de "lesoes nodulocisticas que nao regridem em 14 dias", escreva "espinhas profundas e doloridas que nao melhoram em 2 semanas".
- "summary": 3-4 frases conversacionais que digam o que voce viu, como esta a saude geral da pele, e qual e o caminho de tratamento. Tom positivo mas honesto.
- "conditions[].description": 2-3 frases que expliquem O QUE o paciente esta vendo na pele, POR QUE acontece (em linguagem comum), e UMA pista de tratamento. Evite descricoes clinicas longas.
- "zone_annotations[].observation": 1-2 frases simples por zona, descrevendo o que o paciente percebe ao se olhar.
- O campo "name" das condicoes deve continuar a usar o ID exato da base de conhecimento (e usado pelo motor para casar com produtos). NAO traduza esse campo.
`
      : `
TOM TECNICO/CLINICO:
- Este tenant prefere linguagem clinica completa, para reforcar credibilidade medica.
- Use terminologia dermatologica precisa em todos os campos visiveis ao paciente.
- Mantenha o tom profissional mas acolhedor — preciso, nao alarmista.
`;

  const systemPrompt = `Voce e um dermatologista especialista em analise facial e dermocosmeticos. Voce trabalha para a plataforma Skinner, que fornece analise de pele baseada em IA para clinicas, laboratorios e farmacias no Brasil.

Sua tarefa e analisar a foto facial do paciente junto com as respostas do questionario para fornecer um diagnostico dermatologico preciso e um plano de tratamento personalizado.

BASE DE CONHECIMENTO DERMATOLOGICO:

CONDICOES CONHECIDAS:
${conditionsKB}

INGREDIENTES ATIVOS CONHECIDOS:
${ingredientsKB}
${toneBlock}
REGRAS:
1. Analise a foto com atencao: textura, poros, manchas, vermelhidao, oleosidade, linhas, firmeza, tom de pele
2. Cruze o que voce ve na foto com as respostas do questionario
3. Identifique TODAS as condicoes visiveis, nao apenas as que o paciente reportou
4. Atribua severidade (1-3) baseada no que voce observa na foto
5. Avalie o estado da barreira cutanea
6. Estime o fototipo Fitzpatrick pela foto (use no campo "fitzpatrick", mas NAO mencione esse termo no summary ou em campos visiveis ao paciente quando o tom for humanizado)
7. Crie um plano de acao em 3 fases progressivas
8. Seja honesto mas acolhedor - nao alarme, mas nao minimize
9. Se detectar algo que requer atencao medica, indique claramente
10. Todas as respostas devem ser em portugues brasileiro
11. Para zone_annotations: analise CADA zona facial individualmente. Inclua pelo menos 5 zonas. Use "good" para areas saudaveis, "attention" para areas com leve preocupacao, "concern" para areas que precisam de tratamento. Sempre inclua pelo menos 1-2 zonas "good" para equilibrar o diagnostico.
12. DISCREPANCIA DE TIPO DE PELE: Compare o tipo de pele que o paciente auto-relatou com o que voce observa na foto. Se forem diferentes, preencha "skin_type_self_reported" com o tipo que o paciente disse e "skin_type_discrepancy" com uma explicacao gentil e educativa de por que sua observacao profissional difere da percepcao do paciente. Se forem iguais, deixe esses campos como null.
${platformConfig?.analysisGlobalRules ? `\nREGRAS GLOBAIS DA PLATAFORMA:\n${platformConfig.analysisGlobalRules}` : ""}
${platformConfig?.analysisRestrictedConditions ? `\nCONDICOES RESTRITAS GLOBALMENTE (NAO MENCIONAR): ${platformConfig.analysisRestrictedConditions}` : ""}
${tenantConfig?.customPromptSuffix ? `\nINSTRUCOES ADICIONAIS DO CLIENTE: ${tenantConfig.customPromptSuffix}` : ""}
${tenantConfig?.restrictedConditions ? `\nCONDICOES RESTRITAS PELO CLIENTE (NAO MENCIONAR): ${tenantConfig.restrictedConditions}` : ""}
${brandVoice ? `\nVOZ DE MARCA DA CLINICA (use como inspiracao adicional ao escrever os campos voltados ao paciente, mantendo as regras de seguranca clinica e o tom configurado acima): ${brandVoice}` : ""}`;

  const userPrompt = `QUESTIONARIO DO PACIENTE:
- Tipo de pele auto-relatado: ${q.skin_type ?? "nao informado"}
- Preocupacoes principais: ${concerns.join(", ") || "nenhuma selecionada"}
- Objetivo principal: ${q.primary_objective ?? "nao informado"}
- Alergias/sensibilidades: ${q.allergies || "nenhuma relatada"}
- Faixa etaria: ${q.age_range ?? "nao informada"}
- Uso de protetor solar: ${q.sunscreen_frequency || "nao informado"}
- Gestante/amamentando: ${q.pregnant_or_nursing || "nao"}

Analise a foto facial acima junto com o questionario e retorne um JSON com EXATAMENTE esta estrutura (sem markdown, sem code blocks, apenas o JSON puro):

{
  "skin_type": "oily|dry|combination|normal|sensitive",
  "skin_type_self_reported": "tipo que o paciente informou, ou null se igual ao detectado",
  "skin_type_discrepancy": "Explicacao gentil da diferenca entre percepcao e observacao, ou null se iguais",
  "conditions": [
    {
      "name": "nome_da_condicao (use os nomes exatos da base de conhecimento)",
      "severity": 1,
      "description": "Descricao clinica detalhada do que foi observado na foto, em 2-3 frases"
    }
  ],
  "barrier_status": "healthy|compromised|needs_attention",
  "fitzpatrick": "I|II|III|IV|V|VI",
  "primary_objective": "objetivo principal do paciente",
  "summary": "Resumo geral de 3-4 frases sobre o estado da pele, incluindo tipo, condicoes principais e estado da barreira. Tom profissional e acolhedor.",
  "action_plan": {
    "phase1": "Semanas 1-2: Descricao detalhada do que fazer nesta fase inicial. Incluir passos especificos.",
    "phase2": "Semanas 3-8: Descricao da fase de introducao de ativos. Quais ingredientes, como introduzir.",
    "phase3": "Mes 3+: Descricao da fase de otimizacao e manutencao."
  },
  "alert_signs": ["Lista de sinais que indicam necessidade de consulta presencial com dermatologista"],
  "timeline": {
    "weeks4": "O que esperar em 4 semanas de tratamento",
    "weeks8": "O que esperar em 8 semanas",
    "weeks12": "O que esperar em 12 semanas"
  },
  "zone_annotations": [
    {
      "zone": "forehead|left_cheek|right_cheek|nose|chin|under_eyes|jawline",
      "status": "good|attention|concern",
      "title": "Titulo curto em portugues",
      "observation": "1-2 frases sobre o que foi observado nesta zona",
      "related_conditions": ["nomes das condicoes"]
    }
  ]
}`;

  // Extract base64 data and media type from the data URL
  const base64Match = input.photoBase64.match(
    /^data:(image\/\w+);base64,(.+)$/
  );

  let imageData: string;
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  if (base64Match) {
    mediaType = base64Match[1] as typeof mediaType;
    imageData = base64Match[2];
  } else {
    // Assume raw base64 JPEG if no data URL prefix
    mediaType = "image/jpeg";
    imageData = input.photoBase64;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageData,
            },
          },
          {
            type: "text",
            text: userPrompt,
          },
        ],
      },
    ],
    system: systemPrompt,
  });

  // Extract text content from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return text response");
  }

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as AnalysisOutput;

  // Validate required fields
  if (!parsed.skin_type || !parsed.conditions || !parsed.summary) {
    throw new Error("Claude response missing required fields");
  }

  // Ensure zone_annotations is always an array (graceful degradation if Claude omits it)
  if (!parsed.zone_annotations) {
    parsed.zone_annotations = [];
  }

  return parsed;
}
