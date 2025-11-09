/**
 * Inspection Router
 * CRUD operations for toilet inspections
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const inspectionStatusEnum = z.enum(['excellent', 'good', 'fair', 'poor']);

export const inspectionRouter = router({
  /**
   * Create inspection
   */
  create: protectedProcedure
    .input(
      z.object({
        location_id: z.string().uuid(),
        template_id: z.string().uuid(),
        inspection_date: z.string(),
        inspection_time: z.string(),
        overall_status: inspectionStatusEnum,
        responses: z.record(z.any()),
        notes: z.string().optional(),
        photo_urls: z.array(z.string().url()).optional(),
        duration_seconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inspection = await ctx.services.inspection.createInspection({
        ...input,
        user_id: ctx.user.userId,
      });

      return inspection.toObject();
    }),

  /**
   * Create from QR scan
   */
  createFromScan: protectedProcedure
    .input(
      z.object({
        qr_code: z.string(),
        template_id: z.string().uuid(),
        inspection_date: z.string(),
        inspection_time: z.string(),
        overall_status: inspectionStatusEnum,
        responses: z.record(z.any()),
        notes: z.string().optional(),
        photo_urls: z.array(z.string().url()).optional(),
        duration_seconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { qr_code, ...data } = input;

      const inspection = await ctx.services.inspection.createFromScan(
        qr_code,
        ctx.user.userId,
        data
      );

      return inspection.toObject();
    }),

  /**
   * List inspections
   */
  list: protectedProcedure
    .input(
      z
        .object({
          location_id: z.string().uuid().optional(),
          building_id: z.string().uuid().optional(),
          organization_id: z.string().uuid().optional(),
          overall_status: inspectionStatusEnum.optional(),
          date_from: z.string().optional(),
          date_to: z.string().optional(),
          verified: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const inspections = await ctx.repositories.inspection.findAll(
        input,
        input?.limit,
        input?.offset
      );

      return inspections.map((i) => i.toObject());
    }),

  /**
   * Get inspection by ID
   */
  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const inspection = await ctx.repositories.inspection.findById(input);

    if (!inspection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inspection not found' });
    }

    return inspection.toObject();
  }),

  /**
   * Get user's inspections
   */
  myInspections: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const inspections = await ctx.services.inspection.getUserInspections(
        ctx.user.userId,
        input?.limit
      );

      return inspections.map((i) => i.toObject());
    }),

  /**
   * Get recent inspections
   */
  recent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const inspections = await ctx.repositories.inspection.findRecent(input?.limit);
      return inspections.map((i) => i.toObject());
    }),

  /**
   * Verify inspection (admin only)
   */
  verify: adminProcedure
    .input(
      z.object({
        inspection_id: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inspection = await ctx.services.inspection.verifyInspection(
        input.inspection_id,
        ctx.user.userId,
        input.notes
      );

      return inspection.toObject();
    }),

  /**
   * Get pending verifications (admin only)
   */
  pendingVerifications: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const inspections = await ctx.services.inspection.getPendingVerifications(input?.limit);
      return inspections.map((i) => i.toObject());
    }),

  /**
   * Get inspections needing attention
   */
  needingAttention: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const inspections = await ctx.services.inspection.getInspectionsNeedingAttention(
        input?.limit
      );
      return inspections.map((i) => i.toObject());
    }),

  /**
   * Get dashboard stats
   */
  stats: protectedProcedure
    .input(
      z
        .object({
          organization_id: z.string().uuid().optional(),
          building_id: z.string().uuid().optional(),
          location_id: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.services.inspection.getDashboardStats(input);
    }),

  /**
   * Delete inspection
   */
  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.services.inspection.deleteInspection(input, ctx.user.userId);
    return { message: 'Inspection deleted successfully' };
  }),

  /**
   * Count inspections
   */
  count: protectedProcedure
    .input(
      z
        .object({
          location_id: z.string().uuid().optional(),
          overall_status: inspectionStatusEnum.optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.repositories.inspection.count(input);
    }),
});
