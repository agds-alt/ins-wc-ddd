/**
 * Organization Router
 * CRUD operations for organizations
 */

import { router, protectedProcedure, adminProcedure, superAdminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const organizationRouter = router({
  /**
   * Create organization (super admin only)
   */
  create: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        short_code: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logo_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if short code exists
      const exists = await ctx.repositories.organization.shortCodeExists(input.short_code);
      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Organization code already exists',
        });
      }

      const organization = await ctx.repositories.organization.create({
        ...input,
        created_by: ctx.user.userId,
      });

      return organization.toObject();
    }),

  /**
   * List organizations
   */
  list: protectedProcedure
    .input(
      z
        .object({
          is_active: z.boolean().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const organizations = await ctx.repositories.organization.findAll(input, input?.limit);
      return organizations.map((o) => o.toObject());
    }),

  /**
   * Get organization by ID
   */
  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const organization = await ctx.repositories.organization.findById(input);

    if (!organization) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
    }

    return organization.toObject();
  }),

  /**
   * Update organization (super admin only)
   */
  update: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        short_code: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logo_url: z.string().url().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, short_code, ...data } = input;

      // Check if short code exists (excluding current org)
      if (short_code) {
        const exists = await ctx.repositories.organization.shortCodeExists(short_code, id);
        if (exists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Organization code already exists',
          });
        }
      }

      const organization = await ctx.repositories.organization.update(id, {
        ...data,
        short_code,
      });

      return organization.toObject();
    }),

  /**
   * Activate organization (super admin only)
   */
  activate: superAdminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.organization.activate(input);
    return { message: 'Organization activated' };
  }),

  /**
   * Deactivate organization (super admin only)
   */
  deactivate: superAdminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.organization.deactivate(input);
    return { message: 'Organization deactivated' };
  }),

  /**
   * Delete organization (super admin only)
   */
  delete: superAdminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    // TODO: Check if organization has buildings/locations before deleting
    await ctx.repositories.organization.delete(input);
    return { message: 'Organization deleted' };
  }),

  /**
   * Count organizations
   */
  count: adminProcedure
    .input(
      z
        .object({
          is_active: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.repositories.organization.count(input);
    }),
});
