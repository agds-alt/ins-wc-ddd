// hooks/useInspection.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { Tables, TablesInsert } from '../types/database.types';

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

      if (error) throw error;
      return data;
    },
  });

  // Get location details by ID
  const getLocation = (locationId: string) => useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!locationId,
  });

  // Submit inspection mutation
  const submitInspection = useMutation({
    mutationFn: async (inspectionData: {
      location_id: string;
      user_id: string;
      responses: Record<string, any>;
      photos: File[];
      notes?: string;
    }) => {
      const startTime = new Date();

      // Upload photos to Cloudinary
      const photoUrls = await Promise.all(
        inspectionData.photos.map(file => uploadToCloudinary(file))
      );

      // Get default template
      const template = await getDefaultTemplate.refetch();
      if (!template.data) throw new Error('No default template found');

      const endTime = new Date();
      const duration_seconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Create inspection record sesuai dengan TablesInsert<'inspection_records'>
      const inspectionRecord: TablesInsert<'inspection_records'> = {
        location_id: inspectionData.location_id,
        user_id: inspectionData.user_id,
        template_id: template.data.id,
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_time: new Date().toTimeString().split(' ')[0],
        overall_status: 'completed',
        responses: inspectionData.responses,
        photo_urls: photoUrls,
        notes: inspectionData.notes,
        submitted_at: new Date().toISOString(),
        duration_seconds: duration_seconds,
        // Fields yang optional diisi null
        verification_notes: null,
        verified_at: null,
        verified_by: null,
      };

      const { data, error } = await supabase
        .from('inspection_records')
        .insert(inspectionRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  return {
    getDefaultTemplate,
    getLocation,
    submitInspection,
  };
};