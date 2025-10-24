// src/hooks/useReports.ts - FIXED VERSION
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { calculateWeightedScore } from '../types/inspection.types';

export interface InspectionReport {
  id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: string;
  responses: any;
  location: {
    id: string;
    name: string;
    building: string;
    floor: string;
  };
  user: {
    id: string;
    full_name: string;
  };
  photo_urls: string[];
  notes: string | null;
}

export interface DateInspections {
  date: string;
  inspections: InspectionReport[];
  averageScore: number;
  count: number;
}

// Helper function to extract score from responses
const getScoreFromResponses = (responses: any): number => {
  if (!responses) return 0;

  // Case 1: Direct score field
  if (typeof responses.score === 'number') {
    return responses.score;
  }

  // Case 2: Calculate from ratings array (like ComprehensiveInspectionForm)
  if (Array.isArray(responses.ratings) && responses.ratings.length > 0) {
    return calculateWeightedScore(responses.ratings);
  }

  // Case 3: Old format - count good responses
  const values = Object.values(responses).filter(v => 
    typeof v === 'string' || typeof v === 'boolean'
  );
  
  if (values.length === 0) return 0;

  const goodCount = values.filter(v => 
    v === true || 
    v === 'good' || 
    v === 'excellent' || 
    v === 'baik' || 
    v === 'bersih'
  ).length;

  return Math.round((goodCount / values.length) * 100);
};

// Get inspections for a specific month
export const useMonthlyInspections = (userId: string | undefined, currentDate: Date) => {
  return useQuery({
    queryKey: ['monthly-inspections', userId, format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!userId) {
        console.warn('⚠️ No userId provided to useMonthlyInspections');
        return [];
      }

      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      console.log('📅 Fetching inspections:', { userId, start, end });

      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          inspection_time,
          overall_status,
          responses,
          photo_urls,
          notes,
          location:locations!inner(id, name, building, floor),
          user:users!inner(id, full_name)
        `)
        .eq('user_id', userId)
        .gte('inspection_date', start)
        .lte('inspection_date', end)
        .order('inspection_date', { ascending: false })
        .order('inspection_time', { ascending: false });

      if (error) {
        console.error('❌ Error fetching inspections:', error);
        throw error;
      }

      console.log('✅ Fetched inspections:', data?.length || 0);

      // Group by date
      const groupedByDate = (data || []).reduce((acc: Record<string, InspectionReport[]>, item: any) => {
        const date = item.inspection_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: item.id,
          inspection_date: item.inspection_date,
          inspection_time: item.inspection_time,
          overall_status: item.overall_status,
          responses: item.responses,
          location: item.location,
          user: item.user,
          photo_urls: item.photo_urls || [],
          notes: item.notes,
        });
        return acc;
      }, {});

      // Calculate average score per date
      const dateInspections: DateInspections[] = Object.entries(groupedByDate).map(([date, inspections]) => {
        const scores = inspections.map(ins => getScoreFromResponses(ins.responses));
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        console.log(`📊 Date ${date}: ${inspections.length} inspections, avg score: ${averageScore}`);

        return {
          date,
          inspections,
          averageScore,
          count: inspections.length,
        };
      });

      return dateInspections;
    },
    enabled: !!userId,
  });
};

// Get inspections for a specific date
export const useDateInspections = (userId: string | undefined, date: string) => {
  return useQuery({
    queryKey: ['date-inspections', userId, date],
    queryFn: async () => {
      if (!userId || !date) {
        console.warn('⚠️ Missing userId or date');
        return [];
      }

      console.log('📅 Fetching inspections for date:', { userId, date });

      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          inspection_time,
          overall_status,
          responses,
          photo_urls,
          notes,
          location:locations!inner(id, name, building, floor),
          user:users!inner(id, full_name)
        `)
        .eq('user_id', userId)
        .eq('inspection_date', date)
        .order('inspection_time', { ascending: false });

      if (error) {
        console.error('❌ Error fetching date inspections:', error);
        throw error;
      }

      console.log('✅ Fetched date inspections:', data?.length || 0);

      return (data || []).map((item: any) => ({
        id: item.id,
        inspection_date: item.inspection_date,
        inspection_time: item.inspection_time,
        overall_status: item.overall_status,
        responses: item.responses,
        location: item.location,
        user: item.user,
        photo_urls: item.photo_urls || [],
        notes: item.notes,
      })) as InspectionReport[];
    },
    enabled: !!userId && !!date,
  });
};