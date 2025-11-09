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
});
