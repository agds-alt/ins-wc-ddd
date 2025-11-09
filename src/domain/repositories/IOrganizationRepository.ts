/**
 * Organization Repository Interface
 * Defines contract for organization data persistence
 */

import { Organization } from '../entities/Organization';

export interface CreateOrganizationDTO {
  name: string;
  short_code: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  created_by?: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  short_code?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface OrganizationFilters {
  is_active?: boolean;
  search?: string;
}

export interface IOrganizationRepository {
  /**
   * Find organization by ID
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Find organization by short code
   */
  findByShortCode(shortCode: string): Promise<Organization | null>;

  /**
   * Find all organizations with filters (FREE TIER: max 50 results)
   */
  findAll(filters?: OrganizationFilters, limit?: number): Promise<Organization[]>;

  /**
   * Create new organization
   */
  create(data: CreateOrganizationDTO): Promise<Organization>;

  /**
   * Update organization
   */
  update(id: string, data: UpdateOrganizationDTO): Promise<Organization>;

  /**
   * Soft delete (deactivate) organization
   */
  deactivate(id: string): Promise<void>;

  /**
   * Activate organization
   */
  activate(id: string): Promise<void>;

  /**
   * Delete organization (hard delete)
   * Note: Should check for dependent buildings/locations first
   */
  delete(id: string): Promise<void>;

  /**
   * Count organizations
   */
  count(filters?: OrganizationFilters): Promise<number>;

  /**
   * Check if short code exists
   */
  shortCodeExists(shortCode: string, excludeId?: string): Promise<boolean>;
}
