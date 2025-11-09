/**
 * AuditLog Repository Implementation
 * Uses Supabase for persistence - FREE TIER optimized
 *
 * NOTE: This is a placeholder implementation as audit_logs table
 * doesn't exist in current schema. Can be implemented later if needed.
 */

import { supabaseAdmin } from '../supabase';
import { AuditLog, AuditLogProps, AuditEntityType } from '@/domain/entities/AuditLog';
import {
  IAuditLogRepository,
  CreateAuditLogDTO,
  AuditLogFilters,
} from '@/domain/repositories/IAuditLogRepository';

const DEFAULT_LIMIT = 50; // 🆓 FREE TIER: Limit queries

export class AuditLogRepository implements IAuditLogRepository {
  // Note: This implementation assumes an audit_logs table exists
  // If not, this can be implemented later or use alternative logging

  async findById(id: string): Promise<AuditLog | null> {
    // Placeholder - implement when audit_logs table exists
    return null;
  }

  async findAll(
    filters?: AuditLogFilters,
    limit: number = DEFAULT_LIMIT,
    offset: number = 0
  ): Promise<AuditLog[]> {
    // Placeholder - implement when audit_logs table exists
    return [];
  }

  async findByUser(userId: string, limit: number = DEFAULT_LIMIT): Promise<AuditLog[]> {
    return this.findAll({ user_id: userId }, limit);
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = DEFAULT_LIMIT
  ): Promise<AuditLog[]> {
    return this.findAll({ entity_type: entityType, entity_id: entityId }, limit);
  }

  async create(dto: CreateAuditLogDTO): Promise<AuditLog> {
    // Placeholder - implement when audit_logs table exists
    // For now, we can log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', dto);
    }

    // Return a mock audit log
    return AuditLog.create({
      id: 'mock-' + Date.now(),
      ...dto,
      created_at: new Date().toISOString(),
    });
  }

  async count(filters?: AuditLogFilters): Promise<number> {
    // Placeholder
    return 0;
  }

  async deleteOlderThan(days: number): Promise<number> {
    // Placeholder - implement when audit_logs table exists
    return 0;
  }
}
