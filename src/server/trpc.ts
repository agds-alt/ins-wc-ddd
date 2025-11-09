/**
 * tRPC Setup
 * Main tRPC configuration with middleware
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';

// Initialize tRPC with context
const t = initTRPC.context<Context>().create({
  transformer: superjson, // Allows sending Date, Map, Set, etc.
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

// Export base router and procedure
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Authenticated procedure
 * Throws error if user is not authenticated
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now user is guaranteed to be non-null
    },
  });
});

/**
 * Admin procedure
 * Throws error if user is not admin
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userEntity = await ctx.repositories.user.findByIdWithRole(ctx.user.userId);

  if (!userEntity || !userEntity.isAdmin()) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userEntity, // Include full user entity with role
    },
  });
});

/**
 * Super Admin procedure
 * Throws error if user is not super admin
 */
export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userEntity = await ctx.repositories.user.findByIdWithRole(ctx.user.userId);

  if (!userEntity || !userEntity.isSuperAdmin()) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a super admin to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userEntity, // Include full user entity with role
    },
  });
});

/**
 * Middleware for logging (development only)
 */
export const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  const result = await next();

  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[tRPC] ${type} ${path} - ${duration}ms`);
  }

  return result;
});

// Export middleware
export const middleware = t.middleware;
