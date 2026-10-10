/**
 * Demo tenant for prospecting aesthetic-procedure clinics (pt-BR).
 *
 * Creates (idempotently) the tenant "Skinner Demo Estética" with its default
 * channel, TenantConfig, one b2b_admin user, ~21 aesthetic procedures loaded as
 * services and a small home-care product line. Re-running refreshes catalog
 * and copy but NEVER overwrites the user's password.
 *
 * Service catalog based on a 2025-26 market scan of Brazilian clinics (ISAPS
 * Brazil, São Paulo clinic menus, Doctoralia). Prices are representative
 * mid-to-high-end São Paulo values for demo purposes only.
 *
 * Usage (from packages/db, with DATABASE_URL set):
 *   DEMO_ESTETICA_PASSWORD='...' pnpm db:seed:demo-estetica
 * Without DEMO_ESTETICA_PASSWORD the user is not created (catalog still is).
 */
import { PrismaClient } from "../generated/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const SLUG = "demo-estetica";
const USER_EMAIL = "democlinicabr@skinner.lat";
const BOOKING_LINK = "https://www.skinner.lat/contato";

const ALL_SKIN = ["oily", "dry", "combination", "normal", "sensitive"];
const NON_SENSITIVE = ["oily", "dry", "combination", "normal"];
const PREG = ["pregnancy", "breastfeeding"];

type Item = {
  sku: string;
  name: string;
  description: string;
  price: number;
  concernTags: string[];
  skinTypeTags: string[];
  objectiveTags: string[];
  severityLevel: number;
  activeIngredients: string[];
  contraindications?: string[];
  priorityRank?: number;
  // services
  sessionCount?: number;
  sessionFrequency?: string;
  durationMinutes?: number;
  // products
  stepRoutine?: string;
  useTime?: string;
};

const services: Item[] = [
  {
    sku: "EST-TOX",
    name: "Toxina Botulínica (Botox)",
    description:
      "Relaxa a musculatura responsável pelas linhas de expressão da testa, glabela e entorno dos olhos, suavizando rugas dinâmicas com resultado natural. Valor referente a 3 áreas.",
    price: 1800,
    concernTags: ["aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["anti-aging"],
    severityLevel: 2,
    activeIngredients: ["Toxina Botulínica"],
    contraindications: [...PREG, "doenças neuromusculares"],
    sessionCount: 1,
    sessionFrequency: "a cada 4-6 meses",
    durationMinutes: 30,
    priorityRank: 10,
  },
  {
    sku: "EST-AH",
    name: "Preenchimento com Ácido Hialurônico",
    description:
      "Repõe volume e contorno em lábios, malar, mandíbula e sulcos, devolvendo estrutura ao rosto de forma gradual e reversível. Valor por seringa de 1 ml.",
    price: 2200,
    concernTags: ["aging", "sagging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["anti-aging", "sagging"],
    severityLevel: 3,
    activeIngredients: ["Ácido Hialurônico"],
    contraindications: [...PREG, "herpes ativo na área"],
    sessionCount: 1,
    sessionFrequency: "manutenção a cada 9-18 meses",
    durationMinutes: 60,
    priorityRank: 9,
  },
  {
    sku: "EST-BIO",
    name: "Bioestimulador de Colágeno (Sculptra / Radiesse)",
    description:
      "Estimula a produção natural de colágeno e melhora firmeza e qualidade da pele ao longo dos meses, em rosto, pescoço e colo.",
    price: 3200,
    concernTags: ["sagging", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["sagging", "anti-aging"],
    severityLevel: 3,
    activeIngredients: ["Ácido Poli-L-Láctico", "Hidroxiapatita de Cálcio"],
    contraindications: [...PREG, "tendência a queloide"],
    sessionCount: 2,
    sessionFrequency: "a cada 30-60 dias",
    durationMinutes: 45,
    priorityRank: 9,
  },
  {
    sku: "EST-SKB",
    name: "Skinbooster",
    description:
      "Microinjeções de ácido hialurônico não reticulado que hidratam a pele em profundidade e devolvem viço e elasticidade.",
    price: 1600,
    concernTags: ["dehydration", "dullness", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["hydration", "radiance", "anti-aging"],
    severityLevel: 2,
    activeIngredients: ["Ácido Hialurônico"],
    contraindications: [...PREG],
    sessionCount: 3,
    sessionFrequency: "a cada 4-6 semanas",
    durationMinutes: 45,
    priorityRank: 8,
  },
  {
    sku: "EST-HIFU",
    name: "Ultrassom Microfocado (Ultraformer / HIFU)",
    description:
      "Energia de ultrassom focada nas camadas profundas que contrai e estimula colágeno, com efeito lifting em rosto, papada e pescoço, sem cortes. Valor full face.",
    price: 3500,
    concernTags: ["sagging", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["sagging", "anti-aging"],
    severityLevel: 2,
    activeIngredients: ["Ultrassom Microfocado"],
    contraindications: [...PREG, "implantes metálicos na área"],
    sessionCount: 1,
    sessionFrequency: "a cada 6-12 meses",
    durationMinutes: 60,
    priorityRank: 8,
  },
  {
    sku: "EST-CO2",
    name: "Laser CO2 Fracionado",
    description:
      "Laser que renova a superfície da pele e estimula colágeno, refinando textura, cicatrizes de acne, poros e linhas finas.",
    price: 3500,
    concernTags: ["aging", "acne", "pores", "hyperpigmentation"],
    skinTypeTags: NON_SENSITIVE,
    objectiveTags: ["anti-aging", "anti-acne"],
    severityLevel: 3,
    activeIngredients: ["Laser CO2 Fracionado"],
    contraindications: [...PREG, "isotretinoína nos últimos 6 meses", "herpes ativo"],
    sessionCount: 2,
    sessionFrequency: "a cada 1-3 meses",
    durationMinutes: 60,
    priorityRank: 6,
  },
  {
    sku: "EST-LIP",
    name: "Luz Intensa Pulsada (LIP)",
    description:
      "Luz pulsada que atenua manchas solares, vermelhidão difusa e vasinhos, uniformizando o tom em rosto, pescoço e colo.",
    price: 700,
    concernTags: ["hyperpigmentation", "rosacea", "dullness"],
    skinTypeTags: NON_SENSITIVE,
    objectiveTags: ["even-tone", "radiance"],
    severityLevel: 2,
    activeIngredients: ["Luz Intensa Pulsada"],
    contraindications: [...PREG, "pele bronzeada", "isotretinoína"],
    sessionCount: 4,
    sessionFrequency: "a cada 3-4 semanas",
    durationMinutes: 30,
    priorityRank: 7,
  },
  {
    sku: "EST-LAV",
    name: "Laser Lavieen",
    description:
      "Laser de baixa agressividade que clareia manchas e melasma e confere o efeito de pele uniforme e luminosa, com recuperação rápida.",
    price: 900,
    concernTags: ["hyperpigmentation", "dullness", "pores"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["even-tone", "radiance"],
    severityLevel: 2,
    activeIngredients: ["Laser Thulium", "Ácido Tranexâmico", "Vitamina C"],
    contraindications: [...PREG, "isotretinoína", "herpes ativo"],
    sessionCount: 4,
    sessionFrequency: "mensal",
    durationMinutes: 40,
    priorityRank: 8,
  },
  {
    sku: "EST-MIC",
    name: "Microagulhamento com Drug Delivery",
    description:
      "Microperfurações controladas que estimulam colágeno e potencializam a absorção de ativos, melhorando textura, cicatrizes, poros e manchas.",
    price: 650,
    concernTags: ["acne", "pores", "aging", "hyperpigmentation", "dullness"],
    skinTypeTags: NON_SENSITIVE,
    objectiveTags: ["anti-aging", "anti-acne", "even-tone", "radiance"],
    severityLevel: 2,
    activeIngredients: ["Vitamina C", "Ácido Tranexâmico", "Peptídeos", "Niacinamida"],
    contraindications: [...PREG, "acne inflamatória ativa", "rosácea ativa"],
    sessionCount: 4,
    sessionFrequency: "mensal",
    durationMinutes: 60,
    priorityRank: 7,
  },
  {
    sku: "EST-MRF",
    name: "Microagulhamento com Radiofrequência (Morpheus8)",
    description:
      "Combina microagulhas e radiofrequência para remodelar o colágeno em profundidade, tratando flacidez, textura e cicatrizes.",
    price: 2800,
    concernTags: ["sagging", "aging", "acne", "pores"],
    skinTypeTags: NON_SENSITIVE,
    objectiveTags: ["sagging", "anti-aging"],
    severityLevel: 3,
    activeIngredients: ["Radiofrequência", "Microagulhamento"],
    contraindications: [...PREG, "isotretinoína", "implantes metálicos na área"],
    sessionCount: 3,
    sessionFrequency: "a cada 30-45 dias",
    durationMinutes: 60,
    priorityRank: 6,
  },
  {
    sku: "EST-PSUP",
    name: "Peeling Químico Superficial",
    description:
      "Renovação suave das camadas superficiais com ácidos, que devolve luminosidade, controla a oleosidade e uniformiza o tom.",
    price: 400,
    concernTags: ["acne", "oiliness", "dullness", "hyperpigmentation", "pores"],
    skinTypeTags: ["oily", "combination", "normal"],
    objectiveTags: ["anti-acne", "radiance", "even-tone"],
    severityLevel: 1,
    activeIngredients: ["Ácido Glicólico", "Ácido Salicílico", "Ácido Mandélico"],
    contraindications: [...PREG, "isotretinoína", "dermatite ativa"],
    sessionCount: 4,
    sessionFrequency: "quinzenal",
    durationMinutes: 40,
    priorityRank: 5,
  },
  {
    sku: "EST-PMED",
    name: "Peeling Químico Médio (ATA)",
    description:
      "Peeling de maior profundidade para manchas persistentes, linhas finas e cicatrizes superficiais, com renovação mais intensa.",
    price: 900,
    concernTags: ["hyperpigmentation", "aging", "acne"],
    skinTypeTags: ["oily", "combination", "normal"],
    objectiveTags: ["even-tone", "anti-aging"],
    severityLevel: 3,
    activeIngredients: ["Ácido Tricloroacético"],
    contraindications: [...PREG, "isotretinoína", "herpes ativo"],
    sessionCount: 2,
    sessionFrequency: "a cada 1-3 meses",
    durationMinutes: 45,
    priorityRank: 4,
  },
  {
    sku: "EST-LIMP",
    name: "Limpeza de Pele Profunda",
    description:
      "Higienização com esfoliação, extração de cravos e máscara calmante, que desobstrui os poros e equilibra a oleosidade.",
    price: 280,
    concernTags: ["acne", "oiliness", "pores", "dullness"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["anti-acne", "radiance"],
    severityLevel: 1,
    activeIngredients: ["Ácido Salicílico", "Argila"],
    contraindications: ["acne inflamatória grave", "rosácea ativa"],
    sessionCount: 1,
    sessionFrequency: "mensal",
    durationMinutes: 75,
    priorityRank: 6,
  },
  {
    sku: "EST-HYD",
    name: "Hidrodermoabrasão (Hydrafacial)",
    description:
      "Limpeza, esfoliação e infusão de séruns em um só protocolo, para pele hidratada, poros mais limpos e luminosidade imediata.",
    price: 600,
    concernTags: ["dehydration", "dullness", "pores", "oiliness"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["hydration", "radiance"],
    severityLevel: 1,
    activeIngredients: ["Ácido Hialurônico", "Ácido Salicílico", "Peptídeos"],
    contraindications: ["rosácea ativa", "lesões abertas"],
    sessionCount: 1,
    sessionFrequency: "mensal",
    durationMinutes: 50,
    priorityRank: 7,
  },
  {
    sku: "EST-DIA",
    name: "Peeling de Diamante",
    description:
      "Esfoliação mecânica suave que remove células mortas e afina a textura, ideal como manutenção da luminosidade.",
    price: 200,
    concernTags: ["dullness", "pores", "oiliness"],
    skinTypeTags: ["oily", "combination", "normal"],
    objectiveTags: ["radiance"],
    severityLevel: 1,
    activeIngredients: ["Microdermoabrasão"],
    contraindications: ["isotretinoína", "acne inflamatória", "rosácea"],
    sessionCount: 4,
    sessionFrequency: "quinzenal",
    durationMinutes: 40,
    priorityRank: 3,
  },
  {
    sku: "EST-RF",
    name: "Radiofrequência Facial",
    description:
      "Calor controlado nas camadas profundas que contrai as fibras de colágeno e melhora a firmeza de rosto, pescoço e colo de forma progressiva.",
    price: 350,
    concernTags: ["sagging", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["sagging", "anti-aging"],
    severityLevel: 1,
    activeIngredients: ["Radiofrequência"],
    contraindications: [...PREG, "marcapasso", "implantes metálicos na área"],
    sessionCount: 8,
    sessionFrequency: "semanal",
    durationMinutes: 40,
    priorityRank: 5,
  },
  {
    sku: "EST-PDO",
    name: "Fios de PDO",
    description:
      "Fios absorvíveis que reposicionam os tecidos e estimulam colágeno, sustentando o contorno mandibular, o malar e o pescoço sem cirurgia.",
    price: 3500,
    concernTags: ["sagging", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["sagging"],
    severityLevel: 3,
    activeIngredients: ["Polidioxanona"],
    contraindications: [...PREG, "coagulopatias", "infecção local"],
    sessionCount: 1,
    sessionFrequency: "duração de 12-18 meses",
    durationMinutes: 60,
    priorityRank: 6,
  },
  {
    sku: "EST-ENZ",
    name: "Enzimas para Papada (Intradermoterapia)",
    description:
      "Microinjeções de ativos lipolíticos e enzimas que reduzem a gordura localizada da papada e refinam o contorno do rosto.",
    price: 1000,
    concernTags: ["sagging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["sagging"],
    severityLevel: 2,
    activeIngredients: ["Enzimas Lipolíticas", "Desoxicolato"],
    contraindications: [...PREG, "alergia aos componentes"],
    sessionCount: 3,
    sessionFrequency: "a cada 15-30 dias",
    durationMinutes: 30,
    priorityRank: 4,
  },
  {
    sku: "EST-PLA",
    name: "Jato de Plasma (Pálpebras)",
    description:
      "Microssublimações precisas que retraem a pele, especialmente nas pálpebras, suavizando o excesso de pele e as linhas finas sem cortes.",
    price: 1200,
    concernTags: ["sagging", "aging", "dark_circles"],
    skinTypeTags: ["normal", "dry", "combination"],
    objectiveTags: ["sagging", "anti-aging"],
    severityLevel: 2,
    activeIngredients: ["Plasma"],
    contraindications: [...PREG, "isotretinoína", "tendência a queloide"],
    sessionCount: 1,
    sessionFrequency: "a cada 30-60 dias",
    durationMinutes: 45,
    priorityRank: 4,
  },
  {
    sku: "EST-OLH",
    name: "Tratamento de Olheiras",
    description:
      "Protocolo personalizado com preenchimento de ácido hialurônico, skinbooster ou laser para suavizar a sombra e o aspecto cansado do olhar.",
    price: 2500,
    concernTags: ["dark_circles", "aging", "dehydration"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["anti-aging", "hydration"],
    severityLevel: 2,
    activeIngredients: ["Ácido Hialurônico", "Vitamina C"],
    contraindications: [...PREG],
    sessionCount: 1,
    sessionFrequency: "avaliação individual",
    durationMinutes: 45,
    priorityRank: 7,
  },
  {
    sku: "EST-PDRN",
    name: "PDRN (Polinucleotídeos)",
    description:
      "Injetável regenerador que melhora a qualidade e a elasticidade da pele, acalma a inflamação e favorece a recuperação da barreira.",
    price: 1500,
    concernTags: ["aging", "dehydration", "sensitivity", "dark_circles", "dullness"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["sensitivity", "hydration", "anti-aging", "radiance"],
    severityLevel: 2,
    activeIngredients: ["Polinucleotídeos", "PDRN"],
    contraindications: [...PREG, "alergia a peixe"],
    sessionCount: 3,
    sessionFrequency: "mensal",
    durationMinutes: 40,
    priorityRank: 6,
  },
];

const products: Item[] = [
  {
    sku: "HC-LIMP",
    name: "Gel de Limpeza Equilibrante",
    description: "Limpa sem ressecar, controla a oleosidade e prepara a pele para os ativos da rotina.",
    price: 89,
    concernTags: ["acne", "oiliness", "pores"],
    skinTypeTags: ["oily", "combination", "normal"],
    objectiveTags: ["anti-acne"],
    severityLevel: 1,
    activeIngredients: ["Ácido Salicílico", "Niacinamida"],
    stepRoutine: "cleanser",
    useTime: "both",
  },
  {
    sku: "HC-LIMPS",
    name: "Loção de Limpeza Calmante",
    description: "Limpeza suave para peles sensíveis ou em recuperação pós-procedimento.",
    price: 79,
    concernTags: ["sensitivity", "rosacea", "dehydration"],
    skinTypeTags: ["sensitive", "dry", "normal"],
    objectiveTags: ["sensitivity", "hydration"],
    severityLevel: 1,
    activeIngredients: ["Pantenol", "Centella Asiatica", "Glicerina"],
    stepRoutine: "cleanser",
    useTime: "both",
  },
  {
    sku: "HC-VITC",
    name: "Sérum Vitamina C 15%",
    description: "Antioxidante que uniformiza o tom e potencializa os resultados de lasers e peelings.",
    price: 189,
    concernTags: ["hyperpigmentation", "dullness", "aging"],
    skinTypeTags: ["normal", "dry", "combination", "oily"],
    objectiveTags: ["even-tone", "radiance", "anti-aging"],
    severityLevel: 2,
    activeIngredients: ["Vitamina C", "Ácido Ferúlico", "Vitamina E"],
    stepRoutine: "serum",
    useTime: "am",
  },
  {
    sku: "HC-TRX",
    name: "Sérum Clareador com Ácido Tranexâmico",
    description: "Atua nas manchas e no melasma entre as sessões, prolongando o resultado dos tratamentos.",
    price: 209,
    concernTags: ["hyperpigmentation"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["even-tone"],
    severityLevel: 2,
    activeIngredients: ["Ácido Tranexâmico", "Niacinamida", "Alfa-Arbutin"],
    stepRoutine: "treatment",
    useTime: "pm",
  },
  {
    sku: "HC-RET",
    name: "Sérum Retinol 0,3%",
    description: "Renovação noturna que suaviza linhas finas e refina a textura. Não indicado na gestação.",
    price: 199,
    concernTags: ["aging", "pores", "acne"],
    skinTypeTags: ["normal", "oily", "combination"],
    objectiveTags: ["anti-aging", "anti-acne"],
    severityLevel: 2,
    activeIngredients: ["Retinol", "Peptídeos"],
    contraindications: [...PREG],
    stepRoutine: "serum",
    useTime: "pm",
  },
  {
    sku: "HC-HA",
    name: "Sérum Ácido Hialurônico",
    description: "Hidratação em várias camadas que mantém o viço conquistado com skinbooster e bioestimuladores.",
    price: 159,
    concernTags: ["dehydration", "dullness", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["hydration", "radiance"],
    severityLevel: 1,
    activeIngredients: ["Ácido Hialurônico", "Pantenol"],
    stepRoutine: "serum",
    useTime: "both",
  },
  {
    sku: "HC-REP",
    name: "Creme Reparador de Barreira",
    description: "Recupera e protege a pele após procedimentos, com ceramidas e ativos calmantes.",
    price: 149,
    concernTags: ["sensitivity", "dehydration", "rosacea"],
    skinTypeTags: ["sensitive", "dry", "normal", "combination"],
    objectiveTags: ["sensitivity", "hydration"],
    severityLevel: 1,
    activeIngredients: ["Ceramidas", "Centella Asiatica", "Pantenol"],
    stepRoutine: "moisturizer",
    useTime: "both",
  },
  {
    sku: "HC-FIRM",
    name: "Creme Firmador com Peptídeos",
    description: "Hidrata e melhora a firmeza do rosto e do pescoço, complementando os tratamentos de flacidez.",
    price: 229,
    concernTags: ["sagging", "aging"],
    skinTypeTags: ["normal", "dry", "combination"],
    objectiveTags: ["sagging", "anti-aging"],
    severityLevel: 2,
    activeIngredients: ["Peptídeos", "Ácido Hialurônico", "Niacinamida"],
    stepRoutine: "moisturizer",
    useTime: "both",
  },
  {
    sku: "HC-FPS",
    name: "Protetor Solar FPS 50 com Cor",
    description: "Proteção de amplo espectro e contra luz visível, indispensável durante qualquer tratamento.",
    price: 119,
    concernTags: ["hyperpigmentation", "aging"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["even-tone", "anti-aging"],
    severityLevel: 1,
    activeIngredients: ["Protetor Solar FPS 50+", "Óxido de Ferro"],
    stepRoutine: "SPF",
    useTime: "am",
    priorityRank: 5,
  },
  {
    sku: "HC-OLH",
    name: "Sérum para Área dos Olhos",
    description: "Cafeína e vitamina K para suavizar olheiras e o aspecto cansado do olhar.",
    price: 139,
    concernTags: ["dark_circles"],
    skinTypeTags: ALL_SKIN,
    objectiveTags: ["anti-aging"],
    severityLevel: 1,
    activeIngredients: ["Cafeína", "Vitamina K", "Peptídeos"],
    stepRoutine: "treatment",
    useTime: "both",
  },
];

function toRow(tenantId: string, item: Item, type: "service" | "product") {
  return {
    tenantId,
    sku: item.sku,
    name: item.name,
    description: item.description,
    price: item.price,
    type,
    concernTags: JSON.stringify(item.concernTags),
    skinTypeTags: JSON.stringify(item.skinTypeTags),
    objectiveTags: JSON.stringify(item.objectiveTags),
    severityLevel: item.severityLevel,
    activeIngredients: JSON.stringify(item.activeIngredients),
    contraindications: item.contraindications ? JSON.stringify(item.contraindications) : null,
    priorityRank: item.priorityRank ?? 0,
    stepRoutine: type === "product" ? item.stepRoutine ?? null : null,
    useTime: item.useTime ?? "both",
    bookingLink: type === "service" ? BOOKING_LINK : null,
    sessionCount: item.sessionCount ?? null,
    sessionFrequency: item.sessionFrequency ?? null,
    durationMinutes: item.durationMinutes ?? null,
    isActive: true,
  };
}

const tenantData = {
  name: "Skinner Demo Estética",
  plan: "pro",
  status: "active",
  analysisLimit: 1000,
  commissionRate: 0.02,
  excessCostPerAnalysis: 0,
  logoUrl: "https://www.skinner.lat/brand/logo-primary.png",
  primaryColor: "#3D342C",
  secondaryColor: "#1C1917",
  country: "BR",
  timezone: "America/Sao_Paulo",
  defaultLocale: "pt-BR",
  brandVoice:
    "Acolhedora, precisa e elegante, como uma especialista em estética avançada conversando com a paciente. Explica cada indicação com clareza, sem prometer resultados e sem exageros.",
  disclaimer:
    "Esta análise é informativa e não substitui a avaliação presencial com um profissional habilitado. A indicação final de cada procedimento é feita em consulta.",
};

const configData = {
  analysisTone: "humanized",
  maxServiceRecs: 4,
  maxProductRecs: 4,
  projectionEnabled: true,
  contactCaptureEnabled: true,
  contactCaptureRequired: false,
  resultsShowTimeline: true,
  welcomeTitle: "Descubra o tratamento ideal para a sua pele",
  welcomeDescription:
    "Em poucos minutos, nossa análise com inteligência artificial avalia a sua pele e indica os procedimentos e cuidados mais adequados para os seus objetivos.",
  welcomeCtaText: "Começar minha análise",
  photoInstruction:
    "Tire uma foto de frente, sem maquiagem, em um ambiente bem iluminado e com o rosto inteiro visível.",
  resultsTopMessage:
    "Este é o seu plano personalizado. Nossa equipe confirma as indicações na sua avaliação presencial.",
  serviceCtaText: "Agendar avaliação",
  productCtaText: "Comprar",
  contactCustomMessage:
    "Deixe seu contato para receber o seu plano de tratamento e falar com a nossa equipe sobre os procedimentos indicados.",
  adminNotes:
    "Conta demo para prospecção de clínicas de procedimentos estéticos (pt-BR). Criada por packages/db/src/seed-demo-estetica.ts. Agendamentos apontam para www.skinner.lat/contato.",
};

async function main() {
  console.log(`Seeding demo tenant "${SLUG}"...`);

  const tenant = await prisma.tenant.upsert({
    where: { slug: SLUG },
    update: tenantData,
    create: { slug: SLUG, ...tenantData },
  });

  await prisma.tenantConfig.upsert({
    where: { tenantId: tenant.id },
    update: configData,
    create: { tenantId: tenant.id, ...configData },
  });

  // Default channel invariant: one isDefault channel whose slug == Tenant.slug.
  const channel = await prisma.analysisChannel.findUnique({ where: { slug: SLUG } });
  if (!channel) {
    await prisma.analysisChannel.create({
      data: { tenantId: tenant.id, slug: SLUG, label: "Padrão", isDefault: true },
    });
  } else if (channel.tenantId !== tenant.id) {
    throw new Error(`Channel slug ${SLUG} belongs to another tenant`);
  }

  for (const s of services) {
    const row = toRow(tenant.id, s, "service");
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: s.sku } },
      update: row,
      create: row,
    });
  }
  for (const p of products) {
    const row = toRow(tenant.id, p, "product");
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
      update: row,
      create: row,
    });
  }
  console.log(`Catalog: ${services.length} services, ${products.length} products`);

  const password = process.env.DEMO_ESTETICA_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (existing) {
    if (existing.tenantId !== tenant.id) throw new Error(`${USER_EMAIL} belongs to another tenant`);
    console.log(`User ${USER_EMAIL} already exists (password untouched)`);
  } else if (password) {
    await prisma.user.create({
      data: {
        email: USER_EMAIL,
        name: "Equipe Demo Estética",
        password: hashSync(password, 10),
        role: "b2b_admin",
        tenantId: tenant.id,
        locale: "pt-BR",
        passwordChangedAt: new Date(),
      },
    });
    console.log(`User ${USER_EMAIL} created`);
  } else {
    console.log("DEMO_ESTETICA_PASSWORD not set: user not created");
  }

  console.log(`Done. Patient link: /analise/${SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
