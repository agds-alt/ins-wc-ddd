// src/pages/AnalyticsPage.tsx - Phase 1 Analytics Dashboard
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Download,
  ChevronDown,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth } from 'date-fns';

// Components
import { Card, CardHeader } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';

type TimePeriod = 'week' | 'month' | 'year';

interface AnalyticsData {
  totalInspections: number;
  avgScore: number;
  scoreChange: number;
  countChange: number;
  dailyTrend: Array<{ date: string; count: number; avgScore: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  peakHour: { hour: number; count: number } | null;
  locationPerformance: Array<{
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  }>;
  scoreRanges: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topPerformer: {
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  } | null;
  needsAttention: Array<{
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  }>;
}

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', user?.id, selectedPeriod],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const now = new Date();
      let startDate: string;
      let endDate: string = format(now, 'yyyy-MM-dd');

      // Determine date range based on period
      switch (selectedPeriod) {
        case 'week':
          startDate = format(startOfWeek(now), 'yyyy-MM-dd');
          break;
        case 'month':
          startDate = format(startOfMonth(now), 'yyyy-MM-dd');
          break;
        case 'year':
          startDate = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(startOfWeek(now), 'yyyy-MM-dd');
      }

      // Fetch inspections
      const { data: inspections, error: fetchError } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          inspection_time,
          responses,
          location_id,
          locations (
            id,
            name,
            building,
            floor
          )
        `)
        .eq('user_id', user.id)
        .gte('inspection_date', startDate)
        .lte('inspection_date', endDate)
        .order('inspection_date', { ascending: true });

      if (fetchError) {
        console.error('Error fetching inspections:', fetchError);
        throw fetchError;
      }

      // Robust score calculation function
      const calculateScore = (responses: any): number => {
        try {
          if (!responses || typeof responses !== 'object') return 0;
          
          const values = Object.values(responses);
          if (values.length === 0) return 0;
          
          const goodCount = values.filter(v => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'string') {
              const lowerVal = v.toLowerCase().trim();
              return ['good', 'excellent', 'baik', 'bersih', 'ada', 'yes', 'true', 'ok', 'lengkap'].includes(lowerVal);
            }
            if (typeof v === 'number') return v > 0;
            return false;
          }).length;
          
          return Math.round((goodCount / values.length) * 100);
        } catch (error) {
          console.warn('Error calculating score:', error);
          return 0;
        }
      };

      // Daily trend calculation
      const dailyMap = new Map<string, { count: number; totalScore: number }>();
      inspections?.forEach(insp => {
        try {
          const date = insp.inspection_date;
          const score = calculateScore(insp.responses);
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { count: 0, totalScore: 0 });
          }
          const data = dailyMap.get(date)!;
          data.count++;
          data.totalScore += score;
        } catch (error) {
          console.warn('Error processing inspection for daily trend:', error);
        }
      });

      const dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
      }));

      // Hourly distribution - ROBUST VERSION
      const hourlyMap = new Map<number, number>();
      inspections?.forEach(insp => {
        try {
          if (insp.inspection_time && typeof insp.inspection_time === 'string') {
            const timeParts = insp.inspection_time.split(':');
            if (timeParts.length > 0) {
              const hourStr = timeParts[0];
              const hour = parseInt(hourStr);
              if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
              }
            }
          }
        } catch (error) {
          console.warn('Error processing inspection time:', error);
        }
      });

      const hourlyDistribution = Array.from(hourlyMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);

      // Peak hour calculation
      const peakHour = hourlyDistribution.length > 0
        ? hourlyDistribution.reduce((max, curr) => curr.count > max.count ? curr : max)
        : null;

      // Location performance calculation
      const locationMap = new Map<string, { 
        name: string; 
        scores: number[]; 
        building?: string; 
        floor?: string;
        count: number;
      }>();
      
      inspections?.forEach(insp => {
        try {
          if (!insp.locations) return;
          const locId = insp.location_id;
          const score = calculateScore(insp.responses);
          
          if (!locationMap.has(locId)) {
            locationMap.set(locId, { 
              name: insp.locations.name || 'Unknown Location',
              building: insp.locations.building || undefined,
              floor: insp.locations.floor || undefined,
              scores: [],
              count: 0
            });
          }
          const locationData = locationMap.get(locId)!;
          locationData.scores.push(score);
          locationData.count++;
        } catch (error) {
          console.warn('Error processing location performance:', error);
        }
      });

      const locationPerformance = Array.from(locationMap.entries())
        .map(([id, data]) => {
          const avgScore = data.scores.length > 0 
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
            : 0;
            
          const trend = data.scores.length >= 2 
            ? data.scores[data.scores.length - 1] - data.scores[0]
            : 0;

          return {
            id,
            name: data.name,
            building: data.building,
            floor: data.floor,
            avgScore,
            count: data.count,
            trend
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore);

      // Score distribution calculation
      const scoreRanges = {
        excellent: 0, // 85-100
        good: 0,      // 70-84
        fair: 0,      // 50-69
        poor: 0       // 0-49
      };

      inspections?.forEach(insp => {
        try {
          const score = calculateScore(insp.responses);
          if (score >= 85) scoreRanges.excellent++;
          else if (score >= 70) scoreRanges.good++;
          else if (score >= 50) scoreRanges.fair++;
          else scoreRanges.poor++;
        } catch (error) {
          console.warn('Error calculating score range:', error);
        }
      });

      // Overall stats
      const totalInspections = inspections?.length || 0;
      const avgScore = totalInspections > 0
        ? Math.round(inspections!.reduce((sum, i) => sum + calculateScore(i.responses), 0) / totalInspections)
        : 0;

      // Previous period comparison
      let prevStart: string;
      let prevEnd: string;

      try {
        switch (selectedPeriod) {
          case 'week':
            prevStart = format(subDays(startOfWeek(now), 7), 'yyyy-MM-dd');
            prevEnd = format(subDays(endOfWeek(now), 7), 'yyyy-MM-dd');
            break;
          case 'month':
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevStart = format(prevMonth, 'yyyy-MM-dd');
            prevEnd = format(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0), 'yyyy-MM-dd');
            break;
          case 'year':
            prevStart = format(new Date(now.getFullYear() - 1, 0, 1), 'yyyy-MM-dd');
            prevEnd = format(new Date(now.getFullYear() - 1, 11, 31), 'yyyy-MM-dd');
            break;
          default:
            prevStart = format(subDays(startOfWeek(now), 7), 'yyyy-MM-dd');
            prevEnd = format(subDays(endOfWeek(now), 7), 'yyyy-MM-dd');
        }

        const { data: prevInspections } = await supabase
          .from('inspection_records')
          .select('id, responses')
          .eq('user_id', user.id)
          .gte('inspection_date', prevStart)
          .lte('inspection_date', prevEnd);

        const prevTotalInspections = prevInspections?.length || 0;
        const prevAvgScore = prevTotalInspections > 0
          ? Math.round(prevInspections!.reduce((sum, i) => sum + calculateScore(i.responses), 0) / prevTotalInspections)
          : 0;

        const scoreChange = avgScore - prevAvgScore;
        const countChange = totalInspections - prevTotalInspections;

        return {
          totalInspections,
          avgScore,
          scoreChange,
          countChange,
          dailyTrend,
          hourlyDistribution,
          peakHour,
          locationPerformance,
          scoreRanges,
          topPerformer: locationPerformance[0] || null,
          needsAttention: locationPerformance.filter(l => l.avgScore < 70)
        };
      } catch (comparisonError) {
        console.warn('Error calculating period comparison:', comparisonError);
        // Return data without comparison if there's an error
        return {
          totalInspections,
          avgScore,
          scoreChange: 0,
          countChange: 0,
          dailyTrend,
          hourlyDistribution,
          peakHour,
          locationPerformance,
          scoreRanges,
          topPerformer: locationPerformance[0] || null,
          needsAttention: locationPerformance.filter(l => l.avgScore < 70)
        };
      }
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    year: 'This Year'
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between text-white mb-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-purple-100 mt-1">Performance insights & trends</p>
          </div>
          <BarChart3 className="w-8 h-8 opacity-80" />
        </div>

        {/* Period Selector */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 flex items-center justify-between text-white font-medium"
          >
            <span>{periodLabels[selectedPeriod]}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>

          {showFilterMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowFilterMenu(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20">
                {(['week', 'month', 'year'] as TimePeriod[]).map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowFilterMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                      ${selectedPeriod === period ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}
                    `}
                  >
                    {periodLabels[period]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Total Inspections</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{analytics?.totalInspections || 0}</span>
              {analytics && analytics.countChange !== 0 && (
                <span className={`text-sm flex items-center gap-1 mb-1 ${analytics.countChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {analytics.countChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(analytics.countChange)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Average Score</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{analytics?.avgScore || 0}</span>
              {analytics && analytics.scoreChange !== 0 && (
                <span className={`text-sm flex items-center gap-1 mb-1 ${analytics.scoreChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {analytics.scoreChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(analytics.scoreChange)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Score Distribution */}
        <Card>
          <CardHeader 
            title="Score Distribution"
            subtitle="Quality breakdown"
            icon={<Activity className="w-5 h-5 text-purple-600" />}
          />
          <div className="space-y-3">
            {/* Excellent */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Excellent (85-100)</span>
                <span className="text-sm font-bold text-green-600">{analytics?.scoreRanges.excellent || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.excellent / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Good */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Good (70-84)</span>
                <span className="text-sm font-bold text-yellow-600">{analytics?.scoreRanges.good || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.good / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Fair */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Fair (50-69)</span>
                <span className="text-sm font-bold text-orange-600">{analytics?.scoreRanges.fair || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.fair / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Poor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Needs Work (0-49)</span>
                <span className="text-sm font-bold text-red-600">{analytics?.scoreRanges.poor || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.poor / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Peak Hours */}
        {analytics?.peakHour && (
          <Card>
            <CardHeader 
              title="Peak Inspection Hour"
              subtitle="Most active time"
              icon={<Clock className="w-5 h-5 text-blue-600" />}
            />
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <div className="text-sm text-gray-600 mb-1">Busiest at</div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.peakHour.hour.toString().padStart(2, '0')}:00
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Total checks</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.peakHour.count}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Location Performance */}
        <Card>
          <CardHeader 
            title="Location Rankings"
            subtitle="Performance by location"
            icon={<MapPin className="w-5 h-5 text-purple-600" />}
          />
          <div className="space-y-2">
            {analytics?.locationPerformance.slice(0, 10).map((loc, index) => (
              <div 
                key={loc.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                  ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                    index === 1 ? 'bg-gray-100 text-gray-600' : 
                    index === 2 ? 'bg-orange-100 text-orange-600' : 
                    'bg-gray-50 text-gray-500'}
                `}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{loc.name}</div>
                  <div className="text-xs text-gray-500">{loc.count} inspections</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{loc.avgScore}</div>
                  {loc.trend !== 0 && (
                    <div className={`text-xs flex items-center gap-0.5 ${loc.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {loc.trend > 0 ? '↑' : '↓'} {Math.abs(loc.trend)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!analytics?.locationPerformance.length && (
              <p className="text-center text-gray-500 py-8">No location data available</p>
            )}
          </div>
        </Card>

        {/* Needs Attention */}
        {analytics?.needsAttention && analytics.needsAttention.length > 0 && (
          <Card>
            <CardHeader 
              title="Needs Attention"
              subtitle="Locations below 70 score"
              icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            />
            <div className="space-y-2">
              {analytics.needsAttention.map(loc => (
                <div 
                  key={loc.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{loc.name}</div>
                    <div className="text-xs text-gray-500">
                      {loc.building && `${loc.building} • `}{loc.floor}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-600">{loc.avgScore}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Export Button */}
        <button
          onClick={() => alert('Export feature coming soon!')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-2xl font-medium text-gray-900 hover:bg-gray-50 transition-colors active:scale-95"
        >
          <Download className="w-5 h-5" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};