// src/types/photo.types.ts

import { Tables, TablesInsert } from './database.types';

/**
 * Photo metadata for file upload (before saving to DB)
 * Used in the photo capture component
 */
export interface PhotoWithMetadata {
  file: File;
  preview: string; // blob URL for preview
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  metadata?: {
    inspectionId?: string;
    locationId?: string;
    fieldReference?: string;
    caption?: string;
  };
}

/**
 * Uploaded photo record from database
 * Type alias from database types
 */
export type PhotoRow = Tables<'photos'>;

/**
 * Photo insert data
 * Type alias from database types
 */
export type PhotoInsert = TablesInsert<'photos'>;

/**
 * Photo data for creating new records
 */
export interface CreatePhotoData {
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  inspection_id?: string | null;
  location_id?: string | null;
  field_reference?: string | null;
  caption?: string | null;
  uploaded_by?: string | null;
}

/**
 * Cloudinary upload response
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
}