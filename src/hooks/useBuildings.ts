// src/features/locations/hooks/useBuildings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';

type Building = Tables<'buildings'>;

interface UseBuildingsOptions {
  organizationId?: string;
  enabled?: boolean;
  includeInactive?: boolean;
}

/**
 * Fetch buildings with optional organization filter
 */
export function useBuildings({
  organizationId,
  enabled = true,
  includeInactive = false,
}: UseBuildingsOptions = {}) {
  return useQuery({
    queryKey: ['buildings', organizationId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('buildings')
        .select('*')
        .order('name', { ascending: true });

      // Filter by organization if provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      // Filter active only by default
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Building[];
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetch single building by ID with organization data
 */
export function useBuilding(buildingId?: string) {
  return useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      if (!buildingId) return null;

      const { data, error } = await supabase
        .from('buildings')
        .select(`
          *,
          organizations (
            id,
            name,
            short_code
          )
        `)
        .eq('id', buildingId)
        .single();

      if (error) throw error;
      return data as Building & {
        organizations: {
          id: string;
          name: string;
          short_code: string;
        };
      };
    },
    enabled: !!buildingId,
  });
}

/**
 * Fetch building by short code
 */
export function useBuildingByCode(shortCode?: string, organizationId?: string) {
  return useQuery({
    queryKey: ['building-by-code', shortCode, organizationId],
    queryFn: async () => {
      if (!shortCode) return null;

      let query = supabase
        .from('buildings')
        .select(`
          *,
          organizations (
            id,
            name,
            short_code
          )
        `)
        .eq('short_code', shortCode);

      // Optionally filter by organization
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return data as Building & {
        organizations: {
          id: string;
          name: string;
          short_code: string;
        };
      };
    },
    enabled: !!shortCode,
  });
}

/**
 * Create new building
 */
export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buildingData: {
      name: string;
      short_code: string;
      organization_id: string;
      type?: string;
      address?: string;
      total_floors?: number;
    }) => {
      const { data, error } = await supabase
        .from('buildings')
        .insert({
          ...buildingData,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Building;
    },
    onSuccess: (data) => {
      // Invalidate buildings cache for this organization
      queryClient.invalidateQueries({ 
        queryKey: ['buildings', data.organization_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['buildings'] 
      });
    },
  });
}

/**
 * Update building
 */
export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buildingId,
      updates,
    }: {
      buildingId: string;
      updates: Partial<Building>;
    }) => {
      const { data, error } = await supabase
        .from('buildings')
        .update(updates)
        .eq('id', buildingId)
        .select()
        .single();

      if (error) throw error;
      return data as Building;
    },
    onSuccess: (data) => {
      // Invalidate related caches
      queryClient.invalidateQueries({ 
        queryKey: ['buildings', data.organization_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['building', data.id] 
      });
    },
  });
}

/**
 * Soft delete building (set is_active = false)
 */
export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buildingId: string) => {
      const { error } = await supabase
        .from('buildings')
        .update({ is_active: false })
        .eq('id', buildingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}

/**
 * Count locations per building
 */
export function useBuildingStats(buildingId?: string) {
  return useQuery({
    queryKey: ['building-stats', buildingId],
    queryFn: async () => {
      if (!buildingId) return null;

      const { count, error } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('building_id', buildingId)
        .eq('is_active', true);

      if (error) throw error;
      
      return {
        totalLocations: count || 0,
      };
    },
    enabled: !!buildingId,
  });
}