/**
 * Organization Repository Implementation
 * Uses Supabase for persistence - FREE TIER optimized
 */

import { supabaseAdmin } from '../supabase';
import { Organization, OrganizationProps } from '@/domain/entities/Organization';
import {
  IOrganizationRepository,
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  OrganizationFilters,
} from '@/domain/repositories/IOrganizationRepository';

const DEFAULT_LIMIT = 50; // 🆓 FREE TIER: Limit queries

export class OrganizationRepository implements IOrganizationRepository {
  async findById(id: string): Promise<Organization | null> {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return Organization.create(data as OrganizationProps);
  }

  async findByShortCode(shortCode: string): Promise<Organization | null> {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error || !data) return null;

    return Organization.create(data as OrganizationProps);
  }

  async findAll(
    filters?: OrganizationFilters,
    limit: number = DEFAULT_LIMIT
  ): Promise<Organization[]> {
    let query = supabaseAdmin.from('organizations').select('*').limit(limit).order('name');

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,short_code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => Organization.create(row as OrganizationProps));
  }

  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: dto.name,
        short_code: dto.short_code,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        logo_url: dto.logo_url,
        created_by: dto.created_by,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create organization: ${error?.message}`);
    }

    return Organization.create(data as OrganizationProps);
  }

  async update(id: string, dto: UpdateOrganizationDTO): Promise<Organization> {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update organization: ${error?.message}`);
    }

    return Organization.create(data as OrganizationProps);
  }

  async deactivate(id: string): Promise<void> {
    await supabaseAdmin
      .from('organizations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async activate(id: string): Promise<void> {
    await supabaseAdmin
      .from('organizations')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('organizations').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete organization: ${error.message}`);
    }
  }

  async count(filters?: OrganizationFilters): Promise<number> {
    let query = supabaseAdmin.from('organizations').select('id', { count: 'exact', head: true });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { count, error } = await query;

    if (error) return 0;

    return count ?? 0;
  }

  async shortCodeExists(shortCode: string, excludeId?: string): Promise<boolean> {
    let query = supabaseAdmin
      .from('organizations')
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
