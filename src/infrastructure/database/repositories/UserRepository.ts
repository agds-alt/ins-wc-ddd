/**
 * User Repository Implementation
 * Uses Supabase for persistence - FREE TIER optimized
 */

import { supabaseAdmin } from '../supabase';
import { User, UserProps } from '@/domain/entities/User';
import {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilters,
} from '@/domain/repositories/IUserRepository';

const DEFAULT_LIMIT = 50; // FREE TIER: Limit queries

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return User.create(data as UserProps);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;

    return User.create(data as UserProps);
  }

  async findAll(filters?: UserFilters, limit: number = DEFAULT_LIMIT): Promise<User[]> {
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .limit(limit); // 🆓 FREE TIER: Always limit

    if (filters?.email) {
      query = query.eq('email', filters.email);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.occupation_id) {
      query = query.eq('occupation_id', filters.occupation_id);
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => User.create(row as UserProps));
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: dto.email,
        full_name: dto.full_name,
        password_hash: dto.password_hash,
        phone: dto.phone,
        occupation_id: dto.occupation_id,
        profile_photo_url: dto.profile_photo_url,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }

    return User.create(data as UserProps);
  }

  async update(id: string, dto: UpdateUserDTO): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user: ${error?.message}`);
    }

    return User.create(data as UserProps);
  }

  async updateLastLogin(id: string): Promise<void> {
    await supabaseAdmin
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async deactivate(id: string): Promise<void> {
    await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async activate(id: string): Promise<void> {
    await supabaseAdmin
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async findByIdWithRole(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_roles (
          role_id,
          roles (
            name,
            level
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Map role data to user
    const userRoles = data.user_roles as any;
    const role = Array.isArray(userRoles) && userRoles.length > 0
      ? userRoles[0]?.roles
      : null;

    return User.create({
      ...(data as UserProps),
      role: role?.name || 'user', // Default to 'user' if no role assigned
      role_level: role?.level || 40, // Default level 40 for user
    });
  }

  async count(filters?: UserFilters): Promise<number> {
    let query = supabaseAdmin.from('users').select('id', { count: 'exact', head: true });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.occupation_id) {
      query = query.eq('occupation_id', filters.occupation_id);
    }

    const { count, error } = await query;

    if (error) return 0;

    return count ?? 0;
  }
}
