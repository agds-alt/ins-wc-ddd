/**
 * Building Router
 * CRUD operations for buildings
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const buildingRouter = router({
  /**
   * Create building
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        short_code: z
          .string()
          .min(2)
          .max(10)
          .regex(/^[A-Z0-9]+$/, 'Short code must be uppercase letters and numbers only (e.g., BLDG01)'),
        organization_id: z.string().uuid(),
        address: z.string().optional(),
        type: z.string().optional(),
        total_floors: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if short code exists
        const exists = await ctx.repositories.building.shortCodeExists(input.short_code);
        if (exists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Building code already exists',
          });
        }

        const building = await ctx.repositories.building.create({
          ...input,
          created_by: ctx.user.userId,
        });

        return building.toObject();
      } catch (error) {
        // If it's already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }

        // Otherwise, wrap the error with more details
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create building: ${errorMessage}`,
        });
      }
    }),

  /**
   * List buildings
   */
  list: protectedProcedure
    .input(
      z
        .object({
          organization_id: z.string().uuid().optional(),
          is_active: z.boolean().optional(),
          type: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const buildings = await ctx.repositories.building.findAll(input, input?.limit);
      return buildings.map((b) => b.toObject());
    }),

  /**
   * Get building by ID
   */
  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const building = await ctx.repositories.building.findById(input);

    if (!building) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Building not found' });
    }

    return building.toObject();
  }),

  /**
   * Update building
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        short_code: z.string().min(1).optional(),
        address: z.string().optional(),
        type: z.string().optional(),
        total_floors: z.number().int().min(1).optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, short_code, ...data } = input;

      // Check if short code exists (excluding current building)
      if (short_code) {
        const exists = await ctx.repositories.building.shortCodeExists(short_code, id);
        if (exists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Building code already exists',
          });
        }
      }

      const building = await ctx.repositories.building.update(id, {
        ...data,
        short_code,
      });

      return building.toObject();
    }),

  /**
   * Activate building
   */
  activate: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.building.activate(input);
    return { message: 'Building activated' };
  }),

  /**
   * Deactivate building
   */
  deactivate: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.building.deactivate(input);
    return { message: 'Building deactivated' };
  }),

  /**
   * Delete building
   */
  delete: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    // TODO: Check if building has locations before deleting
    await ctx.repositories.building.delete(input);
    return { message: 'Building deleted' };
  }),

  /**
   * Count buildings
   */
  count: protectedProcedure
    .input(
      z
        .object({
          organization_id: z.string().uuid().optional(),
          is_active: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.repositories.building.count(input);
    }),
});
