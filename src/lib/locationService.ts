// src/features/locations/services/locationService.ts
import { supabase } from '../lib/supabase';
import type {
  LocationFormData,
  LocationWithDetails,
  LocationFilters,
  LocationCreationResult,
  LocationUpdatePayload,
  LocationStats,
} from '../types/location.types';
import { generateLocationQRCode } from './qrGeneratorService';

/**
 * Get all locations using the view (includes joined data)
 * Use this for READ operations
 */
export async function getLocations(filters?: LocationFilters) {
  let query = supabase
    .from('locations_with_details')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  if (filters?.buildingId) {
    query = query.eq('building_id', filters.buildingId);
  }

  if (filters?.floor) {
    query = query.eq('floor', filters.floor);
  }

  if (filters?.section) {
    query = query.eq('section', filters.section);
  }

  if (filters?.area) {
    query = query.eq('area', filters.area);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  // Search by name or code
  if (filters?.searchQuery) {
    query = query.or(
      `name.ilike.%${filters.searchQuery}%,code.ilike.%${filters.searchQuery}%,qr_code.ilike.%${filters.searchQuery}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as LocationWithDetails[];
}

/**
 * Get single location with details
 */
export async function getLocationById(locationId: string) {
  const { data, error } = await supabase
    .from('locations_with_details')
    .select('*')
    .eq('id', locationId)
    .single();

  if (error) throw error;
  return data as LocationWithDetails;
}

/**
 * Get location by QR code (for scanning workflow)
 */
export async function getLocationByQRCode(qrCode: string) {
  const { data, error } = await supabase
    .from('locations_with_details')
    .select('*')
    .eq('qr_code', qrCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('QR code not found');
    }
    throw error;
  }

  return data as LocationWithDetails;
}

/**
 * Get locations by building
 */
export async function getLocationsByBuilding(buildingId: string) {
  return getLocations({ buildingId, isActive: true });
}

/**
 * Get locations by organization
 */
export async function getLocationsByOrganization(organizationId: string) {
  return getLocations({ organizationId, isActive: true });
}

/**
 * Create new location with auto-generated QR code
 * Use locations TABLE for WRITE operations
 */
export async function createLocation(
  formData: LocationFormData,
  userId: string
): Promise<LocationCreationResult> {
  try {
    // 1. Get building with organization info for QR generation
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select(`
        id,
        short_code,
        organization_id,
        organizations (
          short_code
        )
      `)
      .eq('id', formData.building_id)
      .single();

    if (buildingError || !building) {
      throw new Error('Building not found');
    }

    // 2. Generate unique QR code
    const qrCode = generateLocationQRCode(
      (building.organizations as any).short_code,
      building.short_code,
      formData.code
    );

    // 3. Check if QR code already exists (should be extremely rare with nanoid)
    const { data: existingQR } = await supabase
      .from('locations')
      .select('id')
      .eq('qr_code', qrCode)
      .single();

    if (existingQR) {
      // Regenerate if collision detected
      return createLocation(formData, userId);
    }

    // 4. Prepare insert data
    const insertData = {
      name: formData.name,
      organization_id: formData.organization_id,
      building_id: formData.building_id,
      floor: formData.floor || null,
      section: formData.section || null,
      area: formData.area || null,
      code: formData.code || null,
      description: formData.description || null,
      coordinates: formData.coordinates || null,
      photo_url: formData.photo_url || null,
      qr_code: qrCode,
      created_by: userId,
      is_active: true,
    };

    // 5. Insert location
    const { data: location, error } = await supabase
      .from('locations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      location,
      qrCode,
      success: true,
      message: 'Location created successfully',
    };
  } catch (error) {
    console.error('Create location error:', error);
    throw error;
  }
}

/**
 * Update location
 * Use locations TABLE for WRITE operations
 */
export async function updateLocation(
  locationId: string,
  updates: LocationUpdatePayload
) {
  const { data, error } = await supabase
    .from('locations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete location (set is_active = false)
 */
export async function deleteLocation(locationId: string) {
  const { error } = await supabase
    .from('locations')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId);

  if (error) throw error;
}

/**
 * Hard delete location (permanent)
 * Use with caution!
 */
export async function permanentlyDeleteLocation(locationId: string) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId);

  if (error) throw error;
}

/**
 * Restore soft-deleted location
 */
export async function restoreLocation(locationId: string) {
  const { error } = await supabase
    .from('locations')
    .update({ 
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId);

  if (error) throw error;
}

/**
 * Generate bulk QR codes for existing locations
 * Useful for migration or QR regeneration
 */
export async function regenerateQRCodes(organizationId?: string) {
  // Get locations with building info
  let query = supabase
    .from('locations')
    .select(`
      id,
      code,
      building_id,
      buildings (
        short_code,
        organizations (
          short_code
        )
      )
    `);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data: locations, error } = await query;

  if (error) throw error;
  if (!locations || locations.length === 0) {
    return { updated: 0, failed: 0 };
  }

  // Update each location with new QR code
  let updated = 0;
  let failed = 0;

  for (const location of locations as any[]) {
    try {
      const qrCode = generateLocationQRCode(
        location.buildings.organizations.short_code,
        location.buildings.short_code,
        location.code
      );

      const { error: updateError } = await supabase
        .from('locations')
        .update({ qr_code: qrCode })
        .eq('id', location.id);

      if (updateError) {
        failed++;
        console.error(`Failed to update location ${location.id}:`, updateError);
      } else {
        updated++;
      }
    } catch (err) {
      failed++;
      console.error(`Error processing location ${location.id}:`, err);
    }
  }

  return { updated, failed, total: locations.length };
}

/**
 * Get location statistics
 */
export async function getLocationStats(filters?: LocationFilters): Promise<LocationStats> {
  const locations = await getLocations(filters);

  const stats: LocationStats = {
    totalLocations: locations.length,
    activeLocations: locations.filter(l => l.is_active).length,
    inactiveLocations: locations.filter(l => !l.is_active).length,
    locationsByBuilding: {},
    locationsByFloor: {},
  };

  // Count by building
  locations.forEach(location => {
    const buildingName = location.building_name || 'Unknown';
    stats.locationsByBuilding[buildingName] = (stats.locationsByBuilding[buildingName] || 0) + 1;
  });

  // Count by floor
  locations.forEach(location => {
    const floor = location.floor || 'Unknown';
    stats.locationsByFloor[floor] = (stats.locationsByFloor[floor] || 0) + 1;
  });

  return stats;
}

/**
 * Check if location code exists within a building
 */
export async function checkLocationCodeExists(
  buildingId: string,
  code: string,
  excludeLocationId?: string
): Promise<boolean> {
  let query = supabase
    .from('locations')
    .select('id')
    .eq('building_id', buildingId)
    .eq('code', code);

  if (excludeLocationId) {
    query = query.neq('id', excludeLocationId);
  }

  const { data } = await query.single();
  return !!data;
}

/**
 * Validate location data before create/update
 */
export function validateLocationData(data: LocationFormData): { 
  valid: boolean; 
  errors: Record<string, string> 
} {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Location name is required';
  }

  if (!data.organization_id) {
    errors.organization_id = 'Organization is required';
  }

  if (!data.building_id) {
    errors.building_id = 'Building is required';
  }

  if (data.code && data.code.length > 20) {
    errors.code = 'Location code must be 20 characters or less';
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be 500 characters or less';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Search locations across all fields
 */
export async function searchLocations(
  searchQuery: string,
  filters?: Omit<LocationFilters, 'searchQuery'>
) {
  return getLocations({
    ...filters,
    searchQuery,
  });
}

/**
 * Get unique floors from locations
 */
export async function getUniqueFloors(
  organizationId?: string,
  buildingId?: string
): Promise<string[]> {
  const locations = await getLocations({
    organizationId,
    buildingId,
    isActive: true,
  });

  const floors = new Set<string>();
  locations.forEach(location => {
    if (location.floor) {
      floors.add(location.floor);
    }
  });

  return Array.from(floors).sort();
}

/**
 * Get unique sections from locations
 */
export async function getUniqueSections(
  organizationId?: string,
  buildingId?: string
): Promise<string[]> {
  const locations = await getLocations({
    organizationId,
    buildingId,
    isActive: true,
  });

  const sections = new Set<string>();
  locations.forEach(location => {
    if (location.section) {
      sections.add(location.section);
    }
  });

  return Array.from(sections).sort();
}