/**
 * Building Repository Interface
 * Defines contract for building data persistence
 */

import { Building } from '../entities/Building';

export interface CreateBuildingDTO {
  name: string;
  short_code: string;
  organization_id: string;
  address?: string;
  type?: string;
  total_floors?: number;
  created_by?: string;
}

export interface UpdateBuildingDTO {
  name?: string;
  short_code?: string;
  address?: string;
  type?: string;
  total_floors?: number;
  is_active?: boolean;
}

export interface BuildingFilters {
  organization_id?: string;
  is_active?: boolean;
  type?: string;
  search?: string;
}

export interface IBuildingRepository {
  /**
   * Find building by ID
   */
  findById(id: string): Promise<Building | null>;

  /**
   * Find building by short code
   */
  findByShortCode(shortCode: string): Promise<Building | null>;

  /**
   * Find all buildings with filters (FREE TIER: max 50 results)
   */
  findAll(filters?: BuildingFilters, limit?: number): Promise<Building[]>;

  /**
   * Find buildings by organization
   */
  findByOrganization(organizationId: string, limit?: number): Promise<Building[]>;

  /**
   * Create new building
   */
  create(data: CreateBuildingDTO): Promise<Building>;

  /**
   * Update building
   */
  update(id: string, data: UpdateBuildingDTO): Promise<Building>;

  /**
   * Soft delete (deactivate) building
   */
  deactivate(id: string): Promise<void>;

  /**
   * Activate building
   */
  activate(id: string): Promise<void>;

  /**
   * Delete building (hard delete)
   * Note: Should check for dependent locations first
   */
  delete(id: string): Promise<void>;

  /**
   * Count buildings
   */
  count(filters?: BuildingFilters): Promise<number>;

  /**
   * Check if short code exists
   */
  shortCodeExists(shortCode: string, excludeId?: string): Promise<boolean>;
}
