// src/features/locations/services/qrGeneratorService.ts
import { nanoid } from 'nanoid';

/**
 * Generate unique QR code for location
 * 
 * Format: {org_code}-{building_code}-{location_code}-{nanoid}
 * Example: PROS-BLD1-F3T1-x7k2m9p
 * 
 * @param organizationCode - Short code dari organization (e.g., "PROS")
 * @param buildingCode - Short code dari building (e.g., "BLD1")
 * @param locationCode - Optional location code (e.g., "F3T1")
 * @returns Generated QR code string
 */
export function generateLocationQRCode(
  organizationCode: string,
  buildingCode: string,
  locationCode?: string
): string {
  // Generate 7 character unique ID
  const nanoId = nanoid(7);
  
  // Build parts array, filter out undefined values
  const parts = [
    organizationCode.toUpperCase(),
    buildingCode.toUpperCase(),
    locationCode?.toUpperCase(),
    nanoId
  ].filter(Boolean);

  // Join with hyphen
  return parts.join('-');
}

/**
 * Parse QR code to get components
 * 
 * @param qrCode - QR code string to parse
 * @returns Parsed components or null if invalid
 */
export function parseQRCode(qrCode: string): {
  organizationCode: string;
  buildingCode: string;
  locationCode?: string;
  uniqueId: string;
} | null {
  const parts = qrCode.split('-');
  
  // Minimum: ORG-BLD-NANOID (3 parts)
  if (parts.length < 3) {
    return null;
  }

  // If 4 parts: ORG-BLD-LOC-NANOID
  // If 3 parts: ORG-BLD-NANOID
  return {
    organizationCode: parts[0],
    buildingCode: parts[1],
    locationCode: parts.length === 4 ? parts[2] : undefined,
    uniqueId: parts[parts.length - 1]
  };
}

/**
 * Validate QR code format
 * 
 * @param qrCode - QR code string to validate
 * @returns true if valid, false otherwise
 */
export function isValidQRCode(qrCode: string): boolean {
  const parsed = parseQRCode(qrCode);
  
  // Check if parseable and unique ID is correct length
  return parsed !== null && parsed.uniqueId.length === 7;
}

/**
 * Extract organization code from QR
 * Useful for quick lookups without full parsing
 */
export function getOrganizationCodeFromQR(qrCode: string): string | null {
  const parsed = parseQRCode(qrCode);
  return parsed?.organizationCode || null;
}

/**
 * Extract building code from QR
 * Useful for quick lookups without full parsing
 */
export function getBuildingCodeFromQR(qrCode: string): string | null {
  const parsed = parseQRCode(qrCode);
  return parsed?.buildingCode || null;
}

/**
 * Format QR code for display (with spacing for readability)
 * Example: PROS-BLD1-F3T1-x7k2m9p → PROS - BLD1 - F3T1 - x7k2m9p
 */
export function formatQRCodeForDisplay(qrCode: string): string {
  return qrCode.replace(/-/g, ' - ');
}

/**
 * Generate multiple QR codes at once (for bulk operations)
 * Ensures uniqueness by checking against existing codes
 */
export function generateBulkQRCodes(
  count: number,
  organizationCode: string,
  buildingCode: string,
  locationCodePrefix?: string,
  existingCodes: string[] = []
): string[] {
  const codes: string[] = [];
  const existingSet = new Set(existingCodes);

  while (codes.length < count) {
    const locationCode = locationCodePrefix 
      ? `${locationCodePrefix}${(codes.length + 1).toString().padStart(2, '0')}`
      : undefined;
    
    const qrCode = generateLocationQRCode(
      organizationCode,
      buildingCode,
      locationCode
    );

    // Ensure uniqueness
    if (!existingSet.has(qrCode)) {
      codes.push(qrCode);
      existingSet.add(qrCode);
    }
  }

  return codes;
}