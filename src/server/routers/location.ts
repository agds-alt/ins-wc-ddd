/**
 * Location Router
 * CRUD operations for toilet locations
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const locationRouter = router({
  /**
   * Create location
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        building_id: z.string().uuid(),
        organization_id: z.string().uuid(),
        code: z.string().optional(),
        floor: z.string().optional(),
        area: z.string().optional(),
        section: z.string().optional(),
        building: z.string().optional(),
        description: z.string().optional(),
        photo_url: z.string().url().optional(),
        coordinates: z
          .object({
            latitude: z.number(),
            longitude: z.number(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique QR code
      const qr_code = await ctx.services.qrCode.generateUniqueQRCode();

      const location = await ctx.repositories.location.create({
        ...input,
        qr_code,
        created_by: ctx.user.userId,
      });

      return location.toObject();
    }),

  /**
   * List locations
   */
  list: protectedProcedure
    .input(
      z
        .object({
          building_id: z.string().uuid().optional(),
          organization_id: z.string().uuid().optional(),
          floor: z.string().optional(),
          area: z.string().optional(),
          is_active: z.boolean().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const locations = await ctx.repositories.location.findAll(input, input?.limit);
      return locations.map((l) => l.toObject());
    }),

  /**
   * Get location by ID
   */
  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const location = await ctx.repositories.location.findById(input);

    if (!location) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
    }

    return location.toObject();
  }),

  /**
   * Get location by QR code
   */
  getByQRCode: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const location = await ctx.repositories.location.findByQRCode(input);

    if (!location) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
    }

    return location.toObject();
  }),

  /**
   * Get location with inspection history
   */
  getWithInspections: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const result = await ctx.services.inspection.getLocationInspections(input, 50);

    return {
      ...result.inspections[0]?.toObject(),
      stats: result.stats,
    };
  }),

  /**
   * Update location
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        code: z.string().optional(),
        floor: z.string().optional(),
        area: z.string().optional(),
        section: z.string().optional(),
        building: z.string().optional(),
        description: z.string().optional(),
        photo_url: z.string().url().optional(),
        coordinates: z
          .object({
            latitude: z.number(),
            longitude: z.number(),
          })
          .optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const location = await ctx.repositories.location.update(id, data);
      return location.toObject();
    }),

  /**
   * Regenerate QR code
   */
  regenerateQR: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    const location = await ctx.services.qrCode.regenerateQRCode(input);
    return location.toObject();
  }),

  /**
   * Activate location
   */
  activate: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.location.activate(input);
    return { message: 'Location activated' };
  }),

  /**
   * Deactivate location
   */
  deactivate: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.location.deactivate(input);
    return { message: 'Location deactivated' };
  }),

  /**
   * Delete location
   */
  delete: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.location.delete(input);
    return { message: 'Location deleted' };
  }),

  /**
   * Count locations
   */
  count: protectedProcedure
    .input(
      z
        .object({
          building_id: z.string().uuid().optional(),
          organization_id: z.string().uuid().optional(),
          is_active: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.repositories.location.count(input);
    }),
});
