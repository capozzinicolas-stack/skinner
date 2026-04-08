import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure, publicProcedure } from "../trpc";

const kitItemInput = z.object({
  productId: z.string(),
  rank: z.number().int().min(1),
  note: z.string().optional(),
});

export const kitRouter = router({
  // List all manual kits for the authenticated tenant
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.kit.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          orderBy: { rank: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stepRoutine: true,
                type: true,
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });
  }),

  // Get a single kit by tenant slug + kit slug (public)
  getBySlug: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        kitSlug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({
        where: { slug: input.tenantSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          disclaimer: true,
        },
      });

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const kit = await ctx.db.kit.findUnique({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: input.kitSlug,
          },
        },
        include: {
          items: {
            orderBy: { rank: "asc" },
            include: { product: true },
          },
        },
      });

      if (!kit || !kit.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { tenant, kit };
    }),

  // Create a manual kit
  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
        discount: z.number().min(0).max(100).optional(),
        targetConditions: z.array(z.string()).optional(),
        targetSkinTypes: z.array(z.string()).optional(),
        items: z.array(kitItemInput).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, targetConditions, targetSkinTypes, ...kitData } = input;

      const kit = await ctx.db.kit.create({
        data: {
          tenantId: ctx.tenantId,
          ...kitData,
          targetConditions: targetConditions
            ? JSON.stringify(targetConditions)
            : undefined,
          targetSkinTypes: targetSkinTypes
            ? JSON.stringify(targetSkinTypes)
            : undefined,
        },
      });

      if (items && items.length > 0) {
        await ctx.db.kitItem.createMany({
          data: items.map((item) => ({
            kitId: kit.id,
            productId: item.productId,
            rank: item.rank,
            note: item.note,
          })),
        });
      }

      return ctx.db.kit.findUniqueOrThrow({
        where: { id: kit.id },
        include: {
          items: {
            orderBy: { rank: "asc" },
            include: { product: true },
          },
        },
      });
    }),

  // Update kit details and replace items
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional(),
        discount: z.number().min(0).max(100).nullable().optional(),
        isActive: z.boolean().optional(),
        targetConditions: z.array(z.string()).optional(),
        targetSkinTypes: z.array(z.string()).optional(),
        items: z.array(kitItemInput).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.kit.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (existing.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, items, targetConditions, targetSkinTypes, ...kitData } = input;

      await ctx.db.kit.update({
        where: { id },
        data: {
          ...kitData,
          targetConditions:
            targetConditions !== undefined
              ? JSON.stringify(targetConditions)
              : undefined,
          targetSkinTypes:
            targetSkinTypes !== undefined
              ? JSON.stringify(targetSkinTypes)
              : undefined,
        },
      });

      // If items were passed, replace them entirely
      if (items !== undefined) {
        await ctx.db.kitItem.deleteMany({ where: { kitId: id } });
        if (items.length > 0) {
          await ctx.db.kitItem.createMany({
            data: items.map((item) => ({
              kitId: id,
              productId: item.productId,
              rank: item.rank,
              note: item.note,
            })),
          });
        }
      }

      return ctx.db.kit.findUniqueOrThrow({
        where: { id },
        include: {
          items: {
            orderBy: { rank: "asc" },
            include: { product: true },
          },
        },
      });
    }),

  // Soft delete (isActive = false)
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.kit.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (existing.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.kit.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  // Add a product to a kit
  addItem: tenantProcedure
    .input(
      z.object({
        kitId: z.string(),
        productId: z.string(),
        rank: z.number().int().min(1),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const kit = await ctx.db.kit.findUniqueOrThrow({
        where: { id: input.kitId },
      });
      if (kit.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify product belongs to tenant
      const product = await ctx.db.product.findUniqueOrThrow({
        where: { id: input.productId },
      });
      if (product.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.kitItem.create({
        data: {
          kitId: input.kitId,
          productId: input.productId,
          rank: input.rank,
          note: input.note,
        },
        include: { product: true },
      });
    }),

  // Remove a product from a kit
  removeItem: tenantProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.kitItem.findUniqueOrThrow({
        where: { id: input.itemId },
        include: { kit: true },
      });
      if (item.kit.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.kitItem.delete({ where: { id: input.itemId } });
    }),

  // List auto-generated kits from analyses (analyses with a kitLink)
  listAutoGenerated: tenantProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;

      const where: any = {
        tenantId: ctx.tenantId,
        status: "completed",
        NOT: { kitLink: null },
      };

      const [total, items] = await Promise.all([
        ctx.db.analysis.count({ where }),
        ctx.db.analysis.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            skinType: true,
            conditions: true,
            kitLink: true,
            createdAt: true,
            recommendations: {
              select: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
              orderBy: { rank: "asc" },
            },
          },
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
});
