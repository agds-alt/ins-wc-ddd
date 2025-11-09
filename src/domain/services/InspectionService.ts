/**
 * Inspection Service
 * Business logic for toilet inspections
 */

import { Inspection } from '../entities/Inspection';
import { IInspectionRepository, CreateInspectionDTO } from '../repositories/IInspectionRepository';
import { ILocationRepository } from '../repositories/ILocationRepository';
import { IUserRepository } from '../repositories/IUserRepository';

export interface InspectionStats {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  by_status: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  needs_attention: number;
  verified_count: number;
  pending_verification: number;
}

export class InspectionService {
  constructor(
    private inspectionRepository: IInspectionRepository,
    private locationRepository: ILocationRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Create new inspection from QR scan
   */
  async createFromScan(
    qrCode: string,
    userId: string,
    inspectionData: Omit<CreateInspectionDTO, 'location_id' | 'user_id'>
  ): Promise<Inspection> {
    // Find location by QR code
    const location = await this.locationRepository.findByQRCode(qrCode);

    if (!location) {
      throw new Error('Location not found for this QR code');
    }

    if (!location.isActive) {
      throw new Error('Location is inactive');
    }

    // Create inspection
    const inspection = await this.inspectionRepository.create({
      ...inspectionData,
      location_id: location.id,
      user_id: userId,
    });

    return inspection;
  }

  /**
   * Create inspection with validation
   */
  async createInspection(data: CreateInspectionDTO): Promise<Inspection> {
    // Validate location exists
    const location = await this.locationRepository.findById(data.location_id);
    if (!location || !location.isActive) {
      throw new Error('Invalid or inactive location');
    }

    // Validate user exists
    const user = await this.userRepository.findById(data.user_id);
    if (!user || !user.isActive) {
      throw new Error('Invalid or inactive user');
    }

    // Create inspection
    return await this.inspectionRepository.create(data);
  }

  /**
   * Verify inspection (admin only)
   */
  async verifyInspection(
    inspectionId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<Inspection> {
    // Check if verifier is admin
    const verifier = await this.userRepository.findByIdWithRole(verifiedBy);
    if (!verifier || !verifier.isAdmin()) {
      throw new Error('Only admins can verify inspections');
    }

    // Verify inspection
    return await this.inspectionRepository.verify(inspectionId, verifiedBy, notes);
  }

  /**
   * Get inspections by location with stats
   */
  async getLocationInspections(locationId: string, limit?: number) {
    const inspections = await this.inspectionRepository.findByLocation(locationId, limit);

    // Calculate stats
    const stats = this.calculateStats(inspections);

    return {
      inspections,
      stats,
    };
  }

  /**
   * Get user's inspection history
   */
  async getUserInspections(userId: string, limit?: number) {
    return await this.inspectionRepository.findByUser(userId, limit);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(filters?: any): Promise<InspectionStats> {
    const inspections = await this.inspectionRepository.findAll(filters, 500); // Max 500 for stats

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const stats: InspectionStats = {
      total: inspections.length,
      today: 0,
      this_week: 0,
      this_month: 0,
      by_status: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
      needs_attention: 0,
      verified_count: 0,
      pending_verification: 0,
    };

    inspections.forEach((inspection) => {
      const date = inspection.inspectionDate;

      if (date === today) stats.today++;
      if (date >= weekAgo) stats.this_week++;
      if (date >= monthAgo) stats.this_month++;

      stats.by_status[inspection.overallStatus]++;

      if (inspection.needsAttention()) {
        stats.needs_attention++;
      }

      if (inspection.isVerified()) {
        stats.verified_count++;
      } else {
        stats.pending_verification++;
      }
    });

    return stats;
  }

  /**
   * Get inspections that need attention
   */
  async getInspectionsNeedingAttention(limit?: number) {
    const allInspections = await this.inspectionRepository.findAll(undefined, limit || 50);

    return allInspections.filter((inspection) => inspection.needsAttention());
  }

  /**
   * Get pending verifications
   */
  async getPendingVerifications(limit?: number) {
    return await this.inspectionRepository.findAll({ verified: false }, limit);
  }

  /**
   * Calculate statistics from inspection array
   */
  private calculateStats(inspections: Inspection[]) {
    const stats = {
      total: inspections.length,
      by_status: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
      needs_attention: 0,
      verified: 0,
      pending: 0,
    };

    inspections.forEach((inspection) => {
      stats.by_status[inspection.overallStatus]++;

      if (inspection.needsAttention()) {
        stats.needs_attention++;
      }

      if (inspection.isVerified()) {
        stats.verified++;
      } else {
        stats.pending++;
      }
    });

    return stats;
  }

  /**
   * Delete inspection (soft delete)
   */
  async deleteInspection(inspectionId: string, userId: string): Promise<void> {
    const inspection = await this.inspectionRepository.findById(inspectionId);

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Only allow user who created it or admin to delete
    const user = await this.userRepository.findByIdWithRole(userId);

    if (inspection.userId !== userId && !user?.isAdmin()) {
      throw new Error('Not authorized to delete this inspection');
    }

    await this.inspectionRepository.delete(inspectionId);
  }
}
