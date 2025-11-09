/**
 * QR Code Service
 * Business logic for QR code generation and scanning
 */

import { Location } from '../entities/Location';
import { ILocationRepository } from '../repositories/ILocationRepository';
import { nanoid } from 'nanoid';

export interface QRCodeData {
  qr_code: string;
  location_id?: string;
  location_name?: string;
  building_name?: string;
  organization_name?: string;
}

export class QRCodeService {
  constructor(private locationRepository: ILocationRepository) {}

  /**
   * Generate unique QR code
   * Format: LOC-{nanoid}
   */
  generateQRCode(): string {
    return `LOC-${nanoid(12)}`;
  }

  /**
   * Generate QR code with custom prefix
   */
  generateQRCodeWithPrefix(prefix: string): string {
    return `${prefix}-${nanoid(12)}`;
  }

  /**
   * Validate QR code format
   */
  isValidQRCode(qrCode: string): boolean {
    // Check if it matches the expected format
    const pattern = /^[A-Z]+-[A-Za-z0-9_-]{12}$/;
    return pattern.test(qrCode);
  }

  /**
   * Check if QR code exists in database
   */
  async qrCodeExists(qrCode: string): Promise<boolean> {
    return await this.locationRepository.qrCodeExists(qrCode);
  }

  /**
   * Generate unique QR code (ensures uniqueness)
   */
  async generateUniqueQRCode(maxAttempts: number = 10): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const qrCode = this.generateQRCode();

      const exists = await this.qrCodeExists(qrCode);

      if (!exists) {
        return qrCode;
      }
    }

    throw new Error('Failed to generate unique QR code after multiple attempts');
  }

  /**
   * Scan QR code and get location details
   */
  async scanQRCode(qrCode: string): Promise<QRCodeData> {
    // Validate format
    if (!this.isValidQRCode(qrCode)) {
      throw new Error('Invalid QR code format');
    }

    // Find location
    const location = await this.locationRepository.findByQRCode(qrCode);

    if (!location) {
      throw new Error('Location not found for this QR code');
    }

    if (!location.isActive) {
      throw new Error('This location is inactive');
    }

    return {
      qr_code: qrCode,
      location_id: location.id,
      location_name: location.getFullName(),
      building_name: location.buildingName,
      organization_name: location.organizationName,
    };
  }

  /**
   * Generate QR code for new location
   * Returns unique QR code ready to be assigned
   */
  async generateForNewLocation(
    buildingName?: string,
    organizationName?: string
  ): Promise<string> {
    // Generate unique code
    const qrCode = await this.generateUniqueQRCode();

    return qrCode;
  }

  /**
   * Regenerate QR code for existing location
   */
  async regenerateQRCode(locationId: string): Promise<Location> {
    const location = await this.locationRepository.findById(locationId);

    if (!location) {
      throw new Error('Location not found');
    }

    // Generate new unique QR code
    const newQRCode = await this.generateUniqueQRCode();

    // Update location with new QR code
    const updatedLocation = await this.locationRepository.update(locationId, {
      qr_code: newQRCode,
    });

    return updatedLocation;
  }

  /**
   * Batch generate QR codes
   * Returns array of unique QR codes
   */
  async batchGenerate(count: number): Promise<string[]> {
    if (count > 100) {
      throw new Error('Cannot generate more than 100 QR codes at once');
    }

    const qrCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const qrCode = await this.generateUniqueQRCode();
      qrCodes.push(qrCode);
    }

    return qrCodes;
  }

  /**
   * Get QR code metadata
   */
  async getQRCodeMetadata(qrCode: string): Promise<{
    exists: boolean;
    location?: Location | null;
    is_active?: boolean;
  }> {
    const location = await this.locationRepository.findByQRCode(qrCode);

    return {
      exists: !!location,
      location: location,
      is_active: location?.isActive,
    };
  }
}
