/**
 * Demo tenant for prospecting aesthetic-procedure clinics (pt-BR).
 *
 * Creates (idempotently) the tenant "Skinner Demo Estética" (segment
 * "aesthetic_clinic") with its default channel, TenantConfig, one b2b_admin
 * user, every procedure of the Skinner procedure library imported as a
 * service (linked via libraryItemId) and a small home-care product line.
 * Re-running refreshes catalog and copy but NEVER overwrites the user's
 * password. Run seed-clinic-segment.ts first so the library rows exist.
 *
 * Procedures come from data/procedure-library.ts (guide-based). The services
 * of the first demo version (SKUs "EST-*") are deactivated, not deleted, so
 * historical recommendations stay valid.
 *
 * Usage (from packages/db, with DATABASE_URL set):
 *   DEMO_ESTETICA_PASSWORD='...' pnpm db:seed:demo-estetica
 * Without DEMO_ESTETICA_PASSWORD the user is not created (catalog still is).
 */
import { PrismaClient } from "../generated/client";
import { hashSync } from "bcryptjs";
import { PROCEDURE_LIBRARY } from "./data/procedure-library";

const prisma = new PrismaClient();

const SLUG = "demo-estetica";
const USER_EMAIL = "democlinicabr@skinner.lat";
const BOOKING_LINK = "https://www.skinner.lat/contato";

const ALL_SKIN = ["oily", "dry", "combination", "normal", "sensitive"];
const NON_SENSITIVE = ["oily", "dry", "combination", "normal"];
const PREG = ["gravidez", "amamentação"];

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
  serviceCategory?: string;
  projectionOnsetWeeks?: number;
  projectionPeakWeeks?: number;
  projectionImprovementPct?: number;
  addOns?: { name: string; description?: string; price?: number }[];
  libraryItemId?: string | null;
  sessionCount?: number;
  sessionFrequency?: string;
  durationMinutes?: number;
  // products
  stepRoutine?: string;
  useTime?: string;
};

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
    serviceCategory: type === "service" ? item.serviceCategory ?? null : null,
    projectionOnsetWeeks: item.projectionOnsetWeeks ?? null,
    projectionPeakWeeks: item.projectionPeakWeeks ?? null,
    projectionImprovementPct: item.projectionImprovementPct ?? null,
    addOns: item.addOns && item.addOns.length > 0 ? JSON.stringify(item.addOns) : null,
    libraryItemId: item.libraryItemId ?? null,
    isActive: true,
  };
}

const tenantData = {
  name: "Skinner Demo Estética",
  segment: "aesthetic_clinic",
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

  // Services = the whole procedure library, linked to the library rows.
  const libraryRows = await prisma.procedureLibraryItem.findMany({ select: { id: true, slug: true } });
  const libraryIdBySlug = new Map(libraryRows.map((r) => [r.slug, r.id]));
  const services: Item[] = PROCEDURE_LIBRARY.map((p, i) => ({
    sku: `PROC-${p.slug}`,
    name: p.name,
    description: p.description,
    price: p.suggestedPrice,
    concernTags: p.concernTags,
    skinTypeTags: p.skinTypeTags,
    objectiveTags: p.objectiveTags,
    severityLevel: p.severityLevel,
    activeIngredients: p.activeIngredients,
    contraindications: p.contraindications,
    priorityRank: PROCEDURE_LIBRARY.length - i,
    serviceCategory: p.category,
    projectionOnsetWeeks: p.projectionOnsetWeeks,
    projectionPeakWeeks: p.projectionPeakWeeks,
    projectionImprovementPct: p.projectionImprovementPct,
    addOns: p.addOns,
    libraryItemId: libraryIdBySlug.get(p.slug) ?? null,
    sessionCount: p.sessionCount,
    sessionFrequency: p.sessionFrequency,
    durationMinutes: p.durationMinutes,
  }));

  // First demo version used "EST-*" SKUs — deactivate (keep history).
  const deactivated = await prisma.product.updateMany({
    where: { tenantId: tenant.id, sku: { startsWith: "EST-" }, isActive: true },
    data: { isActive: false },
  });
  if (deactivated.count > 0) console.log(`Deactivated ${deactivated.count} legacy EST-* services`);

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
