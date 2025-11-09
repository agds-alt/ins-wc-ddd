/**
 * Report Router
 * Generate reports and analytics
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';

export const reportRouter = router({
  /**
   * Generate location report
   */
  location: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.services.report.generateLocationReport(input);
  }),

  /**
   * Generate building report
   */
  building: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.services.report.generateBuildingReport(input);
  }),

  /**
   * Generate organization report
   */
  organization: adminProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.services.report.generateOrganizationReport(input);
  }),

  /**
   * Get trending data (for charts)
   */
  trending: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        building_id: z.string().uuid().optional(),
        location_id: z.string().uuid().optional(),
        days: z.number().int().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const { days, ...filters } = input;
      return await ctx.services.report.getTrendingData(filters, days);
    }),

  /**
   * Export inspections
   */
  export: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        building_id: z.string().uuid().optional(),
        location_id: z.string().uuid().optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.services.report.exportInspections(input);
    }),

  /**
   * Get monthly inspections for calendar view
   * Returns array of {date, count, averageScore} for each day in the month
   */
  monthlyInspections: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12),
        userId: z.string().uuid().optional(), // Optional: filter by user (admin can see all)
      })
    )
    .query(async ({ ctx, input }) => {
      const { year, month, userId } = input;

      // Use current user if not specified or not admin
      const targetUserId = userId || ctx.user.userId;

      // Calculate date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch inspections for the month
      const inspections = await ctx.repositories.inspection.findByFilters({
        user_id: targetUserId,
        date_from: startDateStr,
        date_to: endDateStr,
      });

      // Group by date and calculate stats
      const dateMap = new Map<string, { count: number; totalScore: number }>();

      for (const inspection of inspections) {
        const date = inspection.inspectionDate;
        if (!dateMap.has(date)) {
          dateMap.set(date, { count: 0, totalScore: 0 });
        }

        const entry = dateMap.get(date)!;
        entry.count++;

        // Calculate score from overall status
        let score = 50; // default
        const status = inspection.overallStatus;
        if (status === 'Sangat Baik' || status === 'Good' || status === 'Excellent') {
          score = 95;
        } else if (status === 'Baik' || status === 'Fair') {
          score = 75;
        } else if (status === 'Cukup') {
          score = 60;
        } else if (status === 'Buruk' || status === 'Poor') {
          score = 40;
        }

        entry.totalScore += score;
      }

      // Convert to array format
      const result = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        averageScore: Math.round(data.totalScore / data.count),
      }));

      return result;
    }),

  /**
   * Get inspections for a specific date
   * Used when user clicks on a calendar date
   */
  dateInspections: protectedProcedure
    .input(
      z.object({
        date: z.string(), // yyyy-MM-dd
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { date, userId } = input;

      // Use current user if not specified
      const targetUserId = userId || ctx.user.userId;

      const inspections = await ctx.repositories.inspection.findByFilters({
        user_id: targetUserId,
        date_from: date,
        date_to: date,
      });

      // Transform to UI-friendly format
      return inspections.map((inspection) => ({
        id: inspection.id,
        locationId: inspection.locationId,
        locationName: 'Unknown Location', // TODO: Join with location
        inspectionDate: inspection.inspectionDate,
        inspectionTime: inspection.inspectionTime,
        overallStatus: inspection.overallStatus,
        notes: inspection.notes,
        photoCount: inspection.photoUrls?.length || 0,
        submittedAt: inspection.submittedAt,
      }));
    }),
});
