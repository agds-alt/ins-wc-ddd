/**
 * Inspection Repository Interface
 * Defines contract for inspection data persistence
 */

import { Inspection, InspectionStatus, InspectionResponses } from '../entities/Inspection';

export interface CreateInspectionDTO {
  location_id: string;
  template_id: string;
  user_id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: InspectionStatus;
  responses: InspectionResponses;
  notes?: string;
  photo_urls?: string[];
  duration_seconds?: number;
}

export interface UpdateInspectionDTO {
  overall_status?: InspectionStatus;
  responses?: InspectionResponses;
  notes?: string;
  photo_urls?: string[];
  verification_notes?: string;
}

export interface InspectionFilters {
  location_id?: string;
  user_id?: string;
  organization_id?: string;
  building_id?: string;
  overall_status?: InspectionStatus;
  date_from?: string;
  date_to?: string;
  verified?: boolean;
  search?: string;
}

export interface IInspectionRepository {
  /**
   * Find inspection by ID with related data
   */
  findById(id: string): Promise<Inspection | null>;

  /**
   * Find inspections with filters (FREE TIER: max 50 results)
   * IMPORTANT: Always use limit for free tier optimization
   */
  findAll(filters?: InspectionFilters, limit?: number, offset?: number): Promise<Inspection[]>;

  /**
   * Find inspections by location
   */
  findByLocation(locationId: string, limit?: number): Promise<Inspection[]>;

  /**
   * Find inspections by user
   */
  findByUser(userId: string, limit?: number): Promise<Inspection[]>;

  /**
   * Find recent inspections (dashboard)
   */
  findRecent(limit?: number): Promise<Inspection[]>;

  /**
   * Create new inspection
   */
  create(data: CreateInspectionDTO): Promise<Inspection>;

  /**
   * Update inspection
   */
  update(id: string, data: UpdateInspectionDTO): Promise<Inspection>;

  /**
   * Verify inspection (admin only)
   */
  verify(id: string, verifiedBy: string, notes?: string): Promise<Inspection>;

  /**
   * Delete inspection (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Count inspections (for analytics)
   */
  count(filters?: InspectionFilters): Promise<number>;

  /**
   * Get inspection statistics
   */
  getStats(filters?: InspectionFilters): Promise<{
    total: number;
    by_status: Record<InspectionStatus, number>;
    verified_count: number;
    pending_count: number;
  }>;
}
