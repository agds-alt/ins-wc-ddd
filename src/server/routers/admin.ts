/**
 * Admin Router
 * Admin-specific operations
 */

import { router, adminProcedure } from '../trpc';
import { z } from 'zod';

export const adminRouter = router({
  /**
   * Get system stats
   */
  systemStats: adminProcedure.query(async ({ ctx }) => {
    const [userCount, locationCount, buildingCount, inspectionCount] = await Promise.all([
      ctx.repositories.user.count(),
      ctx.repositories.location.count(),
      ctx.repositories.building.count(),
      ctx.repositories.inspection.count(),
    ]);

    return {
      users: userCount,
      locations: locationCount,
      buildings: buildingCount,
      inspections: inspectionCount,
    };
  }),

  /**
   * Get recent activity
   */
  recentActivity: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const inspections = await ctx.repositories.inspection.findRecent(input?.limit);

      return inspections.map((i) => ({
        type: 'inspection' as const,
        id: i.id,
        date: i.inspectionDate,
        time: i.inspectionTime,
        location: i.locationName,
        user: i.userName,
        status: i.overallStatus,
      }));
    }),

  /**
   * Get users list (admin view)
   */
  usersList: adminProcedure
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

      return users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }));
    }),

  /**
   * Get locations list (admin view)
   */
  locationsList: adminProcedure
    .input(
      z
        .object({
          building_id: z.string().uuid().optional(),
          organization_id: z.string().uuid().optional(),
          is_active: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const locations = await ctx.repositories.location.findAll(input, input?.limit);

      return locations.map((l) => ({
        id: l.id,
        name: l.name,
        qrCode: l.qrCode,
        building: l.buildingName,
        organization: l.organizationName,
        floor: l.floor,
        area: l.area,
        isActive: l.isActive,
      }));
    }),

  /**
   * Get pending verifications summary
   */
  pendingVerificationsSummary: adminProcedure.query(async ({ ctx }) => {
    const pending = await ctx.services.inspection.getPendingVerifications(100);

    return {
      total: pending.length,
      by_status: {
        excellent: pending.filter((i) => i.overallStatus === 'excellent').length,
        good: pending.filter((i) => i.overallStatus === 'good').length,
        fair: pending.filter((i) => i.overallStatus === 'fair').length,
        poor: pending.filter((i) => i.overallStatus === 'poor').length,
      },
      needs_attention: pending.filter((i) => i.needsAttention()).length,
    };
  }),
});
