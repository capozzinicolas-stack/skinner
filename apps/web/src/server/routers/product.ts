import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure } from "../trpc";

const validConcernTags = [
  "acne",
  "hyperpigmentation",
  "aging",
  "dehydration",
  "sensitivity",
  "rosacea",
  "dark_circles",
  "pores",
  "oiliness",
  "dullness",
  "sagging",
  "acne_scars",
  "texture",
] as const;

const validSkinTypes = [
  "oily",
  "dry",
  "combination",
  "normal",
  "sensitive",
] as const;

const validObjectives = [
  "anti-aging",
  "anti-acne",
  "radiance",
  "hydration",
  "sensitivity",
  "firmness",
  "pore-control",
  "even-tone",
  "sagging",
  "texture",
  "prevention",
] as const;

const validSteps = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "SPF",
  "treatment",
  "mask",
  "exfoliant",
  "eye-cream",
] as const;

const productInput = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  // Nullable so the form can send `null` to CLEAR the field (e.g. user
  // clicked "Remover" in the ImageUpload). `undefined` would Prisma-skip
  // the field and the old imageUrl would stick around.
  imageUrl: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  ecommerceLink: z.string().optional(),
  activeIngredients: z.string().optional(),
  concernTags: z.string(),
  skinTypeTags: z.string(),
  objectiveTags: z.string(),
  severityLevel: z.number().int().min(1).max(3).default(1),
  stepRoutine: z.string().optional(),
  useTime: z.enum(["am", "pm", "both"]).default("both"),
  contraindications: z.string().optional(),
  // Service fields
  type: z.enum(["product", "service"]).default("product"),
  bookingLink: z.string().optional(),
  sessionCount: z.number().int().min(1).optional(),
  // Free text since Oct-2026 ("a cada 4-6 meses", "manutenção anual"...).
  // The form still suggests semanal / quinzenal / mensal.
  sessionFrequency: z.string().max(60).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  // Procedure-clinic fields (see Product in schema.prisma). Nullable so the
  // form can clear them.
  serviceCategory: z.enum(["injectables", "technologies", "skin"]).nullable().optional(),
  projectionOnsetWeeks: z.number().int().min(0).max(104).nullable().optional(),
  projectionPeakWeeks: z.number().int().min(0).max(104).nullable().optional(),
  projectionImprovementPct: z.number().int().min(0).max(100).nullable().optional(),
  addOns: z.string().max(4000).nullable().optional(), // JSON [{ name, description?, price? }]
});

export const productRouter = router({
  list: tenantProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          concernTag: z.string().optional(),
          skinType: z.string().optional(),
          step: z.string().optional(),
          type: z.enum(["product", "service"]).optional(),
          activeOnly: z.boolean().default(true),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = input ?? { activeOnly: true, page: 1, pageSize: 20 };
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;
      const where: any = { tenantId: ctx.tenantId };

      if (("activeOnly" in filters) ? filters.activeOnly !== false : true) {
        where.isActive = true;
      }
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search } },
          { sku: { contains: filters.search } },
          { description: { contains: filters.search } },
        ];
      }
      if (filters.concernTag) {
        where.concernTags = { contains: filters.concernTag };
      }
      if (filters.skinType) {
        where.skinTypeTags = { contains: filters.skinType };
      }
      if (filters.step) {
        where.stepRoutine = filters.step;
      }
      if (filters.type) {
        where.type = filters.type;
      }

      const [total, items] = await Promise.all([
        ctx.db.product.count({ where }),
        ctx.db.product.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (product.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      return product;
    }),

  create: tenantProcedure.input(productInput).mutation(async ({ ctx, input }) => {
    return ctx.db.product.create({
      data: { tenantId: ctx.tenantId, ...input },
    });
  }),

  update: tenantProcedure
    .input(z.object({ id: z.string() }).merge(productInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.product.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (existing.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      const { id, ...data } = input;
      return ctx.db.product.update({ where: { id }, data });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.product.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (existing.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      return ctx.db.product.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  restore: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.product.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (existing.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      return ctx.db.product.update({
        where: { id: input.id },
        data: { isActive: true },
      });
    }),

  bulkDeactivate: tenantProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Verify all products belong to this tenant before updating
      const existing = await ctx.db.product.findMany({
        where: { id: { in: input.ids }, tenantId: ctx.tenantId },
        select: { id: true },
      });
      const validIds = existing.map((p) => p.id);
      if (validIds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      const result = await ctx.db.product.updateMany({
        where: { id: { in: validIds }, tenantId: ctx.tenantId },
        data: { isActive: false },
      });
      return { updated: result.count };
    }),

  bulkReactivate: tenantProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.product.findMany({
        where: { id: { in: input.ids }, tenantId: ctx.tenantId },
        select: { id: true },
      });
      const validIds = existing.map((p) => p.id);
      if (validIds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      const result = await ctx.db.product.updateMany({
        where: { id: { in: validIds }, tenantId: ctx.tenantId },
        data: { isActive: true },
      });
      return { updated: result.count };
    }),

  bulkCreate: tenantProcedure
    .input(z.object({ products: z.array(productInput) }))
    .mutation(async ({ ctx, input }) => {
      const results = { created: 0, errors: [] as string[] };

      for (const product of input.products) {
        try {
          await ctx.db.product.create({
            data: { tenantId: ctx.tenantId, ...product },
          });
          results.created++;
        } catch (e: any) {
          if (e.code === "P2002") {
            results.errors.push(`SKU "${product.sku}" já existe.`);
          } else {
            results.errors.push(`Erro no produto "${product.sku}": ${e.message}`);
          }
        }
      }

      return results;
    }),

  stats: tenantProcedure.query(async ({ ctx }) => {
    const [total, active, byConcern] = await Promise.all([
      ctx.db.product.count({ where: { tenantId: ctx.tenantId } }),
      ctx.db.product.count({ where: { tenantId: ctx.tenantId, isActive: true } }),
      ctx.db.product.findMany({
        where: { tenantId: ctx.tenantId, isActive: true },
        select: { concernTags: true },
      }),
    ]);

    // Count products per concern tag
    const tagCounts: Record<string, number> = {};
    for (const p of byConcern) {
      try {
        const tags = JSON.parse(p.concernTags) as string[];
        for (const tag of tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      } catch {}
    }

    return { total, active, inactive: total - active, tagCounts };
  }),

  // Reference data for forms — queries DB first, falls back to hardcoded constants
  tagOptions: tenantProcedure.query(async ({ ctx }) => {
    const [dbConditions, dbIngredients] = await Promise.all([
      ctx.db.skinCondition.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      ctx.db.ingredient.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const concerns =
      dbConditions.length > 0
        ? dbConditions.map((c) => c.name)
        : [...validConcernTags];

    const ingredients =
      dbIngredients.length > 0
        ? dbIngredients.map((i) => i.name)
        : [];

    return {
      concerns,
      ingredients,
      skinTypes: [...validSkinTypes],
      objectives: [...validObjectives],
      steps: [...validSteps],
    };
  }),

  // ─── Procedure library (Oct-2026) ─────────────────────────────────────────
  // Global Skinner-maintained procedures the clinic can import into its own
  // catalog. `imported` flags items already present (by libraryItemId) so the
  // UI can disable them.
  libraryList: tenantProcedure.query(async ({ ctx }) => {
    const [items, existing] = await Promise.all([
      ctx.db.procedureLibraryItem.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      }),
      ctx.db.product.findMany({
        where: { tenantId: ctx.tenantId, libraryItemId: { not: null } },
        select: { libraryItemId: true },
      }),
    ]);
    const importedIds = new Set(existing.map((p) => p.libraryItemId));
    return items.map((item) => ({ ...item, imported: importedIds.has(item.id) }));
  }),

  // Copies library items into the tenant catalog as services. SKU is
  // "PROC-<slug>"; items already imported (or whose SKU exists) are skipped,
  // never overwritten — the clinic may have renamed/repriced its copy.
  importFromLibrary: tenantProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(100),
        bookingLink: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.procedureLibraryItem.findMany({
        where: { id: { in: input.ids }, isActive: true },
      });
      const result = { created: 0, skipped: 0 };
      for (const item of items) {
        const sku = `PROC-${item.slug}`;
        const already = await ctx.db.product.findFirst({
          where: {
            tenantId: ctx.tenantId,
            OR: [{ libraryItemId: item.id }, { sku }],
          },
          select: { id: true },
        });
        if (already) {
          result.skipped++;
          continue;
        }
        await ctx.db.product.create({
          data: {
            tenantId: ctx.tenantId,
            sku,
            name: item.name,
            description: item.description,
            price: item.suggestedPrice,
            type: "service",
            concernTags: item.concernTags,
            skinTypeTags: item.skinTypeTags,
            objectiveTags: item.objectiveTags,
            severityLevel: item.severityLevel,
            activeIngredients: item.activeIngredients,
            contraindications: item.contraindications,
            sessionCount: item.sessionCount,
            sessionFrequency: item.sessionFrequency,
            durationMinutes: item.durationMinutes,
            bookingLink: input.bookingLink || null,
            serviceCategory: item.category,
            projectionOnsetWeeks: item.projectionOnsetWeeks,
            projectionPeakWeeks: item.projectionPeakWeeks,
            projectionImprovementPct: item.projectionImprovementPct,
            addOns: item.addOns,
            libraryItemId: item.id,
          },
        });
        result.created++;
      }
      return result;
    }),

  // Returns all active products for CSV export (no pagination)
  exportList: tenantProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          concernTag: z.string().optional(),
          step: z.string().optional(),
          type: z.enum(["product", "service"]).optional(),
          activeOnly: z.boolean().default(true),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = input ?? { activeOnly: true };
      const where: any = { tenantId: ctx.tenantId };

      if (("activeOnly" in filters) ? filters.activeOnly !== false : true) {
        where.isActive = true;
      }
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search } },
          { sku: { contains: filters.search } },
          { description: { contains: filters.search } },
        ];
      }
      if (filters.concernTag) {
        where.concernTags = { contains: filters.concernTag };
      }
      if (filters.step) {
        where.stepRoutine = filters.step;
      }
      if (filters.type) {
        where.type = filters.type;
      }

      return ctx.db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }),
});
