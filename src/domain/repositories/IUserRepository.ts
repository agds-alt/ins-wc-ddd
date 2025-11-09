/**
 * User Repository Interface
 * Defines contract for user data persistence
 */

import { User, UserRole } from '../entities/User';

export interface CreateUserDTO {
  email: string;
  full_name: string;
  password_hash: string;
  phone?: string;
  occupation_id?: string;
  profile_photo_url?: string;
}

export interface UpdateUserDTO {
  full_name?: string;
  phone?: string;
  occupation_id?: string;
  profile_photo_url?: string;
  is_active?: boolean;
}

export interface UserFilters {
  email?: string;
  is_active?: boolean;
  occupation_id?: string;
  role?: UserRole;
  search?: string; // Search in name/email
}

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email (for login)
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find users with filters (FREE TIER: max 50 results)
   */
  findAll(filters?: UserFilters, limit?: number): Promise<User[]>;

  /**
   * Create new user
   */
  create(data: CreateUserDTO): Promise<User>;

  /**
   * Update user
   */
  update(id: string, data: UpdateUserDTO): Promise<User>;

  /**
   * Update last login timestamp
   */
  updateLastLogin(id: string): Promise<void>;

  /**
   * Soft delete (deactivate) user
   */
  deactivate(id: string): Promise<void>;

  /**
   * Activate user
   */
  activate(id: string): Promise<void>;

  /**
   * Get user with role information
   */
  findByIdWithRole(id: string): Promise<User | null>;

  /**
   * Count total users (for analytics)
   */
  count(filters?: UserFilters): Promise<number>;
}
