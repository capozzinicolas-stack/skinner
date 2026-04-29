/**
 * Skinner Analysis Engine (SAE) — Base de Conhecimento Dermatológico
 *
 * Este módulo é o núcleo intelectual da plataforma. Contém dados clínicos
 * estruturados sobre condições cutâneas, ingredientes ativos e rotinas,
 * usados pelo SAE para gerar análises e recomendações personalizadas.
 *
 * Referências clínicas: AAD, SBD (Sociedade Brasileira de Dermatologia),
 * EADV, Cosmetic Dermatology (Baumann), Dermatology (Bolognia et al.)
 */

import { PrismaClient } from "../generated/client";

// ---------------------------------------------------------------------------
// TIPOS AUXILIARES (não gerados pelo Prisma — apenas para clareza interna)
// ---------------------------------------------------------------------------

interface SkinConditionSeed {
  name: string;
  displayName: string;
  description: string;
  category: string;
  commonIngredients: string; // JSON string
  avoidIngredients: string;  // JSON string
  baseRoutine?: string;       // JSON string
  alertSigns?: string;        // JSON string
  severity1Desc: string;
  severity2Desc: string;
  severity3Desc: string;
  // Visual prompt sent to Gemini for post-treatment projection.
  // {intensity} is replaced with the percentage improvement (50 or 80).
  visualEditPrompt?: string;
}

interface IngredientSeed {
  name: string;
  displayName: string;
  description: string;
  category: string;
  treatsConditions: string;  // JSON string
  skinTypes: string;          // JSON string
  contraindications?: string; // JSON string
}

// ---------------------------------------------------------------------------
// 1. CONDIÇÕES CUTÂNEAS (20 condições clínicas)
// ---------------------------------------------------------------------------

const skinConditions: SkinConditionSeed[] = [
  // ── INFLAMATÓRIAS ────────────────────────────────────────────────────────

  {
    name: "acne_vulgaris",
    displayName: "Acne Vulgar",
    description:
      "Doença inflamatória crônica da unidade pilossebácea, mediada por quatro fatores principais: hipersecreção sebácea, hiperqueratinização folicular, colonização por Cutibacterium acnes e resposta inflamatória do hospedeiro. Manifesta-se como comedões abertos (cravos pretos) e fechados (cravos brancos), pápulas eritematosas, pústulas e, nas formas mais graves, nódulos e cistos. Acomete predominantemente face, tórax e dorso, regiões de alta densidade de glândulas sebáceas. É influenciada por fatores hormonais, genéticos, dietéticos e do estilo de vida.",
    category: "inflammatory",
    commonIngredients: JSON.stringify([
      "Ácido Salicílico",
      "Peróxido de Benzoíla",
      "Niacinamida",
      "Retinol",
      "Tretinoína",
      "Adapaleno",
      "Ácido Azelaico",
      "Zinco",
      "Ácido Glicólico",
      "Óleo de Melaleuca (Tea Tree)",
    ]),
    avoidIngredients: JSON.stringify([
      "Óleos altamente comedogênicos (coco, linhaça)",
      "Lanolina",
      "Manteiga de karité em pele oleosa",
      "Álcool desnaturado em alta concentração",
      "Fragrâncias sintéticas",
      "Silicones oclusivos em pele muito oleosa",
    ]),
    baseRoutine: JSON.stringify({
      am: ["limpeza suave", "tônico com BHA ou niacinamida", "hidratante oil-free", "protetor solar FPS 50+"],
      pm: ["limpeza dupla se uso de FPS/maquiagem", "retinóide ou peróxido de benzoíla", "hidratante não comedogênico"],
    }),
    alertSigns: JSON.stringify([
      "Nódulos ou cistos maiores que 5 mm que não regridem em 2 semanas",
      "Acne que deixa cicatrizes profundas (ice-pick, rolling, boxcar)",
      "Suspeita de acne hormonal tardia (início após 25 anos, piora pré-menstrual, cistos na mandíbula)",
      "Falha em tratamentos tópicos por mais de 12 semanas",
      "Impacto significativo na saúde mental (ansiedade, evitamento social)",
    ]),
    severity1Desc:
      "Acne leve: comedões abertos e fechados predominantes, com menos de 20 lesões não-inflamatórias ou menos de 15 pápulas/pústulas. Restritas a uma ou duas áreas da face. Sem lesões nódulo-císticas.",
    severity2Desc:
      "Acne moderada: 20 a 100 comedões, 15 a 50 pápulas/pústulas, presença de até 5 nódulos. Distribuição em face e possivelmente tronco. Possível hiperpigmentação pós-inflamatória.",
    severity3Desc:
      "Acne grave (nódulo-cística ou conglobata): mais de 5 nódulos/cistos, lesões confluentes, drenagem de pus, risco elevado de cicatrizes permanentes. Requer avaliação dermatológica urgente, considerando isotretinoína oral.",
  },

  {
    name: "rosacea",
    displayName: "Rosácea",
    description:
      "Dermatose inflamatória crônica de origem multifatorial que afeta primariamente o rosto, especialmente nariz, bochechas, queixo e testa. Caracteriza-se por eritema facial persistente, telangiectasias (capilares visíveis), episódios de flushing (rubor transitório), pápulas e pústulas sem comedões (subtipo papulopustular) e, em casos avançados, rinofima (hiperplasia sebácea do nariz). A fisiopatologia envolve disfunção neurovascular, resposta imune inata alterada, desequilíbrio do microbioma cutâneo (Demodex folliculorum) e barreira epidérmica comprometida. Gatilhos comuns: calor, frio, sol, exercício, álcool, alimentos picantes, estresse.",
    category: "inflammatory",
    commonIngredients: JSON.stringify([
      "Niacinamida",
      "Centella Asiatica",
      "Ácido Azelaico",
      "Alantoína",
      "Bisabolol",
      "Aveia Coloidal",
      "Pantenol",
      "Extrato de Alcaçuz",
      "Protetor Solar Mineral (Óxido de Zinco)",
    ]),
    avoidIngredients: JSON.stringify([
      "Álcool (incluindo álcool cetílico em altas concentrações)",
      "Mentol e cânfora",
      "AHA em concentrações altas (> 5%)",
      "Retinol iniciante (introduzir apenas com cautela e baixa concentração)",
      "Fragrâncias e perfumes",
      "Esfoliantes físicos (scrubs)",
      "Óleos essenciais irritantes (eucalipto, menta, lavanda pura)",
      "Peróxido de Benzoíla",
      "BHA em concentrações altas",
    ]),
    baseRoutine: JSON.stringify({
      am: ["limpeza suave livre de fragrâncias", "sérum calmante (centella ou niacinamida)", "hidratante barrier-first", "protetor solar mineral FPS 50+"],
      pm: ["limpeza suave", "ácido azelaico (se tolerado)", "hidratante emoliente rico"],
    }),
    alertSigns: JSON.stringify([
      "Rinofima progressiva (espessamento do nariz)",
      "Rosácea ocular (olhos vermelhos, sensação de areia — requer oftalmo)",
      "Pústulas que não respondem a cuidados tópicos em 8 semanas",
      "Flushing muito frequente e incapacitante",
    ]),
    severity1Desc:
      "Eritema e flushing intermitentes no centro do rosto, sem lesões. Possível sensação de calor e ardência. A pele retorna ao tom normal entre os episódios.",
    severity2Desc:
      "Eritema persistente com telangiectasias visíveis, pápulas eritematosas e pústulas. Sensação de queimação frequente. Pode haver edema facial leve.",
    severity3Desc:
      "Eritema difuso intenso, telangiectasias extensas, múltiplas pápulas/pústulas, possível rinofima ou comprometimento ocular. Requer tratamento médico sistêmico (doxiciclina, metronidazol tópico, ácido azelaico prescrito).",
  },

  {
    name: "dermatite_seborreica",
    displayName: "Dermatite Seborreica",
    description:
      "Dermatose inflamatória crônica e recidivante que acomete regiões ricas em glândulas sebáceas: couro cabeludo, face (sulcos nasogenianos, sobrancelhas, glabela, pavilhão auricular), tórax e pregas corporais. Patogênese ligada à proliferação de leveduras do gênero Malassezia e à resposta inflamatória do hospedeiro aos seus metabólitos lipolíticos. Caracteriza-se por eritema com escamas oleosas (amareladas ou esbranquiçadas), prurido variável e sensação de queimação. Pode haver piora em períodos de estresse, imunossupressão, frio e com uso de certos cosméticos.",
    category: "inflammatory",
    commonIngredients: JSON.stringify([
      "Piritionato de Zinco",
      "Ácido Salicílico",
      "Ácido Azelaico",
      "Niacinamida",
      "Pantenol",
      "Extrato de Picea (antifúngico natural)",
      "Ciclopirox (uso tópico, prescrito)",
      "Sulfeto de Selênio (prescrito)",
    ]),
    avoidIngredients: JSON.stringify([
      "Óleos pesados na área afetada (agravam Malassezia)",
      "Esfoliantes agressivos",
      "Álcool em alta concentração",
      "Fragrâncias e alcoóis aromáticos",
      "Produtos muito oclusivos",
    ]),
    alertSigns: JSON.stringify([
      "Extensão para áreas incomuns (tronco, virilha)",
      "Ausência de resposta a tratamentos OTC após 4 semanas",
      "Suspeita de psoríase (lesões com escamas prateadas espessas — diagnóstico diferencial importante)",
      "Associação com imunossupressão (risco aumentado em HIV, Parkinson)",
    ]),
    severity1Desc:
      "Descamação leve no couro cabeludo (caspa simples) ou eritema leve nos sulcos nasogenianos sem prurido intenso.",
    severity2Desc:
      "Placas eritematosas com escamas oleosas em face e/ou couro cabeludo, prurido moderado, episódios recorrentes mensais.",
    severity3Desc:
      "Eritema intenso, escamas abundantes, acometimento de múltiplas regiões, prurido constante. Considerar diagnóstico diferencial com psoríase e encaminhar ao dermatologista.",
  },

  {
    name: "dermatite_atopica",
    displayName: "Dermatite Atópica (Eczema Atópico)",
    description:
      "Doença inflamatória crônica, pruriginosa e recidivante da pele, com forte componente genético e imunológico. Resulta de mutações na filagrina (proteína estrutural da barreira cutânea) e de uma resposta imune Th2 exacerbada, levando à disfunção da barreira epidérmica, sensibilização a alérgenos e inflamação crônica. Manifesta-se com prurido intenso, eritema, vesiculação, exsudação nas fases agudas e liquenificação nas fases crônicas. Distribuição característica por faixa etária: lactentes (face e superfícies extensoras), crianças (flexuras — fossas poplíteas e cubitais), adultos (flexuras, pescoço, mãos). Frequentemente associada à asma, rinite alérgica e urticária (marcha atópica).",
    category: "barrier",
    commonIngredients: JSON.stringify([
      "Ceramidas",
      "Ácido Hialurônico",
      "Colesterol",
      "Ácidos Graxos (ácido linoleico, ácido palmítico)",
      "Aveia Coloidal",
      "Pantenol",
      "Glicerina",
      "Alantoína",
      "Bisabolol",
      "Ureia (baixa concentração, 2-5%)",
    ]),
    avoidIngredients: JSON.stringify([
      "Fragrâncias e perfumes (principal alérgeno de contato)",
      "Conservantes como MIT/CMIT (metilisotiazolinona)",
      "Álcool desnaturado",
      "Lauril sulfato de sódio (SLS) — detergente agressivo",
      "Óleos essenciais",
      "Retinóides (em crises agudas)",
      "AHA/BHA (em crises agudas)",
      "Corantes artificiais",
    ]),
    alertSigns: JSON.stringify([
      "Infecção bacteriana secundária (Staphylococcus aureus): crostas mel, exsudato purulento, febre",
      "Infecção herpética (eczema herpeticum): vesículas confluentes dolorosas — EMERGÊNCIA DERMATOLÓGICA",
      "Prurido incontrolável afetando sono e qualidade de vida",
      "Lesões extensas que não respondem a emolientes em 2 semanas",
      "Primeiro episódio em adulto (considerar diagnóstico diferencial)",
    ]),
    severity1Desc:
      "Pele seca, levemente eritematosa, prurido ocasional e leve. Áreas localizadas. Bom controle com emolientes.",
    severity2Desc:
      "Áreas eritematosas frequentes, prurido moderado a intenso, escoriações, inicio de liquenificação. Qualidade de sono afetada.",
    severity3Desc:
      "Eczema extenso, prurido intratável, liquenificação difusa, risco de infecção bacteriana ou viral secundária. Requer corticosteroide tópico prescrito e acompanhamento imunológico/dermatológico.",
  },

  {
    name: "dermatite_contato",
    displayName: "Dermatite de Contato",
    description:
      "Reação inflamatória cutânea causada pelo contato com substâncias externas. Divide-se em dois subtipos principais: Dermatite de Contato Irritante (DCI), que é a mais comum e resulta de dano direto às células epidérmicas sem mecanismo imunológico (causada por detergentes, ácidos, álcalis); e Dermatite de Contato Alérgica (DCA), mediada por hipersensibilidade do tipo IV (linfócitos T) a haptenos específicos (metais como níquel, conservantes, fragrâncias, látex, corantes). A DCI ocorre geralmente nas primeiras horas após exposição; a DCA requer sensibilização prévia e manifesta-se 24 a 72 horas após reexposição.",
    category: "sensitivity",
    commonIngredients: JSON.stringify([
      "Aveia Coloidal",
      "Pantenol",
      "Alantoína",
      "Bisabolol",
      "Centella Asiatica",
      "Ceramidas",
      "Glicerina",
      "Óxido de Zinco (barreira protetora)",
    ]),
    avoidIngredients: JSON.stringify([
      "Substância causadora identificada (níquel, fragrância, conservantes específicos)",
      "Fragrâncias e compostos perfumados",
      "Metilisotiazolinona (MIT)",
      "Parabenos (em pacientes sensibilizados)",
      "Formaldeído e liberadores de formaldeído",
      "Ácidos e esfoliantes em pele inflamada",
      "Álcool desnaturado",
    ]),
    alertSigns: JSON.stringify([
      "Vesiculação extensa ou bolhas",
      "Edema facial, especialmente periocular",
      "Progressão rápida ou generalização da reação",
      "Suspeita de alergia sistêmica (urticária, dispneia)",
      "Necessidade de patch test para identificação do alérgeno",
    ]),
    severity1Desc:
      "Eritema leve e prurido localizado na área de contato, resolução espontânea em 2-3 dias após remoção do agente causador.",
    severity2Desc:
      "Eritema moderado, edema, vesículas, prurido intenso. Pode persistir por 1-2 semanas. Comprometimento de área ampla.",
    severity3Desc:
      "Bolhas, ulcerações, edema significativo ou reação generalizada. Risco de infecção secundária. Necessita avaliação médica e possível corticoterapia sistêmica.",
  },

  {
    name: "dermatite_perioral",
    displayName: "Dermatite Perioral",
    description:
      "Erupção papulopustular característica que ocorre ao redor da boca, nariz e olhos (quando periocular), com zona de poupamento ao redor do vermelhão labial. Histologicamente similar à rosácea. Fatores desencadeantes bem estabelecidos: uso prolongado de corticosteroide tópico facial (causa mais comum), fluoretos em dentifrícios, cosméticos oclusivos e emolientes pesados. Afeta predominantemente mulheres jovens (20-45 anos). O tratamento inclui suspensão do agente causador (pode haver piora inicial — 'rebound') e antibióticos tópicos (metronidazol) ou sistêmicos (doxiciclina).",
    category: "inflammatory",
    commonIngredients: JSON.stringify([
      "Niacinamida (baixa concentração)",
      "Alantoína",
      "Pantenol",
      "Zinco",
      "Ácido Azelaico",
    ]),
    avoidIngredients: JSON.stringify([
      "Corticosteroides tópicos (causa principal — suspender gradualmente)",
      "Produtos muito emolientes ou oclusivos na área perioral",
      "Dentifrícios com fluoreto (trocar por versão sem flúor temporariamente)",
      "Fragrâncias",
      "Óleos pesados (petrolato, vaselina na área afetada)",
      "Retinóides (na fase aguda)",
    ]),
    alertSigns: JSON.stringify([
      "Piora progressiva apesar da retirada do corticoide (pode levar 4-8 semanas para melhorar)",
      "Extensão para área periocular (risco de complicações oculares)",
      "Ausência de resposta ao tratamento tópico em 6 semanas",
    ]),
    severity1Desc:
      "Pápulas eritematosas pequenas, discretas, ao redor da boca. Prurido ou ardência leve.",
    severity2Desc:
      "Pápulas e pústulas confluentes, eritema difuso perioral e perinasal, desconforto moderado.",
    severity3Desc:
      "Erupção extensa, incluindo região periocular, pústulas numerosas, possível descamação. Requer antibiótico prescrito.",
  },

  // ── PIGMENTAÇÃO ───────────────────────────────────────────────────────────

  {
    name: "melasma",
    displayName: "Melasma",
    description:
      "Hiperpigmentação adquirida, simétrica e recorrente, que acomete áreas fotoexpostas da face (centrofacial, malar e mandibular) e, menos comumente, pescoço e antebraços. Resulta da hiperatividade de melanócitos funcionalmente normais em resposta a estímulos como radiação UV, luz visível (especialmente comprimentos de onda entre 400-700 nm), flutuações hormonais (estrogênio, progesterona — piora na gravidez e com contraceptivos) e calor. A melanina é depositada na epiderme (padrão epidérmico, de melhor resposta ao tratamento), na derme (padrão dérmico, de difícil tratamento) ou em ambas (padrão misto). É a hiperpigmentação facial mais prevalente no Brasil, especialmente em fototipos III-V.",
    category: "pigmentation",
    commonIngredients: JSON.stringify([
      "Ácido Tranexâmico",
      "Niacinamida",
      "Vitamina C (Ácido Ascórbico)",
      "Alfa-Arbutin",
      "Ácido Kójico",
      "Extrato de Alcaçuz (Glabridina)",
      "Bakuchiol",
      "Ácido Mandélico",
      "Ácido Azelaico",
      "Retinol (fase de manutenção)",
      "Protetor Solar FPS 50+ com bloqueio de luz visível",
    ]),
    avoidIngredients: JSON.stringify([
      "Fragrâncias fotossensibilizantes (bergamota, limão)",
      "Exposição solar sem proteção rigorosa",
      "Óleos essenciais cítricos em produtos diurnos",
      "Peelings agressivos sem orientação dermatológica (podem piorar o melasma por inflamação)",
    ]),
    alertSigns: JSON.stringify([
      "Manchas com bordas irregulares, múltiplas colorações ou assimetria marcante (descartar lentigo maligno — biópsia)",
      "Ausência de resposta após 3 meses de tratamento consistente",
      "Suspeita de pigmentação induzida por medicamentos (amiodarona, minociclina)",
      "Associação com outros sintomas sistêmicos (suspeita de doença de Addison)",
    ]),
    severity1Desc:
      "Manchas leves, circunscritas, tonalidade castanho-clara. Geralmente epidérmicas. Boa resposta ao protetor solar rigoroso e despigmentantes tópicos.",
    severity2Desc:
      "Manchas moderadas, coalescentes, distribuição malar ou centrofacial, tonalidade castanho-médio. Padrão misto (epidérmico-dérmico). Resposta parcial.",
    severity3Desc:
      "Hiperpigmentação extensa, tonalidade escura, padrão dérmico predominante. Resistente a tratamentos tópicos convencionais. Considerar procedimentos (peel, laser fracionado, microagulhamento com ativos) por dermatologista.",
  },

  {
    name: "hiperpigmentacao_pos_inflamatoria",
    displayName: "Hiperpigmentação Pós-Inflamatória (HPP/PIH)",
    description:
      "Escurecimento da pele como sequela de um processo inflamatório cutâneo (acne, dermatite, trauma, procedimentos estéticos). Resulta de melanogênese reativa: os queratinocitos inflamados liberam citocinas que estimulam os melanócitos a produzir melanina em excesso. O pigmento pode ficar restrito à epiderme (mais superficial, acastanhado, melhor prognóstico) ou migrar para a derme (tonalidade acinzentada-azulada, difícil tratamento — denominada incontinência pigmentar). Fototipos mais escuros (III-VI) têm maior risco e intensidade. Pode durar meses a anos sem tratamento.",
    category: "pigmentation",
    commonIngredients: JSON.stringify([
      "Niacinamida",
      "Alfa-Arbutin",
      "Vitamina C",
      "Ácido Tranexâmico",
      "Ácido Kójico",
      "Ácido Azelaico",
      "Retinol",
      "Ácido Glicólico",
      "Ácido Mandélico",
      "Protetor Solar FPS 50+",
    ]),
    avoidIngredients: JSON.stringify([
      "Exposição solar sem proteção (escurece as manchas)",
      "Picking e escoração das lesões (perpetua a inflamação)",
      "Esfoliantes agressivos em pele ainda inflamada",
      "Fragrâncias irritantes",
    ]),
    alertSigns: JSON.stringify([
      "Tonalidade acinzentada ou azulada (pigmento dérmico — prognóstico reservado para tópicos)",
      "Manchas que crescem ou mudam de forma (descartar neoplasia)",
      "Associação com lesão original não tratada (acne ativa — tratar a causa primeiro)",
    ]),
    severity1Desc:
      "Manchas castanho-claras pequenas, pós-acne ou pós-dermatite leve. Epidérmicas. Regridem em 3-6 meses com proteção solar e despigmentantes.",
    severity2Desc:
      "Manchas moderadas, múltiplas, tonalidade castanho-escura, distribuição ampla. Padrão misto. Regridem em 6-12 meses com tratamento consistente.",
    severity3Desc:
      "Hiperpigmentação extensa, tonalidade escura ou acinzentada, padrão dérmico, muito resistente. Considerar encaminhamento para procedimentos e otimização do tratamento sistêmico.",
  },

  {
    name: "eritema_pos_inflamatorio",
    displayName: "Eritema Pós-Inflamatório (EPI/PIE)",
    description:
      "Manchas avermelhadas ou rosadas que persistem no local de lesões de acne inflamatórias após sua resolução, mais comuns em fototipos claros (I-III). Diferente da HPP (que é pigmentação por melanina), o EPI resulta de vasos sanguíneos dilatados, eritrócitos extravasados e dano vascular pós-inflamatório residual. Não é verdadeiramente uma cicatriz, mas pode demorar de 3 a 12 meses para desaparecer espontaneamente. Tratamento foca em redução da inflamação vascular e proteção solar (UV agrava vasodilatação).",
    category: "pigmentation",
    commonIngredients: JSON.stringify([
      "Niacinamida (vasoconstrição capilar e anti-inflamatório)",
      "Centella Asiatica (cicatrizante vascular)",
      "Vitamina C (fortalece paredes dos vasos, antioxidante)",
      "Ácido Azelaico",
      "Pantenol",
      "Alantoína",
      "Protetor Solar FPS 50+",
      "Retinol (promove renovação e melhora vascularização)",
    ]),
    avoidIngredients: JSON.stringify([
      "Exposição solar sem proteção (vasodilatação e piora da aparência)",
      "Calor excessivo (sauna, banho muito quente)",
      "Esfoliantes agressivos em área afetada",
      "Ingredientes vasodilatadores (mentol, capsaicina)",
    ]),
    alertSigns: JSON.stringify([
      "Lesões que persistem por mais de 12 meses sem melhora",
      "Vermelhidão que aumenta em vez de diminuir",
      "Surgimento de telangiectasias (capilares — considerar rosácea)",
    ]),
    severity1Desc:
      "Manchas róseas discretas pós-pápulas isoladas, que regridem em 3-6 meses com proteção solar.",
    severity2Desc:
      "Múltiplas manchas avermelhadas cobrindo áreas amplas da face, persistentes por mais de 3 meses.",
    severity3Desc:
      "Eritema difuso persistente por mais de 6 meses, com possível evolução para telangiectasias. Considerar laser vascular (Nd:YAG, IPL) com dermatologista.",
  },

  // ── ENVELHECIMENTO ────────────────────────────────────────────────────────

  {
    name: "envelhecimento_fotoinducido",
    displayName: "Fotoenvelhecimento (Envelhecimento Actínico)",
    description:
      "Envelhecimento cutâneo prematuro resultante da exposição cumulativa à radiação ultravioleta (UVA e UVB) e à luz visível. É responsável por até 80-90% das alterações visíveis do envelhecimento facial. A radiação UV induz dano oxidativo ao DNA, fragmentação de fibras de colágeno e elastina (por ativação de metaloproteinases — MMPs), espessamento da epiderme, irregularidades pigmentares (léntigos solares, efélides), vasos visíveis (telangiectasias) e perda de elasticidade. O padrão histológico típico é a elastose actínica — acúmulo de material elastótico na derme superior.",
    category: "aging",
    commonIngredients: JSON.stringify([
      "Protetor Solar FPS 50+ (prevenção essencial)",
      "Retinol / Tretinoína",
      "Vitamina C (Ácido Ascórbico)",
      "Ácido Ferúlico",
      "Vitamina E (Tocoferol)",
      "Resveratrol",
      "Niacinamida",
      "Peptídeos (Matrixyl, Argireline)",
      "Ácido Glicólico",
      "Coenzima Q10",
    ]),
    avoidIngredients: JSON.stringify([
      "Produtos que aumentam fotossensibilidade sem FPS (AHA sem proteção solar)",
      "Bronzeadores e autobronzeadores sem proteção adequada",
      "Exposição solar desprotegida em qualquer horário",
    ]),
    alertSigns: JSON.stringify([
      "Léntigos solares com bordas irregulares, múltiplas colorações (descartar lentigo maligno/melanoma — ABCDE do melanoma)",
      "Queratoses actínicas (lesões rugosas, eritematosas) — lesões pré-malignas que requerem tratamento médico",
      "Ceratoacantoma ou carcinoma basocelular: lesões ulceradas, com bordas peroladas ou que não cicatrizam",
    ]),
    severity1Desc:
      "Léntigos solares leves, linhas finas superficiais, leve alteração na textura. Pele ainda elástica. Fototipos claros.",
    severity2Desc:
      "Rugas moderadas, múltiplos léntigos solares, telangiectasias, perda de firmeza inicial. Coloração irregular difusa.",
    severity3Desc:
      "Elastose actínica avançada, rugas profundas, léntigos extensos, telangiectasias confluentes, textura grosseira. Possíveis queratoses actínicas. Acompanhamento dermatológico anual obrigatório.",
  },

  {
    name: "envelhecimento_cronologico",
    displayName: "Envelhecimento Cronológico (Intrínseco)",
    description:
      "Processo fisiológico inevitável determinado geneticamente, independente da exposição ambiental. Caracteriza-se pela diminuição progressiva de: síntese de colágeno (tipos I e III), fibras de elastina, produção de ácido hialurônico endógeno, renovação celular (turnover), atividade das glândulas sebáceas e sudoríparas, e gordura subcutânea. Resulta em pele mais fina (atrofia epidérmica), seca, com linhas de expressão, perda de firmeza e flacidez. A involução da gordura facial profunda (compartimentos de Rohrich) contribui para a ptose e o aspecto de 'face envelhecida'. Diferencia-se do fotoenvelhecimento pela ausência de lesões pigmentares e telangiectasias.",
    category: "aging",
    commonIngredients: JSON.stringify([
      "Retinol / Tretinoína (aumento de colágeno e renovação)",
      "Peptídeos de Sinalização (Matrixyl 3000, Syn-Ake)",
      "Ácido Hialurônico (multi-peso molecular)",
      "Ceramidas e Colesterol",
      "Niacinamida",
      "Vitamina C",
      "Bakuchiol (alternativa ao retinol)",
      "Coenzima Q10",
      "Resveratrol",
      "Ácido Glicólico (renovação epidérmica)",
    ]),
    avoidIngredients: JSON.stringify([
      "Álcool desnaturado (resseca e agrava atrofia)",
      "Produtos muito abrasivos sem hidratação compensatória",
    ]),
    alertSigns: JSON.stringify([
      "Perda de volume facial muito rápida (descartar lipodistrofia metabólica)",
      "Flacidez severa com ptose palpebral afetando visão (avaliação médica)",
      "Expectativas irrealistas — cosméticos não substituem procedimentos invasivos para flacidez moderada a grave",
    ]),
    severity1Desc:
      "Linhas finas de expressão (pés-de-galinha, linhas da testa), leve perda de brilho, início de ressecamento. Menos de 40 anos.",
    severity2Desc:
      "Rugas moderadas em repouso, sulcos nasolabiais visíveis, perda de firmeza na região mandibular, manchas de envelhecimento discretas.",
    severity3Desc:
      "Rugas profundas, flacidez significativa, sulcos profundos, perda volumétrica marcante. Dermato-cosméticos como adjuvantes; procedimentos médicos (toxina botulínica, preenchimento, laser) para resultados mais expressivos.",
  },

  {
    name: "sagging",
    displayName: "Flacidez (Ptose Cutânea)",
    description:
      "Perda de firmeza e elasticidade da pele decorrente da degradação progressiva das fibras de colágeno (tipos I e III) e elastina na derme, associada à diminuição do ácido hialurônico endógeno e à involução dos compartimentos de gordura facial profunda (compartimentos de Rohrich). Manifesta-se como descolamento dos tecidos da face média, perda de definição do contorno mandibular (jowls), ptose malar, formação de sulcos nasolabiais e bandas platismais no pescoço. Diferencia-se das rugas por afetar volume e estrutura tridimensional, não apenas a superfície da pele. Acelerada por fotoenvelhecimento, perda de peso significativa, gravidade, tabagismo, glicação e estresse oxidativo. Avaliada clinicamente pela mobilidade tecidual, definição do ângulo cervicomental e classificação de ptose malar (Pessa, Mendelson).",
    category: "structural",
    commonIngredients: JSON.stringify([
      "Retinol / Tretinoína (estimula síntese de colágeno)",
      "Peptídeos de Sinalização (Matrixyl 3000, Argireline)",
      "Peptídeos de Cobre (GHK-Cu)",
      "DMAE (Dimetilaminoetanol)",
      "Vitamina C (cofator da síntese de colágeno)",
      "Bakuchiol (alternativa biocompatível ao retinol)",
      "Cafeína (efeito tensor temporário)",
      "Ácido Hialurônico (multi-peso molecular)",
      "Niacinamida",
      "Resveratrol",
      "Coenzima Q10",
      "Ginkgo Biloba (microcirculação)",
    ]),
    avoidIngredients: JSON.stringify([
      "Álcool desnaturado em alta concentração (resseca e agrava atrofia)",
      "Esfoliantes muito agressivos sem hidratação compensatória",
      "Exposição solar sem proteção (fotoenvelhecimento acelerado)",
    ]),
    baseRoutine: JSON.stringify({
      am: ["limpeza suave", "antioxidante (Vitamina C ou Resveratrol)", "hidratante com peptídeos", "protetor solar FPS 50+"],
      pm: ["limpeza dupla se uso de FPS", "retinóide ou bakuchiol", "creme firmador com peptídeos", "hidratante com ceramidas"],
    }),
    alertSigns: JSON.stringify([
      "Flacidez severa com ptose palpebral afetando visão (avaliação médica)",
      "Perda de volume facial muito rápida sem causa aparente (descartar lipodistrofia metabólica)",
      "Expectativas irrealistas — cosméticos retardam e melhoram, mas não substituem procedimentos como ultrassom microfocado, radiofrequência, fios de PDO ou cirurgia para flacidez moderada a grave",
    ]),
    severity1Desc:
      "Flacidez leve: perda inicial de definição do contorno mandibular, leve descolamento da face média perceptível em movimentos. Pele ainda responde bem a estímulos. Comum a partir dos 30 anos.",
    severity2Desc:
      "Flacidez moderada: jowls (papada lateral) visíveis, sulcos nasolabiais marcados, ptose malar evidente, início de bandas platismais no pescoço. Necessita rotina consistente com ativos firmadores e considerar procedimentos não invasivos (radiofrequência, ultrassom microfocado).",
    severity3Desc:
      "Flacidez significativa: descolamento marcante dos tecidos faciais, jowls pronunciados, ângulo cervicomental indefinido, ptose malar e palpebral, bandas platismais espessas. Dermato-cosméticos como adjuvantes; procedimentos médicos (HIFU, fios de sustentação, lifting cirúrgico) são indicados para resultados mais expressivos.",
    visualEditPrompt:
      "Lift and tighten facial skin, especially in jawline, jowls, neck, and lower face by approximately {intensity}% (visibly firmer contours, more defined jawline, reduced sagging and ptosis, tighter mandibular line, lifted midface)",
  },

  // ── BARREIRA / HIDRATAÇÃO ─────────────────────────────────────────────────

  {
    name: "desidratacao_cutanea",
    displayName: "Desidratação Cutânea",
    description:
      "Estado de deficiência hídrica na pele, caracterizado pela redução do conteúdo de água no estrato córneo — diferente da pele seca (xerose), que denota deficiência lipídica. Pode ocorrer em qualquer tipo de pele, inclusive oleosa. Causas: uso excessivo de esfoliantes ou retinóides, detergentes agressivos, clima frio e seco, ar-condicionado, hidratação oral insuficiente, fototipo claro e uso de álcool. Manifesta-se com aspecto opaco, sensação de repuxamento, linhas finas superficiais (não confundir com rugas), descamação fina e, paradoxalmente, aumento da oleosidade compensatória. Avaliado clinicamente pelo teste do beliscão (pele demora a retornar à posição normal).",
    category: "barrier",
    commonIngredients: JSON.stringify([
      "Ácido Hialurônico (baixo e alto peso molecular)",
      "Glicerina",
      "Beta-Glucana",
      "Ureia (5-10%)",
      "Pantenol",
      "Aloe Vera",
      "Sorbitol",
      "Eritritol",
      "Ceramidas (lacre da umidade)",
      "Esqualano",
    ]),
    avoidIngredients: JSON.stringify([
      "Álcool desnaturado",
      "Detergentes agressivos (SLS/SLES em alta concentração)",
      "AHA/BHA em alta concentração sem hidratação compensatória",
      "Retinóides em alta concentração sem emoliente adequado",
      "Banhos muito quentes e prolongados",
    ]),
    alertSigns: JSON.stringify([
      "Desidratação severa associada a doença sistêmica (diabetes, hipotireoidismo, insuficiência renal)",
      "Descamação intensa e generalizada (ictiose — avaliação dermatológica)",
    ]),
    severity1Desc:
      "Opacidade leve, sensação ocasional de repuxamento. Melhora rapidamente com hidratação tópica.",
    severity2Desc:
      "Repuxamento frequente, linhas superficiais visíveis, aspecto 'enrugado' com expressões. Descamação fina.",
    severity3Desc:
      "Descamação intensa, fissuras, barreira gravemente comprometida, sensação de ardência com produtos. Necessita rotina intensiva de barreira.",
  },

  {
    name: "barreira_comprometida",
    displayName: "Barreira Cutânea Comprometida",
    description:
      "Disfunção da função de barreira epidérmica, caracterizada pelo aumento da perda transepidérmica de água (TEWL — Transepidermal Water Loss) e maior vulnerabilidade a irritantes, alérgenos e micro-organismos. A barreira cutânea saudável depende da integridade do estrato córneo ('tijolo e argamassa'): corneócitos (tijolos), lipídios intercelulares (ceramidas, colesterol, ácidos graxos — argamassa) e fatores naturais de hidratação (NMF). Causas de comprometimento: over-skincare (excesso de ácidos, esfoliantes), uso de produtos inadequados, fatores ambientais, genética (filagrina). Manifesta-se com vermelhidão, ardência, prurido, hipersensibilidade reativa e intolerância a ativos antes tolerados.",
    category: "barrier",
    commonIngredients: JSON.stringify([
      "Ceramidas (1, 3, 6-II)",
      "Colesterol",
      "Ácidos Graxos Essenciais (ácido linoleico)",
      "Esqualano",
      "Pantenol",
      "Alantoína",
      "Bisabolol",
      "Aveia Coloidal",
      "Glicerina",
      "Manteiga de Karité (shea butter)",
    ]),
    avoidIngredients: JSON.stringify([
      "Ácidos exfoliantes (AHA, BHA, PHA — suspender durante recuperação)",
      "Retinóides (suspender durante recuperação aguda)",
      "Fragrâncias",
      "Álcool desnaturado",
      "SLS/SLES",
      "Esfoliantes físicos",
      "Qualquer novo ativo — simplicidade é fundamental",
    ]),
    alertSigns: JSON.stringify([
      "Barreira cronicamente comprometida sugere dermatite atópica, rosácea ou psoríase",
      "Intolerância a produtos extremamente simples (somente água e vaselina causam ardência)",
      "Fissuras profundas com risco de infecção",
    ]),
    severity1Desc:
      "Leve hipersensibilidade e ardência a alguns ativos. Barreira minimamente comprometida, recuperação em 1-2 semanas com rotina simplificada.",
    severity2Desc:
      "Vermelhidão, ardência frequente, descamação, prurido. TEWL aumentada. Requer simplificação completa da rotina por 4-6 semanas.",
    severity3Desc:
      "Pele reagindo a praticamente tudo, fissuras, possível infecção secundária, intolerância extrema. Requer intervenção médica e possivelmente corticoide prescrito para controle da inflamação.",
  },

  // ── SENSIBILIDADE ─────────────────────────────────────────────────────────

  {
    name: "pele_sensivel",
    displayName: "Pele Sensível",
    description:
      "Síndrome subjetiva de hipersensibilidade cutânea, sem base alérgica ou imunológica específica identificável, caracterizada por sensações desagradáveis (ardência, prurido, formigamento, aperto) em resposta a estímulos que normalmente são bem tolerados (cosméticos, temperatura, vento, estresse). A fisiopatologia envolve: hiperreatividade de neuroreceptores sensoriais (TRPV1, TRPA1), comprometimento sutil da barreira cutânea, resposta neurogênica exacerbada e, possivelmente, alterações no microbioma. Estima-se que 40-70% da população relata ter pele sensível em algum grau. Diagnóstico de exclusão — após descarte de rosácea, dermatite atópica e dermatite de contato.",
    category: "sensitivity",
    commonIngredients: JSON.stringify([
      "Centella Asiatica (madecassoside, asiaticoside)",
      "Aveia Coloidal",
      "Bisabolol (calmante)",
      "Alantoína",
      "Pantenol",
      "Niacinamida (baixa concentração, 2-4%)",
      "Extrato de Camomila",
      "Ceramidas",
      "Glicerina",
      "Esqualano",
    ]),
    avoidIngredients: JSON.stringify([
      "Fragrâncias sintéticas e naturais (principal gatilho)",
      "Álcool desnaturado",
      "Óleos essenciais (especialmente menta, eucalipto, limão)",
      "Mentol e cânfora",
      "Retinóides em alta concentração",
      "AHA/BHA em concentrações altas",
      "Conservantes agressivos (MIT, DMDM Hidantoína)",
      "Sulfatos (SLS/SLES)",
      "Corantes artificiais",
    ]),
    alertSigns: JSON.stringify([
      "Vermelhidão persistente sem estímulo aparente (considerar rosácea)",
      "Reação alérgica sistêmica (urticária, angioedema — emergência médica)",
      "Suspeita de dermatite de contato (patch test indicado)",
    ]),
    severity1Desc:
      "Pele que reage a produtos novos ou ingredientes específicos (ex: perfume), sem reação generalizada. Boa tolerância à maioria dos cosméticos.",
    severity2Desc:
      "Reatividade frequente, vermelhidão episódica, dificuldade de usar mais de 5-6 produtos sem reação. Rotina muito restrita.",
    severity3Desc:
      "Hipersensibilidade a praticamente tudo, incluindo produtos muito básicos. Suspeita de rosácea ou eczema — avaliação dermatológica.",
  },

  // ── ESTRUTURAL / TEXTURA ──────────────────────────────────────────────────

  {
    name: "keratosis_pilaris",
    displayName: "Ceratose Pilar",
    description:
      "Condição genética autossômica dominante extremamente comum (40-50% da população adulta), caracterizada pelo acúmulo de queratina nos folículos pilosos, formando pequenos plugues que bloqueiam o orifício folicular. Manifesta-se como micropápulas queratóticas ('pele de galinha'), que podem ser eritematosas. Acomete principalmente face posterior dos braços, coxas, nádegas e bochechas (em crianças). Não é contagiosa nem perigosa. Piora no frio e no inverno (quando a pele está mais seca). Não tem cura, mas melhora significativa com tratamento. Frequentemente associada à dermatite atópica e ictiose vulgar.",
    category: "structural",
    commonIngredients: JSON.stringify([
      "Ureia (10-20%)",
      "Ácido Lático (12%)",
      "Ácido Glicólico",
      "Ácido Salicílico",
      "Retinol",
      "Esqualano",
      "Ceramidas",
      "Ácido Mandélico",
    ]),
    avoidIngredients: JSON.stringify([
      "Banhos muito quentes (ressecam e agravam)",
      "Esfoliantes físicos agressivos (buchas, esfregões — traumatizam e inflamam)",
      "Produtos muito secantes",
    ]),
    alertSigns: JSON.stringify([
      "Lesões muito inflamadas, dolorosas ou com pus (infecção secundária — foliculite)",
      "Extensão para áreas incomuns ou aspecto muito diferente",
    ]),
    severity1Desc:
      "Pápulas pequenas, não eritematosas, em área localizada. Textura levemente rugosa, sem inflamação.",
    severity2Desc:
      "Pápulas eritematosas em áreas amplas (braços e coxas), textura muito rugosa, aparência cosmética significativa.",
    severity3Desc:
      "Inflamação intensa, eritema difuso, possível onicocriptose (ceratose de placa). Casos muito extensos ou dolorosos requerem avaliação.",
  },

  {
    name: "milia",
    displayName: "Mília",
    description:
      "Cistos de queratina epidérmicos pequenos (1-2 mm), brancos ou amarelo-esbranquiçados, de aspecto perláceo, formados pelo aprisionamento de queratina na superfície da pele ou em glândulas sebáceas e folículos pilosos. Divide-se em primária (idiopática, especialmente em recém-nascidos e pálpebras de adultos) e secundária (associada a trauma, queimaduras, peelings, blefarite ou uso de cosméticos muito oclusivos). Não são acne nem cravos — não devem ser espremidos por leigos (risco de infecção e cicatriz). Remoção por agulhamento (extração com agulha estéril) pelo dermatologista.",
    category: "structural",
    commonIngredients: JSON.stringify([
      "Retinol (queratólise suave e renovação celular)",
      "Ácido Glicólico",
      "Ácido Salicílico",
      "Niacinamida",
    ]),
    avoidIngredients: JSON.stringify([
      "Produtos muito oclusivos (petrolatum, lanolina, óleos pesados em área afetada)",
      "Cremes espessos ao redor dos olhos em pele com mília recorrente",
      "Espremer as lesões (risco de infecção e cicatriz)",
    ]),
    alertSigns: JSON.stringify([
      "Múltiplos milium de erupção (aparecimento súbito de dezenas de lesões — investigar causa sistêmica)",
      "Lesões que aumentam, sangram ou mudam de cor (descartar outras condições)",
    ]),
    severity1Desc:
      "Poucas lesões (1-5), isoladas, principalmente ao redor dos olhos. Sem inflamação.",
    severity2Desc:
      "Lesões múltiplas (6-20) em face, especialmente pálpebras, bochechas e nariz.",
    severity3Desc:
      "Mília disseminada, múltiplas lesões em face e outras áreas. Requer extração por profissional.",
  },

  {
    name: "poros_dilatados",
    displayName: "Poros Dilatados",
    description:
      "Os poros são os orifícios dos folículos pilossebáceos na superfície da pele. Seu tamanho é influenciado por: produção sebácea (excesso de sebo expande o orifício), espessura do pelo terminal, genética, fotoenvelhecimento (degradação do colágeno perifólicular perde sustentação elástica) e, possivelmente, microbioma. Os poros não abrem nem fecham em resposta ao calor/frio — essa é uma informação clinicamente incorreta. A aparência é agravada pela fotodegradação do colágeno perifolicular. Tratamento eficaz: controle da oleosidade e renovação celular para manter o folículo desobstruído e a pele firme ao redor.",
    category: "structural",
    commonIngredients: JSON.stringify([
      "Niacinamida (regulação sebácea e minimização aparente)",
      "Ácido Salicílico (BHA lipossolúvel — limpa dentro do poro)",
      "Retinol (estimula colágeno perifolicular)",
      "Ácido Glicólico (renovação epidérmica)",
      "Argilha (kaolin, bentonita — adsorção de sebo)",
      "Zinco",
      "AHA/BHA combos",
    ]),
    avoidIngredients: JSON.stringify([
      "Óleos comedogênicos (bloqueiam o poro)",
      "Bases e fundações espessas sem remoção adequada",
      "Esfoliação agressiva sem hidratação (pele reage com mais sebo)",
    ]),
    alertSigns: JSON.stringify([
      "Poros muito inflamados podem representar acne ativa",
    ]),
    severity1Desc:
      "Poros levemente visíveis na zona T (nariz, queixo), principalmente associados a leve oleosidade.",
    severity2Desc:
      "Poros claramente visíveis em nariz e bochechas, comedões frequentes, oleosidade moderada.",
    severity3Desc:
      "Poros muito dilatados e visíveis em toda a face, associados a oleosidade intensa e acne. Podem indicar fotoenvelhecimento avançado.",
  },

  {
    name: "olheiras",
    displayName: "Olheiras (Escurecimento Periorbital)",
    description:
      "Escurecimento da região periorbital com origem multifatorial, geralmente de causa combinada. Principais subtipos: (1) Pigmentar: excesso de melanina na pele infraorbital, frequente em fototipos escuros e com tendência genética — aparência acastanhada; (2) Vascular: transparência dos vasos sanguíneos infraorbitais através da pele fina da região, agravada por fadiga, anemia, sono insuficiente — aparência azulada ou arroxeada; (3) Estrutural: sombra causada por depressão do sulco lacrimal ou herniação de gordura palpebral — aparência de sombra escura, não melhora com tópicos; (4) Mista. O diagnóstico diferencial do subtipo orienta o tratamento correto.",
    category: "pigmentation",
    commonIngredients: JSON.stringify([
      "Vitamina C (clareamento + fortalecimento vascular)",
      "Retinol (espessa a pele, reduz transparência vascular)",
      "Cafeína (vasoconstritora, reduz componente vascular)",
      "Niacinamida",
      "Ácido Tranexâmico",
      "Alfa-Arbutin",
      "Peptídeos (Eyeseryl, Haloxyl)",
      "Vitamina K (metabolismo de hemoglobina extravasada)",
    ]),
    avoidIngredients: JSON.stringify([
      "Produtos muito irritantes na área periocular",
      "Retinóides em alta concentração sem protocolo de adaptação (área muito sensível)",
    ]),
    alertSigns: JSON.stringify([
      "Olheiras de aparição súbita associadas a edema persistente (investigar alergia, doença renal ou cardíaca)",
      "Herniação de gordura palpebral marcante (tratamento cirúrgico — blefaroplastia)",
      "Assimetria marcante unilateral (investigar causa local)",
    ]),
    severity1Desc:
      "Escurecimento leve, principalmente pela manhã. Melhora com descanso e hidratação adequada.",
    severity2Desc:
      "Olheiras moderadas, visíveis mesmo com descanso adequado. Componente pigmentar e/ou vascular significativo.",
    severity3Desc:
      "Olheiras profundas com componente estrutural (sulco lacrimal ou herniação gordurosa). Tópicos têm efeito limitado — avaliar procedimentos médicos.",
  },

  {
    name: "oleosidade_excessiva",
    displayName: "Oleosidade Excessiva (Seborreia)",
    description:
      "Produção excessiva de sebo pelas glândulas sebáceas, determinada geneticamente e modulada por hormônios androgênicos (testosterona, dihidrotestosterona — DHT), dieta, estresse e clima. A unidade pilossebácea responde diretamente a andrógenos: a enzima 5-alfa-redutase converte testosterona em DHT, que estimula a glândula sebácea. Manifesta-se como pele brilhosa, especialmente na zona T, poros visíveis, tendência a comedões e acne. Paradoxalmente, a oleosidade não significa hidratação — peles oleosas podem ser desidratadas. Overhidratation com produtos oclusivos ou supressão severa do sebo pode gerar rebound de oleosidade.",
    category: "barrier",
    commonIngredients: JSON.stringify([
      "Niacinamida (regula produção sebácea)",
      "Ácido Salicílico",
      "Zinco (regulação enzimática sebácea)",
      "Ácido Glicólico",
      "Argilha Caulim",
      "Retinol",
      "Ácido Azelaico",
    ]),
    avoidIngredients: JSON.stringify([
      "Produtos muito oclusivos (petrolatum puro, manteiga de coco)",
      "Óleos altamente comedogênicos",
      "Limpezas excessivamente agressivas (estimulam rebote sebáceo)",
      "Álcool em alta concentração (idem)",
    ]),
    alertSigns: JSON.stringify([
      "Oleosidade súbita excessiva em adultos: investigar desequilíbrio hormonal (SOP, hiperprolactinemia)",
      "Acne nódulo-cística associada a hiperandrogenismo",
    ]),
    severity1Desc:
      "Brilho moderado na zona T ao longo do dia, poros levemente visíveis, tendência a comedões.",
    severity2Desc:
      "Brilho intenso que aparece dentro de 2-3 horas do skincare. Poros dilatados em toda a face, acne comedoniana frequente.",
    severity3Desc:
      "Oleosidade intensa e refratária, acne associada, poros muito dilatados. Possível componente hormonal — investigar.",
  },

  {
    name: "opacidade_textura_irregular",
    displayName: "Opacidade e Textura Irregular",
    description:
      "Perda do brilho natural ('glow') e uniformidade da superfície cutânea, resultante do acúmulo de células mortas no estrato córneo, da redução do turnover celular, da desidratação, da hiperpigmentação difusa e do aumento da rugosidade. Em peles jovens saudáveis, o ciclo de renovação celular leva ~28 dias; com o envelhecimento, estende-se para 40-60+ dias. Contribuem: exposição solar, tabagismo, poluição, má alimentação, sono insuficiente, estresse e rotina inadequada de skincare. A luz reflete de forma difusa em uma textura irregular, gerando aspecto opaco.",
    category: "aging",
    commonIngredients: JSON.stringify([
      "Ácido Glicólico",
      "Ácido Lático",
      "Ácido Mandélico",
      "Ácido PHA (Gluconolactona, Ácido Lactobiônico)",
      "Vitamina C",
      "Retinol",
      "Niacinamida",
      "Enzimas Proteolíticas (papaína, bromelina)",
      "Ácido Hialurônico",
    ]),
    avoidIngredients: JSON.stringify([
      "Excesso de esfoliação (compromete barreira e piora textura a longo prazo)",
      "Produtos muito secantes sem hidratação compensatória",
    ]),
    alertSigns: JSON.stringify([
      "Textura muito rugosa e espessamento epitelial: investigar ceratose actínica",
      "Opacidade associada a icterícia ou palidez extrema: investigar causa sistêmica",
    ]),
    severity1Desc:
      "Pele levemente opaca, textura uniforme com pequenas irregularidades. Responde bem à esfoliação regular.",
    severity2Desc:
      "Pele marcadamente opaca, textura irregular visível, hiperpigmentação difusa, aspecto 'cansado'.",
    severity3Desc:
      "Textura muito irregular, opacidade intensa, hiperpigmentação difusa, rugas superficiais. Exige abordagem multiativa.",
  },
];

// ---------------------------------------------------------------------------
// 2. INGREDIENTES ATIVOS (32 ingredientes)
// ---------------------------------------------------------------------------

const ingredients: IngredientSeed[] = [
  // ── RETINÓIDES ───────────────────────────────────────────────────────────

  {
    name: "retinol",
    displayName: "Retinol",
    description:
      "Derivado de Vitamina A de uso cosmético mais amplamente estudado. Após a aplicação tópica, o retinol é convertido a ácido retinoico (tretinoína) pela pele em duas etapas enzimáticas. Age nos receptores nucleares RAR (Retinoic Acid Receptors) e RXR, modulando a expressão gênica de forma a: acelerar o turnover epidérmico, estimular a síntese de colágeno tipos I e III, inibir metaloproteinases (MMPs), normalizar a queratinização folicular e reduzir a produção sebácea. É o padrão ouro entre os OTC (over-the-counter) para antienvelhecimento e acne. Requer adaptação gradual (retinization): iniciar com 0,025-0,05% em dias alternados, progredindo para uso diário e concentrações maiores ao longo de 8-12 semanas.",
    category: "retinoid",
    treatsConditions: JSON.stringify([
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "acne_vulgaris",
      "hiperpigmentacao_pos_inflamatoria",
      "melasma",
      "keratosis_pilaris",
      "poros_dilatados",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["normal", "oily", "combination"]),
    contraindications: JSON.stringify([
      "Gravidez (teratogênico — categoria X em doses orais; evitar tópico por precaução)",
      "Amamentação",
      "Pele com barreira comprometida (iniciar somente após recuperação)",
      "Rosácea ativa (iniciar com cautela extrema, baixas concentrações)",
      "Dermatite atópica em crise",
      "Exposição solar intensa sem proteção rigorosa",
    ]),
  },

  {
    name: "tretinoin",
    displayName: "Tretinoína (Ácido Retinoico)",
    description:
      "Ácido retinoico all-trans, a forma ativa do retinol, de uso médico prescrito (não cosmético). Única substância aprovada pelo FDA e ANVISA para tratamento de acne e fotoenvelhecimento por nível de evidência A. Age diretamente nos receptores nucleares sem necessidade de conversão, sendo 20 vezes mais potente que o retinol tópico equivalente. Disponível em concentrações de 0,025%, 0,05% e 0,1%. O período de retinização é mais intenso (descamação, eritema e sensibilidade nas primeiras 4-8 semanas). Resultados clinicamente significativos em 12-24 semanas. Padrão ouro para fotoenvelhecimento por mais de 30 anos de estudos clínicos randomizados.",
    category: "retinoid",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "keratosis_pilaris",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["normal", "oily", "combination"]),
    contraindications: JSON.stringify([
      "Gravidez (categoria X — teratogênico documentado)",
      "Amamentação",
      "Eczema ativo",
      "Dermatite de contato ativa",
      "Pele com queimadura solar ou muito irritada",
      "Uso simultâneo de outros retinóides",
      "Uso sem orientação médica (prescrito)",
    ]),
  },

  {
    name: "adapalene",
    displayName: "Adapaleno",
    description:
      "Retinóide sintético de terceira geração com seletividade para receptores RAR-beta e RAR-gama, o que confere melhor tolerabilidade comparado à tretinoína com eficácia similar para acne. Possui propriedades comedolíticas, antiinflamatórias (inibe a cascata do ácido araquidônico e a resposta de leucócitos) e normalizadoras do turnover folicular. Disponível OTC em 0,1% gel nos EUA (Differin) — no Brasil, requer prescrição. É mais estável à luz e ao calor que a tretinoína. Menor irritação cutânea, porém retinização ainda ocorre nas primeiras semanas.",
    category: "retinoid",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "opacidade_textura_irregular",
      "envelhecimento_fotoinducido",
    ]),
    skinTypes: JSON.stringify(["oily", "combination", "normal"]),
    contraindications: JSON.stringify([
      "Gravidez",
      "Amamentação",
      "Pele com eczema ou dermatite ativa",
      "Uso simultâneo de outros retinóides ou ácidos em alta concentração",
    ]),
  },

  {
    name: "bakuchiol",
    displayName: "Bakuchiol",
    description:
      "Extrato natural da planta Psoralea corylifolia (bakuchi), meroterpeno com perfil de ação funcialmente análogo ao retinol, embora estruturalmente distinto. Estudos clínicos (RCT publicados em British Journal of Dermatology, 2019) demonstraram equivalência ao retinol 0,5% para redução de linhas finas, pigmentação e elasticidade, com significativamente menos irritação, descamação e sensibilidade ao sol. Adequado para: grávidas e lactantes (alternativa ao retinol), peles sensíveis, rosácea e para uso diurno (sem fotossensibilidade). Mecanismo: regula genes similares ao retinol sem ativar diretamente os receptores RAR — explicação parcial da menor irritação.",
    category: "retinoid",
    treatsConditions: JSON.stringify([
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "acne_vulgaris",
    ]),
    skinTypes: JSON.stringify(["all", "sensitive", "dry", "normal", "oily", "combination"]),
    contraindications: JSON.stringify([
      "Sem contraindicações formais documentadas",
      "Testar patch em pele muito sensível",
    ]),
  },

  // ── AHA ──────────────────────────────────────────────────────────────────

  {
    name: "glycolic_acid",
    displayName: "Ácido Glicólico",
    description:
      "Alpha-hydroxy acid (AHA) de menor peso molecular (76 Da) derivado da cana-de-açúcar, o que lhe confere maior penetração epidérmica entre os AHAs. Mecanismo de ação: quebra das ligações iônicas de cálcio que mantêm os corneócitos coesos no estrato córneo, promovendo esfoliação química suave e renovação celular. Em concentrações mais altas (> 20%, pH < 3,5 — uso profissional), induz desmose profunda com destruição da adesão celular. Em cosméticos OTC (5-10%, pH 3,5-4,5): esfoliação superficial, melhora de textura, opacidade, linhas finas e manchas. Também estimula síntese de colágeno em concentrações mais altas. Fotossensibilizante — uso preferencialmente noturno e protetor solar obrigatório.",
    category: "aha",
    treatsConditions: JSON.stringify([
      "opacidade_textura_irregular",
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "hiperpigmentacao_pos_inflamatoria",
      "melasma",
      "acne_vulgaris",
      "keratosis_pilaris",
      "poros_dilatados",
    ]),
    skinTypes: JSON.stringify(["normal", "oily", "combination", "dry"]),
    contraindications: JSON.stringify([
      "Pele com barreira comprometida ou eczema ativo",
      "Uso sem protetor solar (risco de fotossensibilidade)",
      "Rosácea ativa (irritação aumentada)",
      "Uso simultâneo com retinóides (risco de irritação excessiva — usar em dias alternados)",
      "Gravidez: uso em baixas concentrações parece seguro, mas consultar médico",
    ]),
  },

  {
    name: "lactic_acid",
    displayName: "Ácido Lático",
    description:
      "AHA de peso molecular intermediário (90 Da), naturalmente presente no leite e produzido por fermentação bacteriana. Possui dupla ação: esfoliante químico (idêntico mecanismo ao ácido glicólico, porém penetração mais lenta e gentil) e hidratante — o ácido lático é um componente natural do fator natural de hidratação (NMF) da pele, captando e retendo água no estrato córneo. Gera menor irritação que o ácido glicólico, sendo preferível para peles sensíveis, secas e para iniciantes em AHAs. Concentrações de 5-10% para uso cosmético; > 12% para ceratose pilar e hiperceratoses. Também age na síntese de ceramidas, fortalecendo a barreira. Estudo clínico de 2000 (Dermatology) demonstrou eficácia comparável ao ácido glicólico com menos irritação.",
    category: "aha",
    treatsConditions: JSON.stringify([
      "desidratacao_cutanea",
      "keratosis_pilaris",
      "opacidade_textura_irregular",
      "envelhecimento_cronologico",
      "barreira_comprometida",
    ]),
    skinTypes: JSON.stringify(["sensitive", "dry", "normal", "combination"]),
    contraindications: JSON.stringify([
      "Pele com barreira muito comprometida (usar com cautela)",
      "Uso sem protetor solar",
      "Dermatite atópica em crise",
    ]),
  },

  {
    name: "mandelic_acid",
    displayName: "Ácido Mandélico",
    description:
      "AHA derivado das amêndoas amargas, com maior peso molecular (152 Da) entre os AHAs comuns, resultando em penetração mais lenta e uniforme — menor risco de irritação e hiperpigmentação pós-peeling em fototipos escuros (III-VI). Também possui propriedades antibacterianas documentadas (ação sobre C. acnes) e sebostáticas leves, tornando-o indicado para acne e pele oleosa além da esfoliação. Excelente opção para melasma e HPP em fototipos escuros, onde o ácido glicólico pode ser menos seguro. Usado em concentrações de 5-15% em cosméticos OTC.",
    category: "aha",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "opacidade_textura_irregular",
      "oleosidade_excessiva",
    ]),
    skinTypes: JSON.stringify(["oily", "combination", "normal", "sensitive"]),
    contraindications: JSON.stringify([
      "Uso sem protetor solar",
      "Pele com barreira comprometida",
      "Hipersensibilidade a amêndoas (raro, mas possível)",
    ]),
  },

  // ── BHA ──────────────────────────────────────────────────────────────────

  {
    name: "salicylic_acid",
    displayName: "Ácido Salicílico",
    description:
      "Beta-hydroxy acid (BHA) derivado do ácido salicílico, lipossolúvel — propriedade única entre os ácidos exfoliantes que permite sua penetração dentro dos folículos pilosos preenchidos por sebo. Mecanismo: comedolítico (dissolve os plugues de queratina e sebo), queratolítico (reduz a coesão dos corneócitos), antibacteriano leve (altera o pH intrafolicular desfavorável ao C. acnes) e anti-inflamatório (inibe a síntese de prostaglandinas). Concentrações cosméticas de 0,5-2%. Ideal para acne comedoniana, poros dilatados e peles oleosas. Muito bem tolerado. Em altas concentrações (>20%) e em forma de creme, usado por dermatologistas para ceratoses.",
    category: "bha",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "poros_dilatados",
      "oleosidade_excessiva",
      "opacidade_textura_irregular",
      "keratosis_pilaris",
      "dermatite_seborreica",
    ]),
    skinTypes: JSON.stringify(["oily", "combination", "normal"]),
    contraindications: JSON.stringify([
      "Gravidez (uso prolongado e em grandes áreas — evitar por precaução, especialmente o ácido acetilsalicílico sistêmico)",
      "Alergia a aspirina (ácido acetilsalicílico) — reatividade cruzada possível",
      "Pele muito seca ou com eczema ativo",
    ]),
  },

  // ── PHA ──────────────────────────────────────────────────────────────────

  {
    name: "pha_gluconolactone",
    displayName: "PHA — Gluconolactona (Ácido Glucônico)",
    description:
      "Polyhydroxy acid (PHA) de maior peso molecular que os AHAs, resultando em penetração mais superficial e lenta — esfoliação extremamente gentil com irritação mínima. Além de esfoliante, possui propriedades antioxidantes (quelação de metais pesados), umectantes e de reforço de barreira. Indicado para: peles muito sensíveis, rosácea, dermatite atópica em remissão, iniciantes em ácidos e idosos com pele frágil. Compatível com retinóides (menor irritação combinada comparado a AHAs). Estudos demonstram melhora de textura e tônus sem o potencial irritativo dos AHAs convencionais.",
    category: "pha",
    treatsConditions: JSON.stringify([
      "pele_sensivel",
      "opacidade_textura_irregular",
      "desidratacao_cutanea",
      "barreira_comprometida",
      "envelhecimento_cronologico",
    ]),
    skinTypes: JSON.stringify(["sensitive", "dry", "normal", "combination", "all"]),
    contraindications: JSON.stringify([
      "Praticamente sem contraindicações — o mais seguro entre os ácidos esfoliantes",
      "Uso com protetor solar recomendado (princípio de precaução)",
    ]),
  },

  // ── VITAMINAS ────────────────────────────────────────────────────────────

  {
    name: "niacinamide",
    displayName: "Niacinamida (Vitamina B3)",
    description:
      "Forma amida do ácido nicotínico (vitamina B3), com amplo espectro de ações dermatológicas documentadas. Mecanismos principais: (1) Redução da transferência de melanossomas dos melanócitos para os queratinócitos — despigmentante sem inibir diretamente a tirosinase; (2) Regulação da produção de sebo — reduz excreção sebácea em ~20% com uso de 2% em 4 semanas; (3) Anti-inflamatório — inibe quimiotaxia de neutrófilos; (4) Reforço de barreira — estimula síntese de ceramidas, ácidos graxos e filagrina; (5) Antienvelhecimento — estimula síntese de colágeno e reduz amarelecimento; (6) Minimização aparente de poros — pela redução de oleosidade. Extremamente bem tolerado, compatível com quase todos os outros ativos. Concentrações de 2-10%.",
    category: "vitamin",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "eritema_pos_inflamatorio",
      "rosacea",
      "dermatite_seborreica",
      "poros_dilatados",
      "oleosidade_excessiva",
      "barreira_comprometida",
      "opacidade_textura_irregular",
      "olheiras",
      "envelhecimento_cronologico",
    ]),
    skinTypes: JSON.stringify(["all", "oily", "combination", "normal", "sensitive", "dry"]),
    contraindications: JSON.stringify([
      "Concentrações muito altas (>10%) podem causar rubor facial (flushing) por conversão a ácido nicotínico — preferir 5-10%",
      "Mito do flush com vitamina C: sem evidência sólida de incompatibilidade a pH > 3,5",
    ]),
  },

  {
    name: "vitamin_c_ascorbic",
    displayName: "Vitamina C (Ácido Ascórbico L)",
    description:
      "Antioxidante hidrossolúvel, cofator de enzimas prolil e lisil-hidroxilase (essenciais para síntese de colágeno), inibidor de tirosinase e redutor de melanina oxidada. O ácido ascórbico L puro é a forma mais potente e estudada, mas também a mais instável (oxidação rápida ao ar, luz e calor). Eficaz nas concentrações de 10-20%, pH < 3,5. Efeitos documentados: iluminamento, proteção antioxidante sinérgica com FPS (inativa radicais livres produzidos pelo UV), despigmentação, estimulação de colágeno, proteção contra dano oxidativo por poluição. Fórmulas estabilizadas (com vitamina E e ácido ferúlico — patente Duke University) aumentam a eficácia antioxidante em 8 vezes.",
    category: "antioxidant",
    treatsConditions: JSON.stringify([
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "eritema_pos_inflamatorio",
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "opacidade_textura_irregular",
      "olheiras",
    ]),
    skinTypes: JSON.stringify(["normal", "oily", "combination", "dry"]),
    contraindications: JSON.stringify([
      "Pele muito sensível ou com rosácea ativa (baixo pH pode irritar)",
      "Dermatite atópica ativa",
      "Usar protetor solar junto (embora seja protetor, a degradação gera diacetona que pode pigmentar)",
    ]),
  },

  {
    name: "vitamin_e_tocopherol",
    displayName: "Vitamina E (Tocoferol)",
    description:
      "Antioxidante lipossolúvel que protege membranas celulares do dano oxidativo por radicais livres lipofílicos. Em cosméticos, apresenta-se principalmente como alfa-tocoferol. Ação sinérgica com vitamina C: enquanto a vitamina C neutraliza radicais hidrossolúveis, a vitamina E atua no ambiente lipofílico. A combinação C+E+ácido ferúlico (formulação Duke) oferece proteção antioxidante fotoestável de alto nível. Também possui propriedades emolientes, cicatrizantes e umectantes. Usualmente em concentrações de 0,5-5%.",
    category: "antioxidant",
    treatsConditions: JSON.stringify([
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "barreira_comprometida",
      "desidratacao_cutanea",
    ]),
    skinTypes: JSON.stringify(["dry", "normal", "combination", "sensitive"]),
    contraindications: JSON.stringify([
      "Concentrações muito altas podem ser comedogênicas em alguns indivíduos",
      "Evitar tocoferol puro em alta concentração em pele acneica muito oleosa",
    ]),
  },

  {
    name: "ferulic_acid",
    displayName: "Ácido Ferúlico",
    description:
      "Ácido fenólico natural presente em sementes de trigo, arroz e aveia. Poderoso antioxidante que estabiliza e potencializa a ação das vitaminas C e E: quando combinados em fórmula, a proteção antioxidante aumenta 8 vezes (estudo Pinnell, Duke University). O ácido ferúlico neutraliza radicais livres gerados pela radiação UV e IR-A (infravermelha), age contra radicais superóxido e tem propriedades anti-inflamatórias. Também fotoprotetor per se. Muito usado em séruns antioxidantes premium junto a vitaminas C e E.",
    category: "antioxidant",
    treatsConditions: JSON.stringify([
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "melasma",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["all", "normal", "oily", "combination", "dry", "sensitive"]),
  },

  {
    name: "resveratrol",
    displayName: "Resveratrol",
    description:
      "Polifenol natural encontrado na casca de uvas tintas, mirtilos e amendoins. Potente antioxidante com múltiplos mecanismos: ativa sirtuínas (SIRT1) — enzimas ligadas à longevidade celular, inibe NF-kB (via inflamatória), protege o DNA de dano UV e neutraliza radicais livres. Estudos in vitro e clínicos mostram redução de marcadores inflamatórios cutâneos, melhora da firmeza e proteção contra fotodano. Amplamente utilizado em fórmulas antienvelhecimento premium. Sinergia com vitamina C e E.",
    category: "antioxidant",
    treatsConditions: JSON.stringify([
      "envelhecimento_fotoinducido",
      "envelhecimento_cronologico",
      "rosacea",
      "pele_sensivel",
    ]),
    skinTypes: JSON.stringify(["all", "normal", "dry", "combination", "sensitive"]),
  },

  // ── UMECTANTES ───────────────────────────────────────────────────────────

  {
    name: "hyaluronic_acid",
    displayName: "Ácido Hialurônico",
    description:
      "Glicosaminoglicano naturalmente presente na derme, capaz de reter até 1000 vezes seu peso em água. Sinteticamente produzido por fermentação bacteriana (Streptococcus equi). Apresenta-se em diferentes pesos moleculares com ações distintas: Alto PM (> 1000 kDa) — forma filme hidratante na superfície, sem penetrar; Médio PM (100-1000 kDa) — penetra epiderme superficial; Baixo PM (< 50 kDa) — penetra mais profundamente, maior ação hidratante dérmia. Fórmulas com múltiplos pesos moleculares ('multi-weight') são mais eficazes. Também possui propriedades anti-inflamatórias e cicatrizantes. Deve ser aplicado em pele levemente úmida e selado com emoliente para máxima eficácia.",
    category: "humectant",
    treatsConditions: JSON.stringify([
      "desidratacao_cutanea",
      "envelhecimento_cronologico",
      "barreira_comprometida",
      "pele_sensivel",
      "dermatite_atopica",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["all", "dry", "normal", "combination", "sensitive", "oily"]),
  },

  {
    name: "glycerin",
    displayName: "Glicerina (Glicerol)",
    description:
      "Umectante poliol de origem natural ou sintética, um dos ingredientes hidratantes mais seguros e eficazes disponíveis. Atrai água da derme para o estrato córneo e do ambiente (acima de 70% de umidade relativa). Componente do fator natural de hidratação (NMF). Também reforça a barreira cutânea estimulando a diferenciação de queratinócitos. Concentrações típicas em cosméticos: 5-20%. Segura para todos os tipos de pele, incluindo grávidas, bebês e pele muito sensível. Base de quase todos os hidratantes. Em concentrações muito altas (> 30%) pode ter efeito osmótico reverso em ambientes secos.",
    category: "humectant",
    treatsConditions: JSON.stringify([
      "desidratacao_cutanea",
      "barreira_comprometida",
      "pele_sensivel",
      "dermatite_atopica",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "urea",
    displayName: "Ureia",
    description:
      "Componente natural do NMF (fator natural de hidratação), produzida no metabolismo de aminoácidos. Ação dependente de concentração: baixas concentrações (2-10%) — umectante, reforça barreira, aumenta absorção de outros ativos; médias concentrações (10-20%) — queratolítica suave, desagrega corneócitos, indicada para ceratose pilar e hiperceratoses; altas concentrações (20-40%) — queratolítica intensa, indicada para calosidades, onicomicose adjuvante e ictiose (uso médico). Também possui efeito antibacteriano e antipruriginoso. Segura na gravidez em baixas concentrações.",
    category: "humectant",
    treatsConditions: JSON.stringify([
      "keratosis_pilaris",
      "desidratacao_cutanea",
      "barreira_comprometida",
      "dermatite_atopica",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["dry", "normal", "combination", "sensitive"]),
    contraindications: JSON.stringify([
      "Pele inflamada ou com feridas abertas (ardência intensa)",
      "Concentrações > 10% em pele muito sensível ou mucosas",
    ]),
  },

  // ── EMOLIENTES E LIPÍDIOS ─────────────────────────────────────────────────

  {
    name: "ceramides",
    displayName: "Ceramidas",
    description:
      "Esfingolipídios que constituem 40-50% dos lipídios do estrato córneo, fundamentais para a função de barreira cutânea ('argamassa' entre os corneócitos). Existem mais de 12 subclasses identificadas na pele humana (ceramida 1, 2, 3, 6-II entre as mais relevantes). A deficiência de ceramidas é central na patogênese da dermatite atópica. Produtos com ceramidas exógenas — especialmente combinadas com colesterol e ácidos graxos na proporção fisiológica (3:1:1) — restauram e reforçam a barreira. Indicadas para qualquer condição de comprometimento de barreira, pele seca, sensível e dermatite atópica. Perfil de segurança excelente.",
    category: "lipid",
    treatsConditions: JSON.stringify([
      "barreira_comprometida",
      "dermatite_atopica",
      "desidratacao_cutanea",
      "pele_sensivel",
      "rosacea",
      "keratosis_pilaris",
    ]),
    skinTypes: JSON.stringify(["all", "dry", "sensitive", "normal"]),
  },

  {
    name: "squalane",
    displayName: "Esqualano",
    description:
      "Derivado hidrogenado e estabilizado do esqualeno (componente natural do sebo humano e do óleo de oliva), obtido atualmente principalmente da cana-de-açúcar ou oliva por biotecnologia (mais sustentável que o esqualeno de tubarão). Emoliente de baixo peso molecular que mimetiza o sebo natural, penetrando rapidamente sem sensação gordurosa. Não comedogênico, antioxidante, estabilizante de outras fórmulas. Propriedades: emoliente, oclusivo leve, antioxidante, regulador de sebo (preenche deficiência lipídica para reduzir hipercompensação sebácea). Adequado para todos os tipos de pele, incluindo oleosa e acneica.",
    category: "emollient",
    treatsConditions: JSON.stringify([
      "desidratacao_cutanea",
      "barreira_comprometida",
      "pele_sensivel",
      "oleosidade_excessiva",
      "envelhecimento_cronologico",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "panthenol",
    displayName: "Pantenol (Pró-Vitamina B5)",
    description:
      "Pró-vitamina B5 (precursor do ácido pantotênico) com múltiplas funções dermatológicas: umectante (atrai e retém água), emoliente, cicatrizante (estimula proliferação de fibroblastos e síntese de colágeno), anti-inflamatório e calmante. Penetra facilmente na pele onde é convertido em ácido pantotênico. Reforça a barreira cutânea, reduz eritema e sensação de ardência. Seguro para todos os tipos de pele, incluindo bebês e grávidas. Amplamente usado em produtos pós-procedimento, pele sensível, dermatite atópica e como agente de recuperação de barreira.",
    category: "emollient",
    treatsConditions: JSON.stringify([
      "barreira_comprometida",
      "pele_sensivel",
      "rosacea",
      "dermatite_atopica",
      "dermatite_contato",
      "eritema_pos_inflamatorio",
      "desidratacao_cutanea",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "colloidal_oatmeal",
    displayName: "Aveia Coloidal",
    description:
      "Preparação de aveia (Avena sativa) finamente moída e processada, aprovada pelo FDA como ingrediente ativo para proteção cutânea. Composta de polissacarídeos (beta-glucanas — umectantes e imunomoduladores), lipídios (ácido linoleico — restauração de barreira), proteínas (avenantramidas — exclusivas da aveia, com potentes propriedades anti-inflamatórias e antipruriginosas), vitaminas e minerais. Suporta a barreira cutânea, reduz prurido, acalma inflamação e hidrata. Indicada especificamente para dermatite atópica, psoríase, pele sensível e dermatite de contato. Perfil de segurança excepcional.",
    category: "soothing",
    treatsConditions: JSON.stringify([
      "dermatite_atopica",
      "pele_sensivel",
      "dermatite_contato",
      "rosacea",
      "barreira_comprometida",
    ]),
    skinTypes: JSON.stringify(["sensitive", "dry", "normal", "all"]),
    contraindications: JSON.stringify([
      "Alergia à aveia ou glúten (raro — doença celíaca não se aplica topicamente, mas sensibilidade ao trigo pode coexistir)",
    ]),
  },

  // ── DESPIGMENTANTES ───────────────────────────────────────────────────────

  {
    name: "tranexamic_acid",
    displayName: "Ácido Tranexâmico",
    description:
      "Análogo sintético do aminoácido lisina, originalmente desenvolvido como agente antifibrinolítico (hemostático). No contexto dermatológico, inibe a ativação do plasminogênio por queratinocitos (via UV), o que reduz a síntese de prostaglandinas e o estímulo parácrino dos melanócitos. Também inibe diretamente a tirosinase. Evidências clínicas robustas para melasma (estudos randomizados vs. hidroquinona com perfil de segurança superior). Ativo em concentrações tópicas de 2-5%. Seguro durante a gravidez (como alternativa à hidroquinona). Excelente perfil de tolerabilidade em todos os fototipos.",
    category: "brightening",
    treatsConditions: JSON.stringify([
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "opacidade_textura_irregular",
      "olheiras",
    ]),
    skinTypes: JSON.stringify(["all"]),
    contraindications: JSON.stringify([
      "Sem contraindicações tópicas significativas documentadas",
      "Uso sistêmico (oral/IV) tem contraindicações hematológicas — não se aplica ao uso tópico cosmético",
    ]),
  },

  {
    name: "alpha_arbutin",
    displayName: "Alfa-Arbutin",
    description:
      "Glicosídeo natural derivado da planta uva-ursi (Arctostaphylos uva-ursi), forma alfa estabilizada do arbutin (mais potente que o beta-arbutin). Inibe a tirosinase de forma competitiva e reversível, reduzindo a síntese de melanina sem citotoxicidade para melanócitos (diferente da hidroquinona). Também inibe a maturação dos melanossomas. Concentrações eficazes: 1-2% para uso cosmético. Seguro para todos os fototipos, incluindo gravidez (sem evidência de risco). Início de ação em 4-8 semanas com uso consistente. Muito bem tolerado.",
    category: "brightening",
    treatsConditions: JSON.stringify([
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "opacidade_textura_irregular",
      "olheiras",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "kojic_acid",
    displayName: "Ácido Kójico",
    description:
      "Produto do metabolismo fúngico (Aspergillus oryzae, Penicillium spp.), inibe a tirosinase por quelação do cobre necessário para sua atividade enzimática. Eficaz para manchas solares, melasma e HPP. Concentrações de 1-2% em cosméticos. Instável oxidativamente (escurece a fórmula com o tempo). Pode causar dermatite de contato em uso prolongado ou em peles sensíveis — monitorar. Frequentemente combinado com outros despigmentantes para potencialização. No Brasil, regulamentado pela ANVISA com limite de 1% em cosméticos OTC.",
    category: "brightening",
    treatsConditions: JSON.stringify([
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["normal", "oily", "combination", "dry"]),
    contraindications: JSON.stringify([
      "Pele muito sensível (pode causar eritema e dermatite de contato)",
      "Uso em concentrações > 2% sem supervisão dermatológica",
    ]),
  },

  {
    name: "licorice_extract",
    displayName: "Extrato de Alcaçuz (Glabridina)",
    description:
      "Extrato da raiz de Glycyrrhiza glabra, contendo como principal ativo a glabridina — inibidor de tirosinase e da enzima cox-2 (anti-inflamatória). Também contém liquiritina (estimula dispersão da melanina) e ácido glicirrético (anti-inflamatório). A glabridina inibe a melanogênese estimulada por UV mais eficientemente que a hidroquinona em estudos in vitro. Excelente perfil de segurança — tolerado por peles sensíveis e durante a gravidez. Usado em concentrações de 0,1-2%. Sinergia com outros despigmentantes.",
    category: "brightening",
    treatsConditions: JSON.stringify([
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "rosacea",
      "pele_sensivel",
      "eritema_pos_inflamatorio",
    ]),
    skinTypes: JSON.stringify(["all", "sensitive"]),
  },

  {
    name: "azelaic_acid",
    displayName: "Ácido Azelaico",
    description:
      "Ácido dicarboxílico naturalmente presente em cereais (trigo, cevada, centeio), produzido comercialmente por fermentação de Malassezia furfur. Mecanismos múltiplos: (1) Antibacteriano — inibe o crescimento de C. acnes; (2) Anti-inflamatório — inibe a neutrofilia e radicais livres; (3) Despigmentante — inibe preferencialmente melanócitos hiperativados (como no melasma) sem afetar melanócitos normais; (4) Anticomponente de rosácea — reduz eritema via ação vasoconstritora e anti-inflamatória; (5) Queratolítico suave. Disponível em 15-20% (prescrito) e 10% (cosmético). Aprovado especificamente para rosácea e acne pelo FDA e ANVISA. Seguro na gravidez (categoria B — dados de segurança robustos).",
    category: "brightening",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "rosacea",
      "melasma",
      "hiperpigmentacao_pos_inflamatoria",
      "dermatite_seborreica",
      "dermatite_perioral",
    ]),
    skinTypes: JSON.stringify(["all", "sensitive", "oily", "combination"]),
    contraindications: JSON.stringify([
      "Gravidez: seguro (categoria B — estudos com gestantes sem eventos adversos)",
      "Concentrações > 15% requerem prescrição",
    ]),
  },

  // ── CALMANTES ─────────────────────────────────────────────────────────────

  {
    name: "centella_asiatica",
    displayName: "Centella Asiática (Cica)",
    description:
      "Planta medicinal amplamente usada na medicina ayurvédica e medicina tradicional asiática, com extensa evidência clínica para uso dermatológico. Princípios ativos: asiaticosídeo, asiaticoside, madecassoside (triterpenos) e extrato total (TECA). Efeitos documentados: (1) Cicatrizante — estimula angiogênese, síntese de colágeno e migração de fibroblastos; (2) Anti-inflamatório — inibe NF-kB e TNF-alfa; (3) Calmante — reduz sensação de ardência e prurido; (4) Reforço de barreira — estimula diferenciação de queratinócitos; (5) Antioxidante. Indicada para pele sensível, rosácea, EPI/PIE, pós-procedimentos e reparo de barreira. Um dos ativos mais seguros e versáteis disponíveis.",
    category: "soothing",
    treatsConditions: JSON.stringify([
      "rosacea",
      "pele_sensivel",
      "barreira_comprometida",
      "dermatite_atopica",
      "eritema_pos_inflamatorio",
      "dermatite_contato",
      "envelhecimento_cronologico",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "allantoin",
    displayName: "Alantoína",
    description:
      "Composto químico (ácido glicosilúrico) presente naturalmente na raiz de confrei (Symphytum officinale) e em outros organismos. Propriedades: queratolítico suave (facilita descamação de células mortas), cicatrizante (estimula proliferação celular), calmante e antipruriginoso, umectante e emoliente. Aumenta a absorção de outros ingredientes (penetration enhancer). Bem tolerado por todos os tipos de pele, incluindo bebês. Muito usado em produtos pós-procedimento, pele sensível, dermatite e cicatrização.",
    category: "soothing",
    treatsConditions: JSON.stringify([
      "pele_sensivel",
      "dermatite_atopica",
      "barreira_comprometida",
      "dermatite_contato",
      "rosacea",
      "dermatite_perioral",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "bisabolol",
    displayName: "Bisabolol (Alfa-Bisabolol)",
    description:
      "Álcool sesquiterpênico isolado da camomila-alemã (Matricaria chamomilla) ou produzido sinteticamente. Propriedades: anti-inflamatório (inibe enzimas inflamatórias), calmante (reduz eritema e prurido), antibacteriano leve, cicatrizante e penetration enhancer. Extremamente bem tolerado, inclusive em peles sensíveis, rosácea e dermatite atópica. Não irritante. Amplamente usado como ingrediente calmante de suporte em fórmulas com ativos potentes (retinóides, ácidos).",
    category: "soothing",
    treatsConditions: JSON.stringify([
      "pele_sensivel",
      "rosacea",
      "dermatite_atopica",
      "barreira_comprometida",
      "dermatite_contato",
    ]),
    skinTypes: JSON.stringify(["all", "sensitive"]),
  },

  // ── PEPTÍDEOS ────────────────────────────────────────────────────────────

  {
    name: "peptides_matrixyl",
    displayName: "Peptídeos (Matrixyl — Palmitoil Pentapeptídeo-4)",
    description:
      "Oligopeptídeos sintéticos com atividade de sinalização celular. O Matrixyl (palmitoil pentapeptídeo-4) é o mais estudado: fragmento de pró-colágeno que 'sinaliza' aos fibroblastos para sintetizar novo colágeno tipo I, III e IV, elastina e glicosaminoglicanos. Estudos clínicos publicados no International Journal of Cosmetic Science demonstraram redução de rugas de até 27% em 3 meses de uso diário. Matrixyl 3000 (palmitoil tetrapeptídeo-7 + palmitoil oligopeptídeo) potencializa ainda mais a síntese matricial. Excelente perfil de tolerabilidade — adequado para peles sensíveis como alternativa a retinóides.",
    category: "peptide",
    treatsConditions: JSON.stringify([
      "envelhecimento_cronologico",
      "envelhecimento_fotoinducido",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "peptides_argireline",
    displayName: "Peptídeos (Argireline — Acetil Hexapeptídeo-3)",
    description:
      "Peptídeo sintético que mimetiza parcialmente o mecanismo da toxina botulínica: compete com o complexo SNARE para inibir a liberação de neurotransmissores nas junções neuromusculares, reduzindo micro-contrações faciais e linhas de expressão. Denominado 'botox cosmético' de forma coloquial (efeito significativamente mais modesto que a toxina). Evidências clínicas: redução de profundidade de rugas de expressão de 17% após 4 semanas em concentrações de 10%. Indicado especificamente para rugas de expressão (pés-de-galinha, linhas da testa, glabela). Seguro e bem tolerado.",
    category: "peptide",
    treatsConditions: JSON.stringify([
      "envelhecimento_cronologico",
      "envelhecimento_fotoinducido",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  // ── ANTIBACTERIANOS ───────────────────────────────────────────────────────

  {
    name: "benzoyl_peroxide",
    displayName: "Peróxido de Benzoíla",
    description:
      "Agente oxidante com potente atividade bactericida contra Cutibacterium acnes (C. acnes) — elimina a bactéria por oxidação, sem risco de resistência bacteriana (ao contrário dos antibióticos). Também possui ação comedolítica e queratolítica. Disponível em concentrações de 2,5%, 5% e 10% — estudos demonstram que 2,5% oferece eficácia comparável ao 10% com menor irritação. Ativo no tratamento de lesões inflamatórias de acne e prevenção de resistência antibiótica quando usado em combinação com antibióticos tópicos. Pode descolorir tecidos e cabelos. Uso noturno preferível.",
    category: "antibacterial",
    treatsConditions: JSON.stringify(["acne_vulgaris"]),
    skinTypes: JSON.stringify(["oily", "combination", "normal"]),
    contraindications: JSON.stringify([
      "Pele muito sensível ou com rosácea (muito irritante)",
      "Dermatite atópica ativa",
      "Eczema perioral",
      "Uso em áreas próximas ao cabelo (pode descolorir)",
      "Iniciar com 2,5% e testar tolerabilidade",
    ]),
  },

  {
    name: "zinc",
    displayName: "Zinco (Zinco PCA, Óxido de Zinco, Piritionato de Zinco)",
    description:
      "Mineral com múltiplas formas tópicas e diferentes aplicações. Zinco PCA: regula a produção de sebo via inibição da 5-alfa-redutase, antibacteriano, anti-inflamatório — indicado para acne e pele oleosa. Óxido de Zinco: protetor solar mineral de amplo espectro (UVA/UVB), barreira oclusiva, anti-inflamatório, indicado para pele sensível, rosácea e na fórmula de protetores tolerados por gestantes. Piritionato de Zinco: antifúngico eficaz contra Malassezia, antibacteriano — indicado para dermatite seborreica e caspa. Perfil de segurança excelente em todas as formas.",
    category: "antibacterial",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "rosacea",
      "dermatite_seborreica",
      "oleosidade_excessiva",
      "pele_sensivel",
    ]),
    skinTypes: JSON.stringify(["all", "oily", "sensitive"]),
  },

  {
    name: "tea_tree_oil",
    displayName: "Óleo de Melaleuca (Tea Tree Oil)",
    description:
      "Óleo essencial extraído das folhas de Melaleuca alternifolia, rico em terpinen-4-ol (componente ativo principal). Propriedades: antibacteriano de amplo espectro (incluindo C. acnes e S. aureus), antifúngico (Malassezia, Candida), anti-inflamatório. Estudo clínico randomizado no Medical Journal of Australia (1990) demonstrou eficácia comparável ao peróxido de benzoíla 5% para acne com menor efeito sobre efeitos adversos (menor sequência à longo prazo), porém início de ação mais lento. Usar em concentrações de 5-15% para acne. Nunca aplicar puro (pode causar irritação e queimaduras). Potencial alergizenante em alguns indivíduos.",
    category: "antibacterial",
    treatsConditions: JSON.stringify([
      "acne_vulgaris",
      "dermatite_seborreica",
    ]),
    skinTypes: JSON.stringify(["oily", "combination", "normal"]),
    contraindications: JSON.stringify([
      "Uso puro concentrado (queimaduras e irritação)",
      "Pele muito sensível ou rosácea (pode causar dermatite de contato)",
      "Crianças menores de 6 anos (risco de toxicidade se ingerido)",
    ]),
  },

  // ── RENOVAÇÃO ESPECIALIZADA ───────────────────────────────────────────────

  {
    name: "coenzyme_q10",
    displayName: "Coenzima Q10 (Ubiquinona)",
    description:
      "Componente endógeno da cadeia respiratória mitocondrial, também com função antioxidante lipossolúvel nas membranas celulares. Seus níveis cutâneos diminuem com o envelhecimento e a exposição solar. Neutraliza radicais livres no ambiente lipídico da pele, inibe a colagenase induzida por UV, melhora a bioenergética celular dos fibroblastos (aumenta produção de colágeno) e reduz profundidade de rugas. Concentrações típicas em cosméticos: 0,3-1%. Bem tolerado por todos os tipos de pele.",
    category: "antioxidant",
    treatsConditions: JSON.stringify([
      "envelhecimento_cronologico",
      "envelhecimento_fotoinducido",
      "opacidade_textura_irregular",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },

  {
    name: "caffeine",
    displayName: "Cafeína",
    description:
      "Metilxantina com múltiplos mecanismos cutâneos: vasoconstritora (reduz vermelhidão e componente vascular de olheiras), antioxidante (neutraliza radicais livres), inibidora de fosfodiesterase (reduz acúmulo de lipídios — lipolítica topicamente usada em produtos anti-celulite), fotoprotetora (estudo Nature — reduz dano de UV em células epidérmicas via estimulação de apoptose de células danificadas pelo sol). Em olheiras: reduz aparência vascular temporariamente. Usado em concentrações de 1-3%.",
    category: "antioxidant",
    treatsConditions: JSON.stringify([
      "olheiras",
      "eritema_pos_inflamatorio",
      "envelhecimento_fotoinducido",
    ]),
    skinTypes: JSON.stringify(["all"]),
  },
];

// ---------------------------------------------------------------------------
// 3. TEMPLATES DE ROTINA POR TIPO DE PELE
// ---------------------------------------------------------------------------

export const routineTemplates = {
  oily: {
    label: "Pele Oleosa",
    description:
      "Rotina para controle de oleosidade e prevenção de acne, com foco em hidratação sem oclusão e regulação sebácea.",
    am: [
      { step: 1, category: "cleanser", description: "Limpeza com gel ou espuma suave (pH 5,5-6)", examples: ["gel de limpeza com BHA suave", "espuma de limpeza enzimática"] },
      { step: 2, category: "toner", description: "Tônico sem álcool com BHA ou niacinamida", examples: ["tônico com ácido salicílico 0,5-1%", "tônico com niacinamida"] },
      { step: 3, category: "serum", description: "Sérum leve com despigmentante ou antioxidante", examples: ["sérum vitamina C 10-15%", "sérum niacinamida 5-10%"] },
      { step: 4, category: "moisturizer", description: "Hidratante gel ou fluido oil-free, não comedogênico", examples: ["gel-creme com ácido hialurônico", "fluido com esqualano"] },
      { step: 5, category: "spf", description: "Protetor solar FPS 50+, toque seco ou matte", examples: ["protetor com base matte", "protetor com niacinamida"] },
    ],
    pm: [
      { step: 1, category: "cleanser", description: "Limpeza dupla se usou FPS ou maquiagem (óleo + espuma)", examples: ["balm desmaquilante + gel de limpeza"] },
      { step: 2, category: "exfoliant", description: "Exfoliante químico (BHA/AHA) 2-3x/semana", examples: ["sérum ácido salicílico 2%", "solução AHA/BHA"] },
      { step: 3, category: "treatment", description: "Tratamento-alvo (retinóide ou ácido azelaico)", examples: ["retinol 0,025-0,05% (iniciar gradualmente)", "ácido azelaico 10-15%"] },
      { step: 4, category: "moisturizer", description: "Hidratante leve ou gel-creme", examples: ["gel-creme com ceramidas", "fluido com pantenol"] },
    ],
    notes: [
      "Evitar limpeza excessiva (> 2x/dia aumenta produção sebácea por rebote)",
      "Introduzir retinóide gradualmente: 2x/semana por 4 semanas → uso noturno diário",
      "Hidratação é obrigatória mesmo em pele oleosa — deficiência hídrica piora a acne",
    ],
  },

  dry: {
    label: "Pele Seca",
    description:
      "Rotina com foco em restauração lipídica, hidratação profunda e proteção de barreira, evitando ingredientes secantes.",
    am: [
      { step: 1, category: "cleanser", description: "Limpeza cremosa ou em óleo, muito suave", examples: ["leite de limpeza", "cleansing balm", "mousse suave sem sulfatos"] },
      { step: 2, category: "toner", description: "Essência ou tônico hidratante (sem álcool)", examples: ["essência com ácido hialurônico", "tônico com glicerina"] },
      { step: 3, category: "serum", description: "Sérum umectante ou antioxidante leve", examples: ["sérum multi-HA", "sérum vitamina C suave"] },
      { step: 4, category: "oil", description: "Óleo facial ou concentrado lipídico (opcional)", examples: ["esqualano puro", "óleo de rosa mosqueta"] },
      { step: 5, category: "moisturizer", description: "Hidratante rico em ceramidas e emolientes", examples: ["creme com ceramidas + colesterol", "hidratante com manteiga de karité"] },
      { step: 6, category: "spf", description: "Protetor solar com textura cremosa hidratante", examples: ["protetor com HA", "protetor com acabamento luminoso"] },
    ],
    pm: [
      { step: 1, category: "cleanser", description: "Limpeza suave, sem espuma agressiva", examples: ["leite de limpeza ou óleo de limpeza"] },
      { step: 2, category: "serum", description: "Sérum reparador (ceramidas, pantenol, péptidos)", examples: ["sérum barreira repair", "sérum com centella e ceramidas"] },
      { step: 3, category: "treatment", description: "Tratamento antienvelhecimento (retinol com baixa concentração)", examples: ["retinol 0,025% em base emoliente", "bakuchiol sérum"] },
      { step: 4, category: "moisturizer", description: "Creme noturno rico ou sleeping mask", examples: ["creme com ácidos graxos", "máscara noturna com HA + ceramidas"] },
    ],
    notes: [
      "Aplicar hidratante em pele ligeiramente úmida para maximizar retenção de água",
      "Introduzir retinóide em base muito emoliente (técnica sandwich: hidratante → retinol → hidratante)",
      "Evitar água muito quente no banho e no rosto (piora a xerose)",
      "Humidificador de ambiente pode ajudar em climas secos",
    ],
  },

  combination: {
    label: "Pele Mista",
    description:
      "Rotina equilibrada que controla a zona T sem ressecar as bochechas, com ativos versáteis para ambas as regiões.",
    am: [
      { step: 1, category: "cleanser", description: "Gel suave equilibrante, nem muito seco nem muito cremoso", examples: ["gel de limpeza com pantenol", "espuma suave pH 5,5"] },
      { step: 2, category: "toner", description: "Tônico balanceador com niacinamida ou hamamélis", examples: ["tônico com niacinamida 3%", "tônico com hamamélis sem álcool"] },
      { step: 3, category: "serum", description: "Sérum polivalente (vitamina C ou niacinamida)", examples: ["sérum vitamina C 10%", "sérum niacinamida 5%"] },
      { step: 4, category: "moisturizer", description: "Hidratante gel-creme leve", examples: ["fluido com ácido hialurônico", "gel-creme oil-free"] },
      { step: 5, category: "spf", description: "Protetor solar toque seco ou levemente hidratante", examples: ["protetor FPS 50 toque seco"] },
    ],
    pm: [
      { step: 1, category: "cleanser", description: "Limpeza dupla se necessário (FPS/maquiagem)", examples: ["óleo + gel de limpeza"] },
      { step: 2, category: "exfoliant", description: "Esfoliação química leve 2x/semana (AHA ou BHA)", examples: ["solução AHA 7-10%", "pad ácido salicílico 1%"] },
      { step: 3, category: "treatment", description: "Tratamento alvo (retinol ou ácido azelaico)", examples: ["retinol 0,025-0,1%", "ácido azelaico 10%"] },
      { step: 4, category: "moisturizer", description: "Creme noturno equilibrado (ceramidas + umectantes)", examples: ["creme com ceramidas", "gel-creme com pantenol"] },
    ],
    notes: [
      "Multi-masking (máscara de argila na zona T + máscara hidratante nas bochechas) 1x/semana",
      "Aplicar ácido salicílico somente na zona T se bochechas estiverem secas",
    ],
  },

  sensitive: {
    label: "Pele Sensível",
    description:
      "Rotina minimalista com foco em redução de inflamação, reforço de barreira e introdução lentíssima de qualquer ativo.",
    am: [
      { step: 1, category: "cleanser", description: "Limpeza com água micelar ou leite de limpeza, zero fragrâncias", examples: ["água micelar sem fragrância", "leite de limpeza com aloe vera"] },
      { step: 2, category: "serum", description: "Sérum calmante e de barreira (centella, niacinamida baixa, ceramidas)", examples: ["sérum centella 2%", "sérum com ceramidas + bisabolol"] },
      { step: 3, category: "moisturizer", description: "Creme barreira rico, livre de fragrâncias e álcool", examples: ["creme com ceramidas + colesterol + ácidos graxos", "creme com aveia coloidal"] },
      { step: 4, category: "spf", description: "Protetor solar mineral (óxido de zinco/dióxido de titânio), sem fragrância", examples: ["protetor mineral com óxido de zinco 15-20%"] },
    ],
    pm: [
      { step: 1, category: "cleanser", description: "Mesma limpeza suave do AM", examples: ["água micelar", "espuma sem sulfatos"] },
      { step: 2, category: "serum", description: "Sérum reparador de barreira (sem ativos agressivos)", examples: ["sérum com ceramidas + pantenol + HA"] },
      { step: 3, category: "moisturizer", description: "Creme emoliente noturno rico", examples: ["creme barreira com esqualano + ceramidas"] },
    ],
    notes: [
      "Rotina mínima: idealmente 3-4 produtos apenas",
      "Introducir ativos um de cada vez, com 4 semanas entre cada novo produto",
      "Fazer patch test em todas as novas adições (atrás da orelha ou dobra do cotovelo por 48h)",
      "Evitar esfoliação física; PHA é o ácido mais seguro se necessário",
      "Manter rotina consistente: mudar produtos frequentemente piora a sensibilidade",
    ],
  },

  normal: {
    label: "Pele Normal",
    description:
      "Rotina de manutenção e prevenção do envelhecimento, com liberdade para usar uma gama maior de ativos.",
    am: [
      { step: 1, category: "cleanser", description: "Gel ou espuma suave equilibrante", examples: ["gel de limpeza suave", "espuma amino acids"] },
      { step: 2, category: "serum", description: "Sérum antioxidante matinal", examples: ["vitamina C 10-15% + ácido ferúlico", "sérum resveratrol"] },
      { step: 3, category: "moisturizer", description: "Hidratante leve a moderado", examples: ["fluido com ácido hialurônico", "loção com ceramidas"] },
      { step: 4, category: "spf", description: "Protetor solar FPS 50+", examples: ["protetor com acabamento natural ou levemente luminoso"] },
    ],
    pm: [
      { step: 1, category: "cleanser", description: "Limpeza dupla se necessário", examples: ["óleo + gel", "leite desmaquilante + espuma"] },
      { step: 2, category: "exfoliant", description: "AHA/BHA 2-3x/semana para renovação", examples: ["solução AHA 7%", "tônico com ácido mandélico"] },
      { step: 3, category: "treatment", description: "Retinóide noturno (principal anti-aging)", examples: ["retinol 0,05-0,1%", "bakuchiol 1%"] },
      { step: 4, category: "moisturizer", description: "Creme noturno com peptídeos ou ceramidas", examples: ["creme com matrixyl 3000", "creme com ceramidas + HA"] },
    ],
    notes: [
      "Pele normal tem maior tolerância — oportunidade de usar ativos preventivos desde os 20 anos",
      "Protetor solar é o ativo preventivo mais impactante disponível",
      "Não misturar retinóides com AHA na mesma noite (alternar uso)",
    ],
  },
};

// ---------------------------------------------------------------------------
// 4. FUNÇÃO PRINCIPAL DE SEED
// ---------------------------------------------------------------------------

export async function seedDermatology(prisma: PrismaClient): Promise<void> {
  console.log("  [SAE] Semeando base de conhecimento dermatológico...");

  // -- Condições Cutâneas --
  let conditionsCreated = 0;
  let conditionsUpdated = 0;

  for (const condition of skinConditions) {
    const existing = await prisma.skinCondition.findUnique({
      where: { name: condition.name },
    });

    if (existing) {
      await prisma.skinCondition.update({
        where: { name: condition.name },
        data: condition,
      });
      conditionsUpdated++;
    } else {
      await prisma.skinCondition.create({ data: condition });
      conditionsCreated++;
    }
  }

  console.log(
    `  [SAE] Condições cutâneas: ${conditionsCreated} criadas, ${conditionsUpdated} atualizadas (total: ${skinConditions.length})`
  );

  // -- Ingredientes --
  let ingredientsCreated = 0;
  let ingredientsUpdated = 0;

  for (const ingredient of ingredients) {
    const existing = await prisma.ingredient.findUnique({
      where: { name: ingredient.name },
    });

    if (existing) {
      await prisma.ingredient.update({
        where: { name: ingredient.name },
        data: ingredient,
      });
      ingredientsUpdated++;
    } else {
      await prisma.ingredient.create({ data: ingredient });
      ingredientsCreated++;
    }
  }

  console.log(
    `  [SAE] Ingredientes ativos: ${ingredientsCreated} criados, ${ingredientsUpdated} atualizados (total: ${ingredients.length})`
  );

  console.log("  [SAE] Base de conhecimento dermatológico: OK");
}

// ---------------------------------------------------------------------------
// 5. EXECUÇÃO STANDALONE (npx ts-node seed-dermatology.ts)
// ---------------------------------------------------------------------------

if (require.main === module) {
  const prisma = new PrismaClient();

  seedDermatology(prisma)
    .then(() => {
      console.log("\nBase de conhecimento SAE semeada com sucesso.");
    })
    .catch((e) => {
      console.error("Erro ao semear base dermatológica:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
