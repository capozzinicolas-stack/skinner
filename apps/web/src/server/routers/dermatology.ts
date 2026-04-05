import { z } from "zod/v4";
import { router, adminProcedure, publicProcedure } from "../trpc";

export const dermatologyRouter = router({
  // Skin conditions
  listConditions: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.skinCondition.findMany({ orderBy: { name: "asc" } });
  }),

  createCondition: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).regex(/^[a-z_]+$/),
        displayName: z.string().min(2),
        description: z.string(),
        category: z.enum([
          "inflammatory",
          "pigmentation",
          "aging",
          "barrier",
          "sensitivity",
        ]),
        commonIngredients: z.string().optional(),
        avoidIngredients: z.string().optional(),
        baseRoutine: z.string().optional(),
        alertSigns: z.string().optional(),
        severity1Desc: z.string().optional(),
        severity2Desc: z.string().optional(),
        severity3Desc: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.skinCondition.create({ data: input });
    }),

  updateCondition: adminProcedure
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().min(2).optional(),
        description: z.string().optional(),
        commonIngredients: z.string().optional(),
        avoidIngredients: z.string().optional(),
        baseRoutine: z.string().optional(),
        alertSigns: z.string().optional(),
        severity1Desc: z.string().optional(),
        severity2Desc: z.string().optional(),
        severity3Desc: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.skinCondition.update({ where: { id }, data });
    }),

  deleteCondition: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.skinCondition.delete({ where: { id: input.id } });
    }),

  // Ingredients
  listIngredients: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.ingredient.findMany({ orderBy: { name: "asc" } });
  }),

  createIngredient: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).regex(/^[a-z_]+$/),
        displayName: z.string().min(2),
        description: z.string().optional(),
        category: z.string().optional(),
        treatsConditions: z.string().optional(),
        skinTypes: z.string().optional(),
        contraindications: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ingredient.create({ data: input });
    }),

  updateIngredient: adminProcedure
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().min(2).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        treatsConditions: z.string().optional(),
        skinTypes: z.string().optional(),
        contraindications: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.ingredient.update({ where: { id }, data });
    }),

  deleteIngredient: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ingredient.delete({ where: { id: input.id } });
    }),
});
