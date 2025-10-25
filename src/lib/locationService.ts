// Type fix for locationService.ts coordinates issue
// Error di line 175: coordinates type mismatch

// src/lib/locationService.ts (FIXED VERSION)

import { supabase } from './supabase';
import { TablesInsert, Json } from '../types/database.types';
import QRCode from 'qrcode';

// Add index signature untuk compatibility dengan Json type
export interface LocationCoordinates {
  [key: string]: number; // Index signature untuk Json compatibility
  lat: number;
  lng: number;
}

export interface LocationFormData {
  name: string;
  code?: string | null;
  building?: string | null;
  floor?: string | null;
  section?: string | null;
  area?: string | null;
  description?: string | null;
  coordinates?: LocationCoordinates | null;
  photo_url?: string | null;
}

export const createLocation = async (
  locationData: LocationFormData,
  createdBy: string
): Promise<string> => {
  try {
    // Generate QR code
    const locationId = crypto.randomUUID();
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const qrDataUrl = `${baseUrl}/locations/${locationId}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Prepare insert data dengan type casting untuk coordinates
    const insertData: TablesInsert<'locations'> = {
      id: locationId,
      name: locationData.name,
      code: locationData.code || null,
      building: locationData.building || null,
      floor: locationData.floor || null,
      section: locationData.section || null,
      area: locationData.area || null,
      description: locationData.description || null,
      coordinates: locationData.coordinates as Json, // Type cast ke Json
      photo_url: locationData.photo_url || null,
      qr_code: qrCodeDataUrl,
      created_by: createdBy,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('locations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

export const updateLocation = async (
  locationId: string,
  locationData: Partial<LocationFormData>
): Promise<void> => {
  try {
    const updateData: Partial<TablesInsert<'locations'>> = {
      name: locationData.name,
      code: locationData.code,
      building: locationData.building,
      floor: locationData.floor,
      section: locationData.section,
      area: locationData.area,
      description: locationData.description,
      coordinates: locationData.coordinates as Json, // Type cast
      photo_url: locationData.photo_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', locationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const deleteLocation = async (locationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

export const getLocationById = async (locationId: string) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
};