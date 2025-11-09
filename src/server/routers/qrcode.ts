/**
 * QR Code Router
 * Generate and scan QR codes
 */

import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';

export const qrcodeRouter = router({
  /**
   * Generate QR code for new location
   */
  generate: adminProcedure.query(async ({ ctx }) => {
    const qrCode = await ctx.services.qrCode.generateUniqueQRCode();

    return {
      qr_code: qrCode,
      message: 'QR code generated successfully',
    };
  }),

  /**
   * Batch generate QR codes
   */
  batchGenerate: adminProcedure
    .input(
      z.object({
        count: z.number().int().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const qrCodes = await ctx.services.qrCode.batchGenerate(input.count);

      return {
        qr_codes: qrCodes,
        count: qrCodes.length,
      };
    }),

  /**
   * Scan QR code
   */
  scan: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const result = await ctx.services.qrCode.scanQRCode(input);

    return result;
  }),

  /**
   * Validate QR code format
   */
  validate: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const isValid = ctx.services.qrCode.isValidQRCode(input);

    return {
      qr_code: input,
      is_valid: isValid,
    };
  }),

  /**
   * Get QR code metadata
   */
  getMetadata: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await ctx.services.qrCode.getQRCodeMetadata(input);
  }),

  /**
   * Check if QR code exists
   */
  exists: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const exists = await ctx.services.qrCode.qrCodeExists(input);

    return {
      qr_code: input,
      exists,
    };
  }),
});
