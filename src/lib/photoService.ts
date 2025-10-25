// src/lib/photoService.ts

import { PhotoWithMetadata, PhotoInsert } from '../types/photo.types';
import { supabase } from './supabase';

export const uploadInspectionPhoto = async (
  photoMeta: PhotoWithMetadata,
  userId: string
): Promise<string> => {
  try {
    // 1. Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', photoMeta.file);
    formData.append('upload_preset', process.env.VITE_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('folder', 'inspections');
    
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!cloudinaryResponse.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }
    
    const cloudinaryData = await cloudinaryResponse.json();
    
    // 2. Save to database
    const photoData: PhotoInsert = {
      file_url: cloudinaryData.secure_url,  // ✅ Cloudinary URL
      file_name: photoMeta.file.name,
      file_size: photoMeta.file.size,
      mime_type: photoMeta.file.type,
      inspection_id: photoMeta.metadata?.inspectionId,
      location_id: photoMeta.metadata?.locationId,
      field_reference: photoMeta.metadata?.fieldReference,
      caption: photoMeta.metadata?.caption,
      uploaded_by: userId,
    };
    
    const { data, error } = await supabase
      .from('photos')
      .insert(photoData)
      .select('id')
      .single();
    
    if (error) throw error;
    
    // 3. Return photo ID
    return data.id;
  } catch (error) {
    console.error('Photo upload failed:', error);
    throw error;
  }
};