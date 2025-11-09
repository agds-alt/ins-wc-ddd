/**
 * Inspection Repository Implementation
 * Uses Supabase for persistence - FREE TIER optimized with query limits
 */

import { supabaseAdmin } from '../supabase';
import { Inspection, InspectionProps, InspectionStatus } from '@/domain/entities/Inspection';
import {
  IInspectionRepository,
  CreateInspectionDTO,
  UpdateInspectionDTO,
  InspectionFilters,
} from '@/domain/repositories/IInspectionRepository';

const DEFAULT_LIMIT = 50; // 🆓 FREE TIER: Limit queries

export class InspectionRepository implements IInspectionRepository {
  async findById(id: string): Promise<Inspection | null> {
    const { data, error } = await supabaseAdmin
      .from('inspection_records')
      .select(`
        *,
        locations!inner(name),
        users!inner(full_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Map joined data
    const location = data.locations as any;
    const user = data.users as any;

    return Inspection.create({
      ...(data as unknown as InspectionProps),
      location_name: location?.name,
      user_name: user?.full_name,
    });
  }

  async findAll(
    filters?: InspectionFilters,
    limit: number = DEFAULT_LIMIT,
    offset: number = 0
  ): Promise<Inspection[]> {
    let query = supabaseAdmin
      .from('inspection_records')
      .select(`
        *,
        locations!inner(name, organization_id, building_id),
        users!inner(full_name)
      `)
      .range(offset, offset + limit - 1)
      .order('inspection_date', { ascending: false })
      .order('inspection_time', { ascending: false });

    // Apply filters
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.overall_status) {
      query = query.eq('overall_status', filters.overall_status);
    }

    if (filters?.date_from) {
      query = query.gte('inspection_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('inspection_date', filters.date_to);
    }

    if (filters?.verified !== undefined) {
      if (filters.verified) {
        query = query.not('verified_at', 'is', null);
      } else {
        query = query.is('verified_at', null);
      }
    }

    // Apply organization/building filters through location join
    if (filters?.organization_id) {
      query = query.eq('locations.organization_id', filters.organization_id);
    }

    if (filters?.building_id) {
      query = query.eq('locations.building_id', filters.building_id);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => {
      const location = row.locations as any;
      const user = row.users as any;

      return Inspection.create({
        ...(row as unknown as InspectionProps),
        location_name: location?.name,
        user_name: user?.full_name,
      });
    });
  }

  async findByLocation(locationId: string, limit: number = DEFAULT_LIMIT): Promise<Inspection[]> {
    return this.findAll({ location_id: locationId }, limit);
  }

  async findByUser(userId: string, limit: number = DEFAULT_LIMIT): Promise<Inspection[]> {
    return this.findAll({ user_id: userId }, limit);
  }

  async findRecent(limit: number = 10): Promise<Inspection[]> {
    return this.findAll(undefined, limit);
  }

  async create(dto: CreateInspectionDTO): Promise<Inspection> {
    const { data, error } = await supabaseAdmin
      .from('inspection_records')
      .insert({
        location_id: dto.location_id,
        template_id: dto.template_id,
        user_id: dto.user_id,
        inspection_date: dto.inspection_date,
        inspection_time: dto.inspection_time,
        overall_status: dto.overall_status,
        responses: dto.responses,
        notes: dto.notes,
        photo_urls: dto.photo_urls,
        duration_seconds: dto.duration_seconds,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create inspection: ${error?.message}`);
    }

    return Inspection.create(data as unknown as InspectionProps);
  }

  async update(id: string, dto: UpdateInspectionDTO): Promise<Inspection> {
    const { data, error } = await supabaseAdmin
      .from('inspection_records')
      .update({
        ...(dto as any),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update inspection: ${error?.message}`);
    }

    return Inspection.create(data as unknown as InspectionProps);
  }

  async verify(id: string, verifiedBy: string, notes?: string): Promise<Inspection> {
    const { data, error } = await supabaseAdmin
      .from('inspection_records')
      .update({
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to verify inspection: ${error?.message}`);
    }

    return Inspection.create(data as unknown as InspectionProps);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('inspection_records').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete inspection: ${error.message}`);
    }
  }

  async count(filters?: InspectionFilters): Promise<number> {
    let query = supabaseAdmin
      .from('inspection_records')
      .select('id', { count: 'exact', head: true });

    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.overall_status) {
      query = query.eq('overall_status', filters.overall_status);
    }

    const { count, error } = await query;

    if (error) return 0;

    return count ?? 0;
  }

  async getStats(filters?: InspectionFilters): Promise<{
    total: number;
    by_status: Record<InspectionStatus, number>;
    verified_count: number;
    pending_count: number;
  }> {
    // Get all inspections (limited)
    const inspections = await this.findAll(filters, 500); // Max 500 for stats

    const stats = {
      total: inspections.length,
      by_status: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      } as Record<InspectionStatus, number>,
      verified_count: 0,
      pending_count: 0,
    };

    inspections.forEach((inspection) => {
      stats.by_status[inspection.overallStatus]++;
      if (inspection.isVerified()) {
        stats.verified_count++;
      } else {
        stats.pending_count++;
      }
    });

    return stats;
  }
}
