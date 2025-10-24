// src/hooks/useReports.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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

// Get inspections for a specific month
export const useMonthlyInspections = (userId: string | undefined, currentDate: Date) => {
  return useQuery({
    queryKey: ['monthly-inspections', userId, format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

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

      if (error) throw error;

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
        const scores = inspections.map(ins => {
          const responses = ins.responses as any;
          return responses?.score || 0;
        });
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

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

      if (error) throw error;

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