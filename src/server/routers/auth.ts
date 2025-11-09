/**
 * Auth Router
 * Handles authentication: login, register, logout
 */

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { setAuthCookie, deleteAuthCookie } from '@/infrastructure/auth/cookies';
import { validatePasswordStrength } from '@/infrastructure/auth/password';

export const authRouter = router({
  /**
   * Login
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Authenticate using AuthService
        const result = await ctx.services.auth.login(input.email, input.password);

        // Set cookie with JWT token
        await setAuthCookie(result.token);

        // Return user (without sensitive data)
        return {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            role: result.user.role,
            isActive: result.user.isActive,
          },
          token: result.token,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error instanceof Error ? error.message : 'Invalid credentials',
        });
      }
    }),

  /**
   * Register new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        full_name: z.string().min(2, 'Name must be at least 2 characters'),
        phone: z.string().optional(),
        occupation_id: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate password strength
      const passwordError = validatePasswordStrength(input.password);
      if (passwordError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordError,
        });
      }

      try {
        // Register using AuthService
        const user = await ctx.services.auth.register({
          email: input.email,
          password: input.password,
          full_name: input.full_name,
          phone: input.phone,
          occupation_id: input.occupation_id,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            isActive: user.isActive,
          },
          message: 'Registration successful. Please login.',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Registration failed',
        });
      }
    }),

  /**
   * Logout
   */
  logout: protectedProcedure.mutation(async () => {
    await deleteAuthCookie();

    return {
      message: 'Logged out successfully',
    };
  }),

  /**
   * Get current user
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.repositories.user.findByIdWithRole(ctx.user.userId);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      profilePhotoUrl: user.profilePhotoUrl,
      occupationId: user.occupationId,
      role: user.role,
      roleLevel: user.roleLevel,
      isActive: user.isActive,
      isAdmin: user.isAdmin(),
      isSuperAdmin: user.isSuperAdmin(),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.auth.requestPasswordReset(input.email);

      // Always return success (don't reveal if email exists)
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate password strength
      const passwordError = validatePasswordStrength(input.newPassword);
      if (passwordError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordError,
        });
      }

      try {
        await ctx.services.auth.resetPassword(input.token, input.newPassword);

        return {
          message: 'Password reset successful. Please login with your new password.',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Password reset failed',
        });
      }
    }),

  /**
   * Change password (authenticated)
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate password strength
      const passwordError = validatePasswordStrength(input.newPassword);
      if (passwordError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordError,
        });
      }

      try {
        await ctx.services.auth.changePassword(
          ctx.user.userId,
          input.oldPassword,
          input.newPassword
        );

        return {
          message: 'Password changed successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Password change failed',
        });
      }
    }),
});
