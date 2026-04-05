import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create Skinner Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@skinner.com.br" },
    update: {},
    create: {
      email: "admin@skinner.com.br",
      name: "Admin Skinner",
      password: hashSync("admin123", 10),
      role: "skinner_admin",
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // 2. Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-clinic" },
    update: {},
    create: {
      name: "Clínica Demo Dermatologia",
      slug: "demo-clinic",
      plan: "growth",
      analysisLimit: 1000,
      commissionRate: 0.02,
      excessCostPerAnalysis: 2.0,
      primaryColor: "#0ea5e9",
      secondaryColor: "#075985",
      brandVoice:
        "Profissional, acolhedor e educativo. Use linguagem acessível, evitando jargões médicos.",
      disclaimer:
        "Esta análise é apenas informativa e não substitui a consulta com um dermatologista.",
      tenantConfig: {
        create: {
          emailEnabled: true,
          pdfRetentionDays: 90,
        },
      },
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.slug})`);

  // 3. Create B2B user for tenant
  const b2bUser = await prisma.user.upsert({
    where: { email: "clinica@demo.com" },
    update: {},
    create: {
      email: "clinica@demo.com",
      name: "Dr. Maria Silva",
      password: hashSync("demo123", 10),
      role: "b2b_admin",
      tenantId: tenant.id,
    },
  });
  console.log(`✅ B2B User: ${b2bUser.email}`);

  // 4. Create sample products
  const products = [
    {
      sku: "CLN-001",
      name: "Gel de Limpeza Suave",
      description:
        "Gel de limpeza facial para peles sensíveis e mistas. Remove impurezas sem ressecar.",
      price: 89.9,
      concernTags: JSON.stringify(["acne", "sensitivity"]),
      skinTypeTags: JSON.stringify(["oily", "combination", "sensitive"]),
      objectiveTags: JSON.stringify(["hydration", "anti-acne"]),
      severityLevel: 1,
      stepRoutine: "cleanser",
      useTime: "both",
      activeIngredients: JSON.stringify([
        "Ácido Salicílico 0.5%",
        "Niacinamida 2%",
      ]),
      ecommerceLink: "https://demo-clinic.com/produtos/gel-limpeza",
    },
    {
      sku: "SRM-001",
      name: "Sérum Vitamina C 15%",
      description:
        "Sérum antioxidante com Vitamina C pura para uniformizar o tom da pele e prevenir envelhecimento.",
      price: 159.9,
      concernTags: JSON.stringify(["hyperpigmentation", "aging"]),
      skinTypeTags: JSON.stringify(["normal", "dry", "combination"]),
      objectiveTags: JSON.stringify(["radiance", "anti-aging"]),
      severityLevel: 2,
      stepRoutine: "serum",
      useTime: "am",
      activeIngredients: JSON.stringify([
        "Vitamina C 15%",
        "Vitamina E",
        "Ácido Ferúlico",
      ]),
      ecommerceLink: "https://demo-clinic.com/produtos/serum-vitc",
    },
    {
      sku: "HID-001",
      name: "Hidratante Barrier Repair",
      description:
        "Hidratante reparador de barreira cutânea com ceramidas e ácido hialurônico.",
      price: 129.9,
      concernTags: JSON.stringify(["dehydration", "sensitivity"]),
      skinTypeTags: JSON.stringify(["dry", "sensitive", "normal"]),
      objectiveTags: JSON.stringify(["hydration", "sensitivity"]),
      severityLevel: 1,
      stepRoutine: "moisturizer",
      useTime: "both",
      activeIngredients: JSON.stringify([
        "Ceramidas",
        "Ácido Hialurônico",
        "Pantenol",
      ]),
      ecommerceLink: "https://demo-clinic.com/produtos/hidratante-barrier",
    },
    {
      sku: "SPF-001",
      name: "Protetor Solar FPS 50 Toque Seco",
      description:
        "Protetor solar de amplo espectro com acabamento matte. Ideal para peles oleosas.",
      price: 69.9,
      concernTags: JSON.stringify(["aging", "hyperpigmentation"]),
      skinTypeTags: JSON.stringify([
        "oily",
        "combination",
        "normal",
        "dry",
        "sensitive",
      ]),
      objectiveTags: JSON.stringify(["anti-aging", "radiance"]),
      severityLevel: 1,
      stepRoutine: "SPF",
      useTime: "am",
      activeIngredients: JSON.stringify([
        "Tinosorb S",
        "Tinosorb M",
        "Niacinamida",
      ]),
      ecommerceLink: "https://demo-clinic.com/produtos/protetor-solar",
    },
    {
      sku: "TRT-001",
      name: "Retinol 0.3% Noturno",
      description:
        "Tratamento noturno com retinol para renovação celular e redução de linhas finas.",
      price: 189.9,
      concernTags: JSON.stringify(["aging", "acne"]),
      skinTypeTags: JSON.stringify(["normal", "oily", "combination"]),
      objectiveTags: JSON.stringify(["anti-aging", "anti-acne"]),
      severityLevel: 2,
      stepRoutine: "treatment",
      useTime: "pm",
      activeIngredients: JSON.stringify(["Retinol 0.3%", "Esqualano"]),
      contraindications: JSON.stringify(["pregnancy", "breastfeeding"]),
      ecommerceLink: "https://demo-clinic.com/produtos/retinol",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        tenantId_sku: { tenantId: tenant.id, sku: product.sku },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...product,
      },
    });
  }
  console.log(`✅ Products: ${products.length} created`);

  // 5. Create base skin conditions
  const conditions = [
    {
      name: "acne",
      displayName: "Acne",
      description:
        "Condição inflamatória da pele caracterizada por comedões, pápulas, pústulas e nódulos.",
      category: "inflammatory",
      commonIngredients: JSON.stringify([
        "Ácido Salicílico",
        "Peróxido de Benzoíla",
        "Niacinamida",
        "Retinol",
        "Ácido Azelaico",
      ]),
      avoidIngredients: JSON.stringify([
        "Óleos comedogênicos",
        "Lanolina",
        "Álcool em alta concentração",
      ]),
      severity1Desc: "Comedões e pápulas ocasionais",
      severity2Desc: "Pápulas e pústulas frequentes em áreas amplas",
      severity3Desc: "Nódulos e cistos profundos — requer acompanhamento dermatológico",
    },
    {
      name: "hyperpigmentation",
      displayName: "Hiperpigmentação",
      description:
        "Escurecimento irregular da pele causado por excesso de melanina. Inclui melasma, manchas solares e PIH.",
      category: "pigmentation",
      commonIngredients: JSON.stringify([
        "Vitamina C",
        "Niacinamida",
        "Ácido Kójico",
        "Alfa-Arbutin",
        "Ácido Tranexâmico",
      ]),
      avoidIngredients: JSON.stringify(["Exposição solar sem proteção"]),
      severity1Desc: "Manchas leves e pontuais",
      severity2Desc: "Manchas moderadas em múltiplas áreas",
      severity3Desc: "Hiperpigmentação extensa e profunda",
    },
    {
      name: "aging",
      displayName: "Envelhecimento",
      description:
        "Sinais visíveis de envelhecimento como linhas finas, rugas, perda de firmeza e elasticidade.",
      category: "aging",
      commonIngredients: JSON.stringify([
        "Retinol",
        "Peptídeos",
        "Vitamina C",
        "Ácido Hialurônico",
        "Coenzima Q10",
      ]),
      avoidIngredients: JSON.stringify(["Álcool desnaturado"]),
      severity1Desc: "Linhas finas ao redor dos olhos",
      severity2Desc: "Rugas moderadas e perda de firmeza inicial",
      severity3Desc: "Rugas profundas e flacidez significativa",
    },
    {
      name: "dehydration",
      displayName: "Desidratação",
      description:
        "Falta de água na pele (diferente de pele seca que falta óleo). Causa opacidade e sensação de repuxamento.",
      category: "barrier",
      commonIngredients: JSON.stringify([
        "Ácido Hialurônico",
        "Glicerina",
        "Ceramidas",
        "Pantenol",
        "Ureia",
      ]),
      avoidIngredients: JSON.stringify([
        "Retinol em alta concentração",
        "AHA/BHA em excesso",
      ]),
      severity1Desc: "Opacidade leve e desconforto ocasional",
      severity2Desc: "Pele repuxada e descamação leve",
      severity3Desc: "Descamação intensa e barreira comprometida",
    },
    {
      name: "sensitivity",
      displayName: "Sensibilidade",
      description:
        "Pele reativa que apresenta vermelhidão, ardência ou irritação com facilidade.",
      category: "sensitivity",
      commonIngredients: JSON.stringify([
        "Centella Asiatica",
        "Alantoína",
        "Bisabolol",
        "Aveia Coloidal",
        "Pantenol",
      ]),
      avoidIngredients: JSON.stringify([
        "Fragrância",
        "Álcool",
        "Óleos essenciais",
        "Retinol forte",
      ]),
      severity1Desc: "Vermelhidão ocasional com produtos novos",
      severity2Desc: "Reatividade frequente, vermelhidão persistente",
      severity3Desc: "Possível rosácea — requer avaliação dermatológica",
    },
    {
      name: "rosacea",
      displayName: "Rosácea",
      description:
        "Condição crônica com vermelhidão facial persistente, vasos visíveis e possíveis pústulas.",
      category: "inflammatory",
      commonIngredients: JSON.stringify([
        "Niacinamida",
        "Centella Asiatica",
        "Ácido Azelaico",
        "Protetor Solar",
      ]),
      avoidIngredients: JSON.stringify([
        "Álcool",
        "Mentol",
        "AHA",
        "Retinol forte",
        "Fragrância",
      ]),
      severity1Desc: "Vermelhidão leve no centro do rosto",
      severity2Desc: "Vermelhidão persistente com pápulas",
      severity3Desc: "Vasos visíveis e alterações texturais — requer dermatologista",
    },
  ];

  for (const condition of conditions) {
    await prisma.skinCondition.upsert({
      where: { name: condition.name },
      update: {},
      create: condition,
    });
  }
  console.log(`✅ Skin conditions: ${conditions.length} created`);

  // 6. Create base ingredients
  const ingredients = [
    {
      name: "retinol",
      displayName: "Retinol",
      description: "Derivado de Vitamina A. Promove renovação celular e estimula colágeno.",
      category: "retinoid",
      treatsConditions: JSON.stringify(["aging", "acne"]),
      skinTypes: JSON.stringify(["normal", "oily", "combination"]),
      contraindications: JSON.stringify(["pregnancy", "breastfeeding"]),
    },
    {
      name: "niacinamide",
      displayName: "Niacinamida",
      description: "Vitamina B3. Regula oleosidade, reduz poros e uniformiza o tom.",
      category: "vitamin",
      treatsConditions: JSON.stringify(["acne", "hyperpigmentation", "rosacea"]),
      skinTypes: JSON.stringify(["oily", "combination", "normal", "sensitive"]),
    },
    {
      name: "salicylic_acid",
      displayName: "Ácido Salicílico",
      description: "BHA lipossolúvel que penetra nos poros, desobstruindo e prevenindo acne.",
      category: "bha",
      treatsConditions: JSON.stringify(["acne"]),
      skinTypes: JSON.stringify(["oily", "combination"]),
    },
    {
      name: "hyaluronic_acid",
      displayName: "Ácido Hialurônico",
      description: "Molécula que atrai e retém água, proporcionando hidratação profunda.",
      category: "humectant",
      treatsConditions: JSON.stringify(["dehydration", "aging"]),
      skinTypes: JSON.stringify(["dry", "normal", "combination", "sensitive", "oily"]),
    },
    {
      name: "vitamin_c",
      displayName: "Vitamina C",
      description: "Antioxidante potente que ilumina, protege e estimula colágeno.",
      category: "antioxidant",
      treatsConditions: JSON.stringify(["hyperpigmentation", "aging"]),
      skinTypes: JSON.stringify(["normal", "oily", "combination", "dry"]),
    },
    {
      name: "ceramides",
      displayName: "Ceramidas",
      description: "Lipídios naturais da pele que fortalecem a barreira cutânea.",
      category: "lipid",
      treatsConditions: JSON.stringify(["dehydration", "sensitivity"]),
      skinTypes: JSON.stringify(["dry", "sensitive", "normal"]),
    },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient,
    });
  }
  console.log(`✅ Ingredients: ${ingredients.length} created`);

  console.log("\n🎉 Seed complete!");
  console.log("   Admin login: admin@skinner.com.br / admin123");
  console.log("   B2B login:   clinica@demo.com / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
