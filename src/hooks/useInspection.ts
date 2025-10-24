// src/hooks/useInspection.ts - PERBAIKI INI
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { TablesInsert } from '../types/database.types';

export const useInspection = () => {
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
        // Fallback: create a simple template if none exists
        return {
          id: 'default-template',
          name: 'Default Inspection',
          fields: {
            cleanliness: 'cleanliness',
            supplies: ['toilet_paper', 'soap_supply', 'hand_dryer', 'water_supply']
          }
        };
      }
      return data;
    },
  });

  // Get location details by ID - GUNAKAN locations_with_details
  const getLocation = (locationId: string) => useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations_with_details')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) {
        console.error('Error fetching location:', error);
        throw error;
      }
      return data;
    },
    enabled: !!locationId,
  });

  // Submit inspection mutation - SESUAI SCHEMA
  const submitInspection = useMutation({
    mutationFn: async (inspectionData: {
      location_id: string;
      user_id: string;
      responses: Record<string, any>;
      photos: File[];
      notes?: string;
    }) => {
      const startTime = new Date();

      // Upload photos to Cloudinary jika ada
      let photoUrls: string[] = [];
      if (inspectionData.photos && inspectionData.photos.length > 0) {
        try {
          photoUrls = await Promise.all(
            inspectionData.photos.map(file => uploadToCloudinary(file))
          );
        } catch (error) {
          console.error('Error uploading photos:', error);
          // Continue without photos if upload fails
        }
      }

      // Get or create template ID
      let templateId = 'default-template';
      try {
        const template = await getDefaultTemplate.refetch();
        if (template.data?.id) {
          templateId = template.data.id;
        }
      } catch (error) {
        console.error('Error getting template:', error);
        // Use default template ID
      }

      const endTime = new Date();
      const duration_seconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Determine overall_status from responses
      const cleanliness = inspectionData.responses.cleanliness;
      let overall_status = 'good';
      
      if (cleanliness === 'excellent') overall_status = 'excellent';
      else if (cleanliness === 'very_poor') overall_status = 'very_poor';
      else if (cleanliness === 'poor') overall_status = 'poor';
      else if (cleanliness === 'fair') overall_status = 'fair';

      // Create inspection record sesuai schema database
      const inspectionRecord: TablesInsert<'inspection_records'> = {
        location_id: inspectionData.location_id,
        user_id: inspectionData.user_id,
        template_id: templateId,
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_time: new Date().toTimeString().split(' ')[0],
        overall_status: overall_status,
        responses: inspectionData.responses,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        notes: inspectionData.notes || null,
        submitted_at: new Date().toISOString(),
        duration_seconds: duration_seconds,
        // Optional fields
        verification_notes: null,
        verified_at: null,
        verified_by: null,
      };

      console.log('Submitting inspection:', inspectionRecord);

      const { data, error } = await supabase
        .from('inspection_records')
        .insert(inspectionRecord)
        .select()
        .single();

      if (error) {
        console.error('Error submitting inspection:', error);
        throw error;
      }

      return data;
    },
  });

  return {
    getDefaultTemplate,
    getLocation,
    submitInspection,
  };
};