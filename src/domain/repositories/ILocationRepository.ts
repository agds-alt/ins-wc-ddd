/**
 * Location Repository Interface
 * Defines contract for location data persistence
 */

import { Location, Coordinates } from '../entities/Location';

export interface CreateLocationDTO {
  name: string;
  qr_code: string;
  building_id: string;
  organization_id: string;
  code?: string;
  floor?: string;
  area?: string;
  section?: string;
  building?: string;
  description?: string;
  photo_url?: string;
  coordinates?: Coordinates;
  created_by?: string;
}

export interface UpdateLocationDTO {
  name?: string;
  code?: string;
  floor?: string;
  area?: string;
  section?: string;
  building?: string;
  description?: string;
  photo_url?: string;
  coordinates?: Coordinates;
  is_active?: boolean;
}

export interface LocationFilters {
  building_id?: string;
  organization_id?: string;
  floor?: string;
  area?: string;
  is_active?: boolean;
  search?: string;
}

export interface ILocationRepository {
  /**
   * Find location by ID with building/org details
   */
  findById(id: string): Promise<Location | null>;

  /**
   * Find location by QR code (for scanning)
   */
  findByQRCode(qrCode: string): Promise<Location | null>;

  /**
   * Find all locations with filters (FREE TIER: max 50 results)
   */
  findAll(filters?: LocationFilters, limit?: number): Promise<Location[]>;

  /**
   * Find locations by building
   */
  findByBuilding(buildingId: string, limit?: number): Promise<Location[]>;

  /**
   * Find locations by organization
   */
  findByOrganization(organizationId: string, limit?: number): Promise<Location[]>;

  /**
   * Create new location
   */
  create(data: CreateLocationDTO): Promise<Location>;

  /**
   * Update location
   */
  update(id: string, data: UpdateLocationDTO): Promise<Location>;

  /**
   * Soft delete (deactivate) location
   */
  deactivate(id: string): Promise<void>;

  /**
   * Activate location
   */
  activate(id: string): Promise<void>;

  /**
   * Delete location (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Count locations
   */
  count(filters?: LocationFilters): Promise<number>;

  /**
   * Check if QR code exists
   */
  qrCodeExists(qrCode: string): Promise<boolean>;
}
