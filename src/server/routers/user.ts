/**
 * User Router
 * User profile and management
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

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
   * Update user role (admin/superadmin only)
   */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        isAdmin: z.boolean(),
        isSuperAdmin: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, isAdmin, isSuperAdmin } = input;

      // Only super admins can assign super admin or admin roles
      if ((isAdmin || isSuperAdmin) && !ctx.userEntity.isSuperAdmin()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only super admins can assign admin or super admin roles',
        });
      }

      // Determine role level and name
      let roleLevel = 40; // User
      let roleName = 'user';

      if (isSuperAdmin) {
        roleLevel = 100;
        roleName = 'super_admin';
      } else if (isAdmin) {
        roleLevel = 80;
        roleName = 'admin';
      }

      // Find or create the role
      let { data: role } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('level', roleLevel)
        .single();

      if (!role) {
        // Create the role if it doesn't exist
        const { data: newRole, error: createError } = await supabaseAdmin
          .from('roles')
          .insert({
            name: roleName,
            level: roleLevel,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create role',
          });
        }
        role = newRole;
      }

      // Update user_roles (remove old roles first, then add new)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);

      const { error: assignError } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role_id: role.id,
        created_at: new Date().toISOString(),
      });

      if (assignError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign role to user',
        });
      }

      return { message: 'User role updated successfully' };
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
