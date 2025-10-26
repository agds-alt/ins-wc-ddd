// src/hooks/useInspection.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { TablesInsert } from '../../src/types/database.types';
import type { InspectionComponent } from '../types/inspection.types';

interface SubmitInspectionData {
  location_id: string;
  user_id: string;
  responses: Record<string, any>;
  photos: File[];
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
  // Add other fields from locations_with_details view as needed
}

export const useInspection = (inspectionId?: string) => {
  const queryClient = useQueryClient();

  // Get specific inspection by ID
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
        console.error('Error fetching inspection:', error);
        throw new Error(`Failed to fetch inspection: ${error.message}`);
      }
      
      return data as InspectionComponent;
    },
    enabled: !!inspectionId,
  });

  // Get default template
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
        console.error('Error fetching default template:', error);
        // Return a fallback template structure
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
          estimated_time: 300, // 5 minutes
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      return data;
    },
    retry: 1, // Only retry once if fails
  });

  // Get location details by ID
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
        console.error('Error fetching location:', error);
        throw new Error(`Failed to fetch location: ${error.message}`);
      }
      
      return data as LocationWithDetails;
    },
    enabled: !!locationId,
  });

  // Submit inspection mutation - Fully synchronized with database schema
  const submitInspection = useMutation({
    mutationFn: async (inspectionData: SubmitInspectionData) => {
      const {
        location_id,
        user_id,
        responses,
        photos,
        notes,
        duration_seconds
      } = inspectionData;

      // Validate required fields
      if (!location_id || !user_id) {
        throw new Error('Location ID and User ID are required');
      }

      // Upload photos to Cloudinary if any
      const photoUrls: string[] = [];
      if (photos && photos.length > 0) {
        try {
          const uploadPromises = photos.map(file => uploadToCloudinary(file));
          const uploadedUrls = await Promise.all(uploadPromises);
          photoUrls.push(...uploadedUrls.filter(url => url !== null) as string[]);
        } catch (error) {
          console.error('Error uploading photos:', error);
          // Continue without photos if upload fails
        }
      }

      // Get template ID
      let templateId = 'comprehensive-template';
      try {
        const templateData = await getDefaultTemplate.refetch();
        if (templateData.data?.id) {
          templateId = templateData.data.id;
        }
      } catch (error) {
        console.warn('Using fallback template ID');
      }

      // Get current date and time
      const now = new Date();
      const inspection_date = now.toISOString().split('T')[0];
      const inspection_time = now.toTimeString().split(' ')[0];
      const submitted_at = now.toISOString();

      // Calculate overall_status based on score
      const score = responses.score || 0;
      let overall_status = 'satisfactory';
      
      if (score >= 90) overall_status = 'excellent';
      else if (score >= 75) overall_status = 'good';
      else if (score >= 60) overall_status = 'fair';
      else if (score >= 40) overall_status = 'poor';
      else overall_status = 'very_poor';

      // Create inspection record according to database schema
      const inspectionRecord: TablesInsert<'inspection_records'> = {
        location_id,
        user_id,
        template_id: templateId,
        inspection_date,
        inspection_time,
        overall_status,
        responses,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        notes: notes?.trim() || null,
        submitted_at,
        duration_seconds: duration_seconds || null,
        verification_notes: null,
        verified_at: null,
        verified_by: null,
      };

      console.log('Submitting inspection record:', inspectionRecord);

      const { data, error } = await supabase
        .from('inspection_records')
        .insert(inspectionRecord)
        .select(`
          *,
          locations:location_id (
            name,
            building,
            floor,
            area
          )
        `)
        .single();

      if (error) {
        console.error('Database error submitting inspection:', error);
        throw new Error(`Failed to submit inspection: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['location-inspections'] });
    },
    onError: (error: Error) => {
      console.error('Mutation error submitting inspection:', error);
    },
  });

  // Get inspections for a specific location
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
        console.error('Error fetching location inspections:', error);
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