/**
 * Procedure-clinic segment data (Oct-2026). Idempotent and safe to re-run.
 *
 *   1. Upserts the two conditions introduced by the clinic questionnaire:
 *      "acne_scars" and "texture" (with Gemini visualEditPrompt).
 *   2. Creates any missing ProcedureLibraryItem from data/procedure-library.ts.
 *      Existing library rows are NOT overwritten (admins edit them in
 *      /admin/biblioteca).
 *
 * Does not create users or touch tenants. Usage (packages/db, DATABASE_URL set):
 *   pnpm db:seed:clinic-segment
 */
import { PrismaClient } from "../generated/client";
import { PROCEDURE_LIBRARY } from "./data/procedure-library";

const prisma = new PrismaClient();

const NEW_CONDITIONS = [
  {
    name: "acne_scars",
    displayName: "Cicatrizes de acne",
    description:
      "Marcas deprimidas ou irregulares deixadas por lesões de acne, que alteram a textura e o relevo da pele.",
    category: "texture",
    commonIngredients: JSON.stringify(["Retinol", "Ácido Glicólico", "Vitamina C", "Peptídeos"]),
    avoidIngredients: JSON.stringify([]),
    severity1Desc: "Marcas superficiais e pouco numerosas",
    severity2Desc: "Cicatrizes visíveis em várias áreas do rosto",
    severity3Desc: "Cicatrizes profundas e numerosas",
    visualEditPrompt:
      "Smooth and fill in visible acne scars and pitted marks by approximately {intensity}% (more even skin surface and relief, natural texture preserved)",
  },
  {
    name: "texture",
    displayName: "Textura irregular",
    description:
      "Superfície da pele irregular, com poros aparentes, aspereza e falta de uniformidade ao toque e à luz.",
    category: "texture",
    commonIngredients: JSON.stringify(["Ácido Glicólico", "Retinol", "Niacinamida", "Ácido Salicílico"]),
    avoidIngredients: JSON.stringify([]),
    severity1Desc: "Leve aspereza e poros discretos",
    severity2Desc: "Textura irregular e poros aparentes em várias áreas",
    severity3Desc: "Textura muito irregular com poros dilatados e marcas",
    visualEditPrompt:
      "Refine skin texture and reduce the appearance of enlarged pores by approximately {intensity}% (smoother, more even and luminous skin surface)",
  },
];

async function main() {
  for (const c of NEW_CONDITIONS) {
    await prisma.skinCondition.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
  }
  console.log(`Conditions: ${NEW_CONDITIONS.map((c) => c.name).join(", ")}`);

  let created = 0;
  let synced = 0;
  for (const [i, p] of PROCEDURE_LIBRARY.entries()) {
    const existing = await prisma.procedureLibraryItem.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // SYNC_LIBRARY_TEXT=1 refreshes only the patient-facing texts (name,
      // description, add-ons) from the data file — used for wording fixes.
      // Prices, tags and curves edited by admins are never touched.
      if (process.env.SYNC_LIBRARY_TEXT === "1") {
        await prisma.procedureLibraryItem.update({
          where: { slug: p.slug },
          data: { name: p.name, description: p.description, addOns: JSON.stringify(p.addOns) },
        });
        synced++;
      }
      continue;
    }
    await prisma.procedureLibraryItem.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        concernTags: JSON.stringify(p.concernTags),
        skinTypeTags: JSON.stringify(p.skinTypeTags),
        objectiveTags: JSON.stringify(p.objectiveTags),
        severityLevel: p.severityLevel,
        activeIngredients: JSON.stringify(p.activeIngredients),
        contraindications: JSON.stringify(p.contraindications),
        sessionCount: p.sessionCount,
        sessionFrequency: p.sessionFrequency,
        durationMinutes: p.durationMinutes,
        suggestedPrice: p.suggestedPrice,
        projectionOnsetWeeks: p.projectionOnsetWeeks,
        projectionPeakWeeks: p.projectionPeakWeeks,
        projectionImprovementPct: p.projectionImprovementPct,
        addOns: JSON.stringify(p.addOns),
        displayOrder: i,
      },
    });
    created++;
  }
  console.log(`Procedure library: ${created} created, ${PROCEDURE_LIBRARY.length - created} already present, ${synced} texts synced`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
