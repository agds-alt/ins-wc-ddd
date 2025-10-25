// src/lib/inspectionService.ts

import { supabase } from './supabase';
import { uploadInspectionPhoto } from './photoService';
import { PhotoWithMetadata } from '../types/photo.types';
import type { 
  InspectionRecordInsert, 
  InspectionResponse,
  InspectionTemplateFields 
} from '../types/inspection.types';

/**
 * Get default inspection template
 * Uses the template marked as is_default = true
 */
export async function getDefaultTemplate() {
  const { data, error } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching default template:', error);
    // Fallback: get any active template
    const { data: fallback } = await supabase
      .from('inspection_templates')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    return fallback;
  }

  return data;
}

/**
 * Get inspection template by ID
 */
export async function getTemplateById(templateId: string) {
  const { data, error } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create inspection record
 */
export async function createInspection(data: {
  location_id: string;
  user_id: string;
  template_id: string;
  responses: InspectionResponse;
  photos: PhotoWithMetadata[];
  notes?: string;
  duration_seconds?: number;
}): Promise<string> {
  try {
    // 1. Get template to calculate score
    const template = await getTemplateById(data.template_id);
    if (!template) throw new Error('Template not found');

    const templateFields = template.fields as InspectionTemplateFields;

    // 2. Calculate overall score
    const score = calculateScore(data.responses, templateFields);
    const status = getStatusFromScore(score);

    // 3. Upload photos first (if any)
    const photoUrls: string[] = [];
    for (const photo of data.photos) {
      try {
        const photoId = await uploadInspectionPhoto(photo, data.user_id);
        // Store photo URL for quick access
        const { data: photoData } = await supabase
          .from('photos')
          .select('file_url')
          .eq('id', photoId)
          .single();
        
        if (photoData) {
          photoUrls.push(photoData.file_url);
        }
      } catch (error) {
        console.error('Photo upload failed:', error);
        // Continue with other photos
      }
    }

    // 4. Get current date and time
    const now = new Date();
    const inspectionDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const inspectionTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    // 5. Create inspection record
    const inspectionData: InspectionRecordInsert = {
      location_id: data.location_id,
      template_id: data.template_id,
      user_id: data.user_id,
      inspection_date: inspectionDate,
      inspection_time: inspectionTime,
      responses: data.responses as any, // Json type
      overall_status: status,
      notes: data.notes,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      duration_seconds: data.duration_seconds,
      submitted_at: now.toISOString(),
    };

    const { data: inspection, error } = await supabase
      .from('inspection_records')
      .insert(inspectionData)
      .select('id')
      .single();

    if (error) throw error;

    // 6. Update photo records with inspection_id
    if (photoUrls.length > 0) {
      await supabase
        .from('photos')
        .update({ inspection_id: inspection.id })
        .in('file_url', photoUrls);
    }

    return inspection.id;
  } catch (error) {
    console.error('Create inspection error:', error);
    throw error;
  }
}

/**
 * Get inspection by ID with full details
 */
export async function getInspectionById(inspectionId: string) {
  const { data, error } = await supabase
    .from('inspection_records')
    .select(`
      *,
      locations!inner (
        id,
        name,
        building,
        floor,
        area,
        section
      ),
      inspection_templates!inner (
        id,
        name,
        fields
      ),
      users!inner (
        id,
        full_name,
        email
      )
    `)
    .eq('id', inspectionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get inspections by location
 */
export async function getInspectionsByLocation(
  locationId: string,
  limit: number = 10
) {
  const { data, error } = await supabase
    .from('inspection_records')
    .select(`
      *,
      users (
        full_name,
        email
      )
    `)
    .eq('location_id', locationId)
    .order('inspection_date', { ascending: false })
    .order('inspection_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get inspections by user
 */
export async function getInspectionsByUser(
  userId: string,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from('inspection_records')
    .select(`
      *,
      locations!inner (
        id,
        name,
        building,
        floor
      )
    `)
    .eq('user_id', userId)
    .order('inspection_date', { ascending: false })
    .order('inspection_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get inspection statistics for a location
 */
export async function getLocationInspectionStats(locationId: string) {
  const { data, error } = await supabase
    .from('inspection_records')
    .select('overall_status, inspection_date')
    .eq('location_id', locationId);

  if (error) throw error;

  const total = data.length;
  const today = data.filter(r => {
    const recordDate = new Date(r.inspection_date);
    const now = new Date();
    return recordDate.toDateString() === now.toDateString();
  }).length;

  const thisWeek = data.filter(r => {
    const recordDate = new Date(r.inspection_date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return recordDate >= weekAgo;
  }).length;

  const statusCounts = data.reduce((acc, r) => {
    acc[r.overall_status] = (acc[r.overall_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    today,
    thisWeek,
    byStatus: statusCounts,
  };
}

/**
 * Get user inspection statistics
 */
export async function getUserInspectionStats(userId: string) {
  const { data, error } = await supabase
    .from('inspection_records')
    .select('overall_status, inspection_date')
    .eq('user_id', userId);

  if (error) throw error;

  const total = data.length;
  const today = data.filter(r => {
    const recordDate = new Date(r.inspection_date);
    const now = new Date();
    return recordDate.toDateString() === now.toDateString();
  }).length;

  const thisWeek = data.filter(r => {
    const recordDate = new Date(r.inspection_date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return recordDate >= weekAgo;
  }).length;

  const thisMonth = data.filter(r => {
    const recordDate = new Date(r.inspection_date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() &&
           recordDate.getFullYear() === now.getFullYear();
  }).length;

  return {
    total,
    today,
    thisWeek,
    thisMonth,
  };
}

/**
 * Calculate score from responses
 */
export function calculateScore(
  responses: InspectionResponse,
  template: InspectionTemplateFields
): number {
  let totalWeight = 0;
  let totalScore = 0;

  template.components.forEach(component => {
    const response = responses[component.id];
    if (!response) return;

    const value = response.value;
    if (typeof value === 'number') {
      // Normalize to 0-100 scale
      const normalizedValue = ((value - 1) / 4) * 100; // rating 1-5 → 0-100
      totalScore += normalizedValue * component.weight;
      totalWeight += component.weight;
    } else if (typeof value === 'boolean') {
      // Boolean: true = 100, false = 0
      totalScore += (value ? 100 : 0) * component.weight;
      totalWeight += component.weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Get status from score
 */
export function getStatusFromScore(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'fail';
}

/**
 * Verify inspection (for managers/admins)
 */
export async function verifyInspection(
  inspectionId: string,
  verifiedBy: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('inspection_records')
    .update({
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      verification_notes: notes || null,
    })
    .eq('id', inspectionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete inspection (soft delete by setting status)
 */
export async function deleteInspection(inspectionId: string) {
  // Note: You might want to add a deleted_at field to the schema
  const { error } = await supabase
    .from('inspection_records')
    .delete()
    .eq('id', inspectionId);

  if (error) throw error;
}