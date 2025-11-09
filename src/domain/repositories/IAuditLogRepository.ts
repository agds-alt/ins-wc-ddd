/**
 * AuditLog Repository Interface
 * Defines contract for audit log data persistence
 */

import { AuditLog, AuditAction, AuditEntityType } from '../entities/AuditLog';

export interface CreateAuditLogDTO {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  user_id: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  entity_type?: AuditEntityType;
  entity_id?: string;
  action?: AuditAction;
  date_from?: string;
  date_to?: string;
}

export interface IAuditLogRepository {
  /**
   * Find audit log by ID
   */
  findById(id: string): Promise<AuditLog | null>;

  /**
   * Find all audit logs with filters (FREE TIER: max 50 results)
   */
  findAll(filters?: AuditLogFilters, limit?: number, offset?: number): Promise<AuditLog[]>;

  /**
   * Find audit logs by user
   */
  findByUser(userId: string, limit?: number): Promise<AuditLog[]>;

  /**
   * Find audit logs by entity
   */
  findByEntity(entityType: AuditEntityType, entityId: string, limit?: number): Promise<AuditLog[]>;

  /**
   * Create new audit log entry
   */
  create(data: CreateAuditLogDTO): Promise<AuditLog>;

  /**
   * Count audit logs
   */
  count(filters?: AuditLogFilters): Promise<number>;

  /**
   * Delete old audit logs (cleanup - older than X days)
   */
  deleteOlderThan(days: number): Promise<number>;
}
