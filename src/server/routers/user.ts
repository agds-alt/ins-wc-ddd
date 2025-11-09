/**
 * User Router
 * User profile and management
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  /**
   * Get user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.repositories.user.findByIdWithRole(ctx.user.userId);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return user.toSafeObject();
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        full_name: z.string().min(2).optional(),
        phone: z.string().optional(),
        occupation_id: z.string().uuid().optional(),
        profile_photo_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.repositories.user.update(ctx.user.userId, input);
      return updated.toSafeObject();
    }),

  /**
   * List all users (admin only)
   */
  list: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          is_active: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.repositories.user.findAll(input, input?.limit);
      return users.map((u) => u.toSafeObject());
    }),

  /**
   * Get user by ID (admin only)
   */
  getById: adminProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const user = await ctx.repositories.user.findByIdWithRole(input);
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    return user.toSafeObject();
  }),

  /**
   * Activate user (admin only)
   */
  activate: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.user.activate(input);
    return { message: 'User activated successfully' };
  }),

  /**
   * Deactivate user (admin only)
   */
  deactivate: adminProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.repositories.user.deactivate(input);
    return { message: 'User deactivated successfully' };
  }),

  /**
   * Get user count
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
      return await ctx.repositories.user.count(input);
    }),
});
