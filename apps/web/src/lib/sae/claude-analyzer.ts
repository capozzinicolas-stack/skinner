import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AnalysisInput, AnalysisOutput } from "./types";
import { db } from "@skinner/db";

// Timeout below the 60s Vercel function limit (api/trpc maxDuration) so a
// slow call fails inside the handler (→ fallback) instead of surfacing as an
// infrastructure 504. One retry covers transient 429/5xx.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 50_000,
  maxRetries: 1,
});

// Structured output schema (mirrors AnalysisOutput). The API guarantees the
// response matches it, so a stray quote or missing comma in Portuguese text
// can no longer break JSON.parse and silently drop the patient to the mock.
// Condition names are restricted to the knowledge-base IDs (built per request
// from the KB) so Claude can never invent one (e.g. a face-zone name).
// For procedure clinics, `recommended_procedures` is restricted to the clinic's
// own active procedure names: Claude (who sees the photo and writes the plan)
// picks them in priority order, so plan and recommendation cards agree.
function buildAnalysisSchema(
  conditionNames: [string, ...string[]],
  procedureNames: string[] | null
) {
  const base = z.object({
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive"]),
  skin_type_self_reported: z.string().nullable(),
  skin_type_discrepancy: z.string().nullable(),
  conditions: z.array(
    z.object({
      name: z.enum(conditionNames),
      severity: z.number().int(),
      description: z.string(),
    })
  ),
  barrier_status: z.enum(["healthy", "compromised", "needs_attention"]),
  fitzpatrick: z.string(),
  primary_objective: z.string(),
  summary: z.string(),
  action_plan: z.object({ phase1: z.string(), phase2: z.string(), phase3: z.string() }),
  alert_signs: z.array(z.string()),
  timeline: z.object({ weeks4: z.string(), weeks8: z.string(), weeks12: z.string() }),
  zone_annotations: z.array(
    z.object({
      zone: z.enum(["forehead", "left_cheek", "right_cheek", "nose", "chin", "under_eyes", "jawline"]),
      status: z.enum(["good", "attention", "concern"]),
      title: z.string(),
      observation: z.string(),
      related_conditions: z.array(z.enum(conditionNames)),
    })
  ),
  });
  if (procedureNames && procedureNames.length > 0) {
    return base.extend({
      recommended_procedures: z.array(z.enum(procedureNames as [string, ...string[]])),
    });
  }
  return base;
}

// Model is configurable so a retirement never silently breaks analyses again
// (Oct-2026: claude-sonnet-4-20250514 started returning 404 and every
// analysis fell back to the mock). Default = current Sonnet generation.
const ANALYSIS_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

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

  // Locale for patient-facing output. Defaults to pt-BR. Caller resolves it
  // from the channel/tenant before passing in. The prompt (rules, KB,
  // toneBlock) stays in pt-BR — we add an explicit final directive telling
  // Claude to write the OUTPUT fields in the requested language. Validated
  // approach for changing output language without retranslating the prompt.
  const locale = input.locale ?? "pt-BR";
  const localeName =
    locale === "es"
      ? "espanol (Espana / America Latina)"
      : locale === "en"
        ? "English (US)"
        : "portugues brasileiro";

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

  // Procedure clinics (Tenant.segment = "aesthetic_clinic"): the plan is a
  // protocol of in-clinic procedures, home care is only a complement. The
  // clinic's own active procedures are listed so Claude references real
  // offerings by name instead of generic skincare steps.
  // What the clinic recommends (/dashboard/analise). The written plan must
  // not promise what the patient will not receive.
  const recommendsServices = tenantConfig?.resultsShowServices ?? true;
  const recommendsProducts = tenantConfig?.resultsShowProducts ?? true;
  const scopeBlock = !recommendsProducts
    ? `
ESCOPO DA RECOMENDACAO: esta clinica recomenda APENAS tratamentos e procedimentos. No plano de acao e na timeline, nao indique produtos para comprar; cuidados em casa so como orientacoes gerais (por exemplo protetor solar diario e hidratacao).
`
    : !recommendsServices
      ? `
ESCOPO DA RECOMENDACAO: esta clinica recomenda APENAS produtos de uso em casa. No plano de acao e na timeline, nao indique procedimentos ou tratamentos de clinica.
`
      : "";

  let clinicBlock = "";
  let clinicProcedureNames: string[] | null = null;
  const maxProcedures = Math.min(Math.max(tenantConfig?.maxServiceRecs ?? 2, 1), 10);
  if (input.segment === "aesthetic_clinic" && recommendsServices) {
    const procedures = await db.product.findMany({
      where: { tenantId: input.tenantId, isActive: true, type: "service" },
      select: { name: true },
      orderBy: { priorityRank: "desc" },
      take: 60,
    });
    const procedureList = procedures.map((p) => p.name).join("; ");
    clinicProcedureNames = procedures.length > 0 ? Array.from(new Set(procedures.map((p) => p.name))) : null;
    clinicBlock = `
CONTEXTO: CLINICA DE PROCEDIMENTOS ESTETICOS (CRITICO):
- Este paciente esta sendo avaliado por uma clinica de procedimentos esteticos. O plano deve ser orientado a PROCEDIMENTOS realizados na clinica. Cuidados em casa entram apenas como complemento que potencializa e mantem o resultado.
- "action_plan.phase1": avaliacao presencial e os primeiros procedimentos indicados para a queixa principal.
- "action_plan.phase2": sessoes seguintes e procedimentos complementares que potencializam o resultado.
- "action_plan.phase3": manutencao (frequencia de retorno a clinica) e cuidados em casa.
- "timeline.weeks4/weeks8/weeks12": descreva o que o paciente vai notar de acordo com o tempo de resposta tipico de cada tipo de procedimento (injetaveis mostram resultado em dias ou poucas semanas; bioestimuladores, ultrassom microfocado, radiofrequencia e lasers evoluem ao longo de meses).
${procedureList ? `- Procedimentos que esta clinica oferece: ${procedureList}. Cite-os pelo nome quando fizer sentido. NUNCA cite procedimentos fora desta lista.
- "recommended_procedures": escolha de 1 a ${maxProcedures} procedimentos desta lista, em ordem de prioridade para este paciente, usando o nome exato. Devem ser os mesmos que voce indica no plano de acao (comece pela queixa principal). Respeite contraindicacoes como gravidez e amamentacao.` : ""}
- Nao prometa resultados, nao cite precos e nao recomende marcas de produtos.
- As condicoes "acne_scars" (cicatrizes de acne) e "texture" (textura irregular) existem na base: use-as quando observar cicatrizes de acne ou textura irregular e poros aparentes.
- Para "conditions[].name" prefira os IDs simples, os mesmos do questionario: aging (rugas e linhas), sagging (flacidez), hyperpigmentation (manchas, inclusive manchas solares), dark_circles (olheiras), texture, acne, acne_scars, dullness, dehydration, sensitivity, rosacea, pores, oiliness. Use um ID clinico apenas quando ele for mais preciso: "melasma" so para melasma, "hiperpigmentacao_pos_inflamatoria" so para marcas deixadas por espinhas ou inflamacoes, nunca para manchas de sol.
- "primary_objective": devolva exatamente o valor informado no questionario.
`;
  }

  const systemPrompt = `Voce e um dermatologista especialista em analise facial e dermocosmeticos. Voce trabalha para a plataforma Skinner, que fornece analise de pele baseada em IA para clinicas, laboratorios e farmacias no Brasil.

Sua tarefa e analisar a foto facial do paciente junto com as respostas do questionario para fornecer um diagnostico dermatologico preciso e um plano de tratamento personalizado.

BASE DE CONHECIMENTO DERMATOLOGICO:

CONDICOES CONHECIDAS:
${conditionsKB}

INGREDIENTES ATIVOS CONHECIDOS:
${ingredientsKB}
${toneBlock}${clinicBlock}${scopeBlock}
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
10. (Idioma da resposta definido no bloco IDIOMA DA RESPOSTA abaixo. NAO escreva neste passo.)
11. Para zone_annotations: analise CADA zona facial individualmente. Inclua pelo menos 5 zonas. Use "good" para areas saudaveis, "attention" para areas com leve preocupacao, "concern" para areas que precisam de tratamento. Sempre inclua pelo menos 1-2 zonas "good" para equilibrar o diagnostico.
12. DISCREPANCIA DE TIPO DE PELE: Compare o tipo de pele que o paciente auto-relatou com o que voce observa na foto. Se forem diferentes, preencha "skin_type_self_reported" com o tipo que o paciente disse e "skin_type_discrepancy" com uma explicacao gentil e educativa de por que sua observacao profissional difere da percepcao do paciente. Se forem iguais, deixe esses campos como null.
${platformConfig?.analysisGlobalRules ? `\nREGRAS GLOBAIS DA PLATAFORMA:\n${platformConfig.analysisGlobalRules}` : ""}
${platformConfig?.analysisRestrictedConditions ? `\nCONDICOES RESTRITAS GLOBALMENTE (NAO MENCIONAR): ${platformConfig.analysisRestrictedConditions}` : ""}
${tenantConfig?.customPromptSuffix ? `\nINSTRUCOES ADICIONAIS DO CLIENTE: ${tenantConfig.customPromptSuffix}` : ""}
${tenantConfig?.restrictedConditions ? `\nCONDICOES RESTRITAS PELO CLIENTE (NAO MENCIONAR): ${tenantConfig.restrictedConditions}` : ""}
${brandVoice ? `\nVOZ DE MARCA DA CLINICA (use como inspiracao adicional ao escrever os campos voltados ao paciente, mantendo as regras de seguranca clinica e o tom configurado acima): ${brandVoice}` : ""}

IDIOMA DA RESPOSTA (CRITICO):
- Escreva TODOS os campos voltados ao paciente em ${localeName}.
- Campos a traduzir: "summary", "conditions[].description", "skin_type_discrepancy", "action_plan.phase1/phase2/phase3", "timeline.weeks4/weeks8/weeks12", "alert_signs[]", "zone_annotations[].observation", "zone_annotations[].title".
- NAO traduza NUNCA os identificadores tecnicos: "conditions[].name" (usado pelo motor de recomendacao para casar produtos — deve manter o ID exato da base de conhecimento, ex: "acne", "hyperpigmentation", "envelhecimento_cronologico"), "skin_type" (ex: "oily", "combination"), "barrier_status" (ex: "healthy", "compromised"), "fitzpatrick", "primary_objective", "zone_annotations[].zone" e "zone_annotations[].status".
- Mantenha exatamente a mesma estrutura JSON. Apenas o conteudo textual dos campos visiveis muda de idioma.
- Esta diretiva tem prioridade sobre quaisquer instrucoes de tom ou marca anteriores.${locale === "pt-BR" ? `
- PORTUGUES SEM ESTRANGEIRISMOS: nos campos visiveis ao paciente NAO use palavras em ingles. Use sempre o equivalente em portugues: "skincare" → "cuidados com a pele"; "glow" → "vico" ou "luminosidade"; "lifting" → "efeito tensor" ou "elevacao"; "anti-aging" → "antienvelhecimento"; "drug delivery" → "entrega de ativos"; "skinbooster" → "hidratacao injetavel"; "home care" → "cuidados em casa"; "oil-free" → "livre de oleos"; "self-care" → "autocuidado"; "peeling" pode ser mantido (termo consagrado no Brasil). Nomes comerciais de procedimentos e marcas (Ultraformer, Morpheus8, Radiesse, Sculptra, Profhilo) podem ser citados.` : ""}`;

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

  const response = await anthropic.messages.parse({
    model: ANALYSIS_MODEL,
    // Single structured answer: thinking off keeps latency well inside the
    // 60s function limit (adaptive thinking measured ~50-57s end to end).
    max_tokens: 16000,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(
        buildAnalysisSchema(
          (conditions.length > 0 ? conditions.map((c) => c.name) : ["aging"]) as [string, ...string[]],
          clinicProcedureNames
        )
      ),
    },
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

  if (response.stop_reason === "refusal") {
    throw new Error("Claude refused the analysis request");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude response truncated (max_tokens)");
  }

  const parsed = response.parsed_output as AnalysisOutput | null;
  if (!parsed) {
    throw new Error("Claude returned no parseable structured output");
  }
  // Severity outside 1-3 would break the UI bars and matcher math.
  parsed.conditions = parsed.conditions.map((c) => ({
    ...c,
    severity: Math.min(Math.max(Math.round(c.severity), 1), 3),
  }));

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
