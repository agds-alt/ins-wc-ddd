/**
 * Inspection Template Router
 * CRUD operations for inspection templates
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export const templateRouter = router({
  /**
   * Get default template
   */
  getDefault: protectedProcedure.query(async () => {
    const { data, error } = await supabaseAdmin
      .from('inspection_templates')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Default inspection template not found. Please run /api/seed first.',
      });
    }

    return data;
  }),

  /**
   * List templates
   */
  list: protectedProcedure
    .input(
      z
        .object({
          is_active: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin.from('inspection_templates').select('*');

      if (input?.is_active !== undefined) {
        query = query.eq('is_active', input.is_active);
      }

      query = query.order('is_default', { ascending: false }).limit(input?.limit || 50);

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return data || [];
    }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const { data, error } = await supabaseAdmin
      .from('inspection_templates')
      .select('*')
      .eq('id', input)
      .single();

    if (error || !data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Template not found',
      });
    }

    return data;
  }),

  /**
   * Create template (admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        fields: z.record(z.any()),
        estimated_time: z.number().int().min(1).optional(),
        is_default: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabaseAdmin
        .from('inspection_templates')
        .insert({
          ...input,
          is_active: true,
          created_by: ctx.user.userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Update template (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        fields: z.record(z.any()).optional(),
        estimated_time: z.number().int().min(1).optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      const { data, error } = await supabaseAdmin
        .from('inspection_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Delete template (admin only)
   */
  delete: adminProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
    const { error } = await supabaseAdmin.from('inspection_templates').delete().eq('id', input);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }

    return { message: 'Template deleted successfully' };
  }),
});
