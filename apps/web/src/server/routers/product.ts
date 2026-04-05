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
  imageUrl: z.string().optional(),
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
      if (filters.skinType) {
        where.skinTypeTags = { contains: filters.skinType };
      }
      if (filters.step) {
        where.stepRoutine = filters.step;
      }

      return ctx.db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (product.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
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
        throw new TRPCError({ code: "NOT_FOUND" });
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
        throw new TRPCError({ code: "NOT_FOUND" });
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
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.product.update({
        where: { id: input.id },
        data: { isActive: true },
      });
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

  // Reference data for forms
  tagOptions: tenantProcedure.query(() => ({
    concerns: validConcernTags,
    skinTypes: validSkinTypes,
    objectives: validObjectives,
    steps: validSteps,
  })),
});
