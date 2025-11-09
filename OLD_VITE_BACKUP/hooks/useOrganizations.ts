// src/features/locations/hooks/useOrganizations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';

type Organization = Tables<'organizations'>;

/**
 * Fetch all active organizations
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Organization[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetch single organization by ID
 */
export function useOrganization(organizationId?: string) {
  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!organizationId,
  });
}

/**
 * Fetch organization by short code
 */
export function useOrganizationByCode(shortCode?: string) {
  return useQuery({
    queryKey: ['organization-by-code', shortCode],
    queryFn: async () => {
      if (!shortCode) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!shortCode,
  });
}

/**
 * Create new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgData: {
      name: string;
      short_code: string;
      email?: string;
      phone?: string;
      address?: string;
    }) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...orgData,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      // Invalidate organizations cache
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/**
 * Update organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      updates,
    }: {
      organizationId: string;
      updates: Partial<Organization>;
    }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: (data) => {
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', data.id] });
    },
  });
}

/**
 * Soft delete organization (set is_active = false)
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: false })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}