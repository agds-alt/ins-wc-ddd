// src/features/locations/types/location.types.ts
import { Tables } from '../types/database.types';

/**
 * Base database types
 */
export type Location = Tables<'locations'>;
export type LocationWithDetails = Tables<'locations_with_details'>;
export type Building = Tables<'buildings'>;
export type Organization = Tables<'organizations'>;

/**
 * Form data types for creating/updating locations
 */
export interface LocationFormData {
  // Required fields
  name: string;
  organization_id: string;
  building_id: string;

  // Optional location details
  floor?: string;
  section?: string;
  area?: string;
  code?: string;
  description?: string;

  // Optional metadata
  coordinates?: LocationCoordinates;
  photo_url?: string;
}

/**
 * Coordinates type for geolocation
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Location display type with joined data from view
 * This is what you'll use in components
 */
export interface LocationDisplay extends LocationWithDetails {
  // Already includes from view:
  // - id, name, code, qr_code
  // - building_id, building_name, building_code, building_type
  // - organization_id, organization_name, organization_code
  // - floor, section, area
  // - description, photo_url, coordinates
  // - is_active, created_at, updated_at
}

/**
 * QR Code data structure
 */
export interface QRCodeData {
  qrCode: string;
  locationId: string;
  locationName: string;
  organizationCode: string;
  buildingCode: string;
  locationCode?: string;
}

/**
 * Location filters for queries
 */
export interface LocationFilters {
  organizationId?: string;
  buildingId?: string;
  floor?: string;
  section?: string;
  area?: string;
  isActive?: boolean;
  searchQuery?: string; // For searching by name, code, etc.
}

/**
 * Location statistics
 */
export interface LocationStats {
  totalLocations: number;
  activeLocations: number;
  inactiveLocations: number;
  locationsByBuilding: Record<string, number>;
  locationsByFloor: Record<string, number>;
}

/**
 * Building with location count
 */
export interface BuildingWithCount extends Building {
  locationCount?: number;
}

/**
 * Organization with building and location counts
 */
export interface OrganizationWithCounts extends Organization {
  buildingCount?: number;
  locationCount?: number;
}

/**
 * Dropdown option type for forms
 */
export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * QR Code bulk generation options
 */
export interface BulkQRGenerationOptions {
  organizationId: string;
  buildingId?: string;
  count: number;
  locationCodePrefix?: string;
}

/**
 * Location creation result
 */
export interface LocationCreationResult {
  location: Location;
  qrCode: string;
  success: boolean;
  message?: string;
}

/**
 * Location validation errors
 */
export interface LocationValidationErrors {
  name?: string;
  organization_id?: string;
  building_id?: string;
  code?: string;
  [key: string]: string | undefined;
}

/**
 * Location update payload
 */
export type LocationUpdatePayload = Partial<Omit<Location, 'id' | 'created_at' | 'created_by' | 'qr_code'>>;

/**
 * Parsed QR code components
 */
export interface ParsedQRCode {
  organizationCode: string;
  buildingCode: string;
  locationCode?: string;
  uniqueId: string;
  isValid: boolean;
}

/**
 * Location inspection summary (for future use)
 */
export interface LocationInspectionSummary {
  locationId: string;
  totalInspections: number;
  lastInspectionDate?: string;
  averageScore?: number;
  passRate?: number;
}

/**
 * Type guards
 */
export function isValidCoordinates(coords: any): coords is LocationCoordinates {
  return (
    coords &&
    typeof coords === 'object' &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

export function isLocationWithDetails(location: any): location is LocationWithDetails {
  return (
    location &&
    typeof location === 'object' &&
    'building_name' in location &&
    'organization_name' in location
  );
}

/**
 * Constants
 */
export const LOCATION_CONSTANTS = {
  QR_CODE_LENGTH: 7, // nanoid length
  MAX_NAME_LENGTH: 100,
  MAX_CODE_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

/**
 * Floor options (can be customized per building)
 */
export const DEFAULT_FLOOR_OPTIONS = [
  'Basement 2', 'Basement 1',
  'Ground Floor', 'Mezzanine',
  '1F', '2F', '3F', '4F', '5F',
  '6F', '7F', '8F', '9F', '10F',
] as const;

/**
 * Area types
 */
export const AREA_TYPES = [
  'Public Area',
  'Staff Area',
  'VIP Area',
  'Service Area',
  'Emergency Area',
] as const;





export type AreaType = typeof AREA_TYPES[number];