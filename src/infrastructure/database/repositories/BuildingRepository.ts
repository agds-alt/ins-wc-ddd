/**
 * Building Repository Implementation
 * Uses Supabase for persistence - FREE TIER optimized
 */

import { supabaseAdmin } from '../supabase';
import { Building, BuildingProps } from '@/domain/entities/Building';
import {
  IBuildingRepository,
  CreateBuildingDTO,
  UpdateBuildingDTO,
  BuildingFilters,
} from '@/domain/repositories/IBuildingRepository';

const DEFAULT_LIMIT = 50; // 🆓 FREE TIER: Limit queries

export class BuildingRepository implements IBuildingRepository {
  async findById(id: string): Promise<Building | null> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return Building.create(data as BuildingProps);
  }

  async findByShortCode(shortCode: string): Promise<Building | null> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error || !data) return null;

    return Building.create(data as BuildingProps);
  }

  async findAll(filters?: BuildingFilters, limit: number = DEFAULT_LIMIT): Promise<Building[]> {
    let query = supabaseAdmin.from('buildings').select('*').limit(limit).order('name');

    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,short_code.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => Building.create(row as BuildingProps));
  }

  async findByOrganization(
    organizationId: string,
    limit: number = DEFAULT_LIMIT
  ): Promise<Building[]> {
    return this.findAll({ organization_id: organizationId }, limit);
  }

  async create(dto: CreateBuildingDTO): Promise<Building> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .insert({
        name: dto.name,
        short_code: dto.short_code,
        organization_id: dto.organization_id,
        address: dto.address,
        type: dto.type,
        total_floors: dto.total_floors,
        created_by: dto.created_by,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create building: ${error?.message}`);
    }

    return Building.create(data as BuildingProps);
  }

  async update(id: string, dto: UpdateBuildingDTO): Promise<Building> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update building: ${error?.message}`);
    }

    return Building.create(data as BuildingProps);
  }

  async deactivate(id: string): Promise<void> {
    await supabaseAdmin
      .from('buildings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async activate(id: string): Promise<void> {
    await supabaseAdmin
      .from('buildings')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('buildings').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete building: ${error.message}`);
    }
  }

  async count(filters?: BuildingFilters): Promise<number> {
    let query = supabaseAdmin.from('buildings').select('id', { count: 'exact', head: true });

    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { count, error } = await query;

    if (error) return 0;

    return count ?? 0;
  }

  async shortCodeExists(shortCode: string, excludeId?: string): Promise<boolean> {
    let query = supabaseAdmin
      .from('buildings')
      .select('id', { count: 'exact', head: true })
      .eq('short_code', shortCode);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) return false;

    return (count ?? 0) > 0;
  }
}
