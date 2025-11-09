/**
 * Audit Router
 * Audit log operations (placeholder - implement when audit_logs table exists)
 */

import { router, adminProcedure } from '../trpc';
import { z } from 'zod';

export const auditRouter = router({
  /**
   * List audit logs
   */
  list: adminProcedure
    .input(
      z
        .object({
          user_id: z.string().uuid().optional(),
          entity_type: z
            .enum(['user', 'inspection', 'location', 'building', 'organization', 'photo'])
            .optional(),
          entity_id: z.string().uuid().optional(),
          action: z
            .enum(['create', 'update', 'delete', 'login', 'logout', 'verify', 'approve', 'reject'])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.repositories.auditLog.findAll(input, input?.limit);

      return logs.map((log) => log.toObject());
    }),

  /**
   * Get audit log by ID
   */
  getById: adminProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const log = await ctx.repositories.auditLog.findById(input);

    return log?.toObject();
  }),

  /**
   * Get user's audit history
   */
  userHistory: adminProcedure
    .input(
      z.object({
        user_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.repositories.auditLog.findByUser(input.user_id, input.limit);

      return logs.map((log) => log.toObject());
    }),

  /**
   * Get entity audit trail
   */
  entityHistory: adminProcedure
    .input(
      z.object({
        entity_type: z.enum([
          'user',
          'inspection',
          'location',
          'building',
          'organization',
          'photo',
        ]),
        entity_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.repositories.auditLog.findByEntity(
        input.entity_type,
        input.entity_id,
        input.limit
      );

      return logs.map((log) => log.toObject());
    }),

  /**
   * Count audit logs
   */
  count: adminProcedure
    .input(
      z
        .object({
          user_id: z.string().uuid().optional(),
          entity_type: z
            .enum(['user', 'inspection', 'location', 'building', 'organization', 'photo'])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.repositories.auditLog.count(input);
    }),
});
