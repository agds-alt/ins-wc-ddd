// src/hooks/useInspection.ts - OPTIMIZED: No double upload
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { TablesInsert } from '../../src/types/database.types';
import type { InspectionComponent } from '../types/inspection.types';

interface SubmitInspectionData {
  location_id: string;
  user_id: string;
  responses: Record<string, any>;
  photo_urls: string[]; // ✅ Changed from File[] to string[]
  notes?: string;
  duration_seconds?: number;
}

interface LocationWithDetails {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  area: string | null;
  code: string | null;
  building_id: string;
  organization_id: string;
  qr_code: string;
  is_active: boolean | null;
}

export const useInspection = (inspectionId?: string) => {
  const queryClient = useQueryClient();

  const getInspection = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;
      
      const { data, error } = await supabase
        .from('inspection_records')
        .select('*')
        .eq('id', inspectionId)
        .single();

      if (error) {
        logger.error('Failed to fetch inspection', error);
        throw new Error(`Failed to fetch inspection: ${error.message}`);
      }
      
      return data as InspectionComponent;
    },
    enabled: !!inspectionId,
  });

  const getDefaultTemplate = useQuery({
    queryKey: ['default-template'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('Using fallback template', error);
        return {
          id: 'comprehensive-template',
          name: 'Comprehensive Inspection',
          description: 'Default comprehensive inspection template',
          fields: {
            components: [],
            requiredPhotos: 0,
            maxPhotos: 10,
            allowNotes: true
          },
          estimated_time: 300,
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      return data;
    },
    retry: 1,
  });

  const getLocation = (locationId: string) => useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      if (!locationId) throw new Error('Location ID is required');

      const { data, error } = await supabase
        .from('locations_with_details')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) {
        logger.error('Failed to fetch location', error);
        throw new Error(`Failed to fetch location: ${error.message}`);
      }
      
      return data as LocationWithDetails;
    },
    enabled: !!locationId,
  });

  const submitInspection = useMutation({
    mutationFn: async (inspectionData: SubmitInspectionData) => {
      const endTimer = logger.startTimer('Submit inspection');

      const {
        location_id,
        user_id,
        responses,
        photo_urls,
        notes,
        duration_seconds,
      } = inspectionData;

      if (!location_id || !user_id) {
        throw new Error('Location ID and User ID are required');
      }

      // ✅ Photos already uploaded by form, just use the URLs
      logger.info('Submitting inspection with photos', {
        photo_count: photo_urls.length
      });

      // Get template ID
      let templateId = 'comprehensive-template';
      try {
        const templateData = await getDefaultTemplate.refetch();
        if (templateData.data?.id) {
          templateId = templateData.data.id;
        }
      } catch (error) {
        logger.warn('Using fallback template ID');
      }

      const now = new Date();
      const inspection_date = now.toISOString().split('T')[0];
      const inspection_time = now.toTimeString().split(' ')[0];
      const submitted_at = now.toISOString();

      const score = responses.score || 0;
      let overall_status = 'satisfactory';
      
      if (score >= 90) overall_status = 'excellent';
      else if (score >= 75) overall_status = 'good';
      else if (score >= 60) overall_status = 'fair';
      else if (score >= 40) overall_status = 'poor';
      else overall_status = 'very_poor';

      const inspectionRecord: TablesInsert<'inspection_records'> = {
        location_id,
        user_id,
        template_id: templateId,
        inspection_date,
        inspection_time,
        overall_status,
        responses,
        photo_urls: photo_urls.length > 0 ? photo_urls : null,
        notes: notes?.trim() || null,
        submitted_at,
        duration_seconds: duration_seconds || null,
        verification_notes: null,
        verified_at: null,
        verified_by: null,
      };

      logger.info('Saving inspection to database', {
        location_id,
        photos: photo_urls.length,
        score
      });

      const { data, error } = await supabase
        .from('inspection_records')
        .insert(inspectionRecord)
        .select('id, location_id, overall_status, submitted_at')
        .single();

      if (error) {
        endTimer();
        logger.error('Failed to submit inspection', error);
        throw new Error(`Failed to submit inspection: ${error.message}`);
      }

      endTimer();
      logger.info('Inspection submitted successfully', { id: data.id });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['location-inspections'] });
    },
    onError: (error: Error) => {
      logger.error('Inspection mutation failed', error);
    },
  });

  const getLocationInspections = (locationId: string) => useQuery({
    queryKey: ['location-inspections', locationId],
    queryFn: async () => {
      if (!locationId) return [];

      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          *,
          users:user_id (
            full_name,
            email
          )
        `)
        .eq('location_id', locationId)
        .order('submitted_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch location inspections', error);
        throw new Error(`Failed to fetch inspections: ${error.message}`);
      }

      return data;
    },
    enabled: !!locationId,
  });

  return {
    getInspection,
    getDefaultTemplate,
    getLocation,
    submitInspection,
    getLocationInspections,
  };
};