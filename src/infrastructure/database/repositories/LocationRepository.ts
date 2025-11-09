/**
 * Location Repository Implementation
 * Uses Supabase for persistence - FREE TIER optimized
 */

import { supabaseAdmin } from '../supabase';
import { Location, LocationProps } from '@/domain/entities/Location';
import {
  ILocationRepository,
  CreateLocationDTO,
  UpdateLocationDTO,
  LocationFilters,
} from '@/domain/repositories/ILocationRepository';

const DEFAULT_LIMIT = 50; // 🆓 FREE TIER: Limit queries

export class LocationRepository implements ILocationRepository {
  async findById(id: string): Promise<Location | null> {
    const { data, error } = await supabaseAdmin
      .from('locations_with_details')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return Location.create(data as LocationProps);
  }

  async findByQRCode(qrCode: string): Promise<Location | null> {
    const { data, error } = await supabaseAdmin
      .from('locations_with_details')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    if (error || !data) return null;

    return Location.create(data as LocationProps);
  }

  async findAll(filters?: LocationFilters, limit: number = DEFAULT_LIMIT): Promise<Location[]> {
    let query = supabaseAdmin
      .from('locations_with_details')
      .select('*')
      .limit(limit)
      .order('name');

    if (filters?.building_id) {
      query = query.eq('building_id', filters.building_id);
    }

    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }

    if (filters?.floor) {
      query = query.eq('floor', filters.floor);
    }

    if (filters?.area) {
      query = query.eq('area', filters.area);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => Location.create(row as LocationProps));
  }

  async findByBuilding(buildingId: string, limit: number = DEFAULT_LIMIT): Promise<Location[]> {
    return this.findAll({ building_id: buildingId }, limit);
  }

  async findByOrganization(
    organizationId: string,
    limit: number = DEFAULT_LIMIT
  ): Promise<Location[]> {
    return this.findAll({ organization_id: organizationId }, limit);
  }

  async create(dto: CreateLocationDTO): Promise<Location> {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert({
        name: dto.name,
        qr_code: dto.qr_code,
        building_id: dto.building_id,
        organization_id: dto.organization_id,
        code: dto.code,
        floor: dto.floor,
        area: dto.area,
        section: dto.section,
        building: dto.building,
        description: dto.description,
        photo_url: dto.photo_url,
        coordinates: dto.coordinates as any,
        created_by: dto.created_by,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create location: ${error?.message}`);
    }

    return Location.create(data as LocationProps);
  }

  async update(id: string, dto: UpdateLocationDTO): Promise<Location> {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .update({
        ...dto,
        coordinates: dto.coordinates as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update location: ${error?.message}`);
    }

    return Location.create(data as LocationProps);
  }

  async deactivate(id: string): Promise<void> {
    await supabaseAdmin
      .from('locations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async activate(id: string): Promise<void> {
    await supabaseAdmin
      .from('locations')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('locations').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete location: ${error.message}`);
    }
  }

  async count(filters?: LocationFilters): Promise<number> {
    let query = supabaseAdmin.from('locations').select('id', { count: 'exact', head: true });

    if (filters?.building_id) {
      query = query.eq('building_id', filters.building_id);
    }

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

  async qrCodeExists(qrCode: string): Promise<boolean> {
    const { count, error } = await supabaseAdmin
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('qr_code', qrCode);

    if (error) return false;

    return (count ?? 0) > 0;
  }
}
