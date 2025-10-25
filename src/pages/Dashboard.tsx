// src/pages/Dashboard.tsx - Main Dashboard with Enhanced Features
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  MapPin,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  BarChart3,
  ScanIcon,
  Settings
} from 'lucide-react';
import { format, subDays, isToday, isYesterday, parseISO } from 'date-fns';
import { BottomNav } from '../components/mobile/BottomNav';
import { Card, CardHeader } from '../components/ui/Card';

interface RecentInspection {
  id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: string;
  location_id: string;
  locations: {
    name: string;
    building?: string;
    floor?: string;
  };
  duration_seconds?: number;
}

interface DashboardStats {
  todayCount: number;
  yesterdayCount: number;
  weeklyAverage: number;
  totalLocations: number;
  completionRate: number;
  avgScore: number;
}

export const DashboardEnhanced = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch recent inspections
  const { data: recentInspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ['recent-inspections', user?.id, timeFilter],
    queryFn: async (): Promise<RecentInspection[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const now = new Date();
      let startDate: string;

      switch (timeFilter) {
        case 'today':
          startDate = format(now, 'yyyy-MM-dd');
          break;
        case 'week':
          startDate = format(subDays(now, 7), 'yyyy-MM-dd');
          break;
        case 'month':
          startDate = format(subDays(now, 30), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(now, 'yyyy-MM-dd');
      }

      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          inspection_time,
          overall_status,
          location_id,
          duration_seconds,
          locations (
            name,
            building,
            floor
          )
        `)
        .eq('user_id', user.id)
        .gte('inspection_date', startDate)
        .order('inspection_date', { ascending: false })
        .order('inspection_time', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching inspections:', error);
        throw error;
      }

      return (data as RecentInspection[]) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const weekStart = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      // Today's inspections
      const { count: todayCount } = await supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('inspection_date', today);

      // Yesterday's inspections
      const { count: yesterdayCount } = await supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('inspection_date', yesterday);

      // Weekly average
      const { data: weeklyInspections } = await supabase
        .from('inspection_records')
        .select('inspection_date')
        .eq('user_id', user.id)
        .gte('inspection_date', weekStart);

      const uniqueDays = new Set(weeklyInspections?.map(i => i.inspection_date)).size;
      const weeklyAverage = uniqueDays > 0 ? (weeklyInspections?.length || 0) / uniqueDays : 0;

      // Total locations
      const { count: totalLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Recent inspections for score calculation
      const { data: recentForScore } = await supabase
        .from('inspection_records')
        .select('responses')
        .eq('user_id', user.id)
        .limit(50);

      // Calculate average score
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

      const avgScore = recentForScore && recentForScore.length > 0
        ? Math.round(recentForScore.reduce((sum, i) => sum + calculateScore(i.responses), 0) / recentForScore.length)
        : 0;

      // Completion rate (simplified)
      const completionRate = totalLocations ? Math.min(100, Math.round((todayCount || 0) / totalLocations * 100)) : 0;

      return {
        todayCount: todayCount || 0,
        yesterdayCount: yesterdayCount || 0,
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        totalLocations: totalLocations || 0,
        completionRate,
        avgScore,
      };
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
      case 'fair':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
      case 'poor':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'excellent':
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
      case 'fair':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timeString: string | undefined): string => {
    try {
      if (!timeString || typeof timeString !== 'string') return '--:--';
      
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = timeParts[0].padStart(2, '0');
        const minutes = timeParts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      return '--:--';
    } catch (error) {
      console.warn('Error formatting time:', error);
      return '--:--';
    }
  };

  const formatDuration = (seconds: number | undefined | null): string => {
    try {
      if (!seconds || seconds <= 0) return '< 1m';
      const minutes = Math.floor(seconds / 60);
      return minutes > 0 ? `${minutes}m` : '< 1m';
    } catch (error) {
      console.warn('Error formatting duration:', error);
      return '< 1m';
    }
  };

  const filterLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month'
  };

  if (inspectionsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between text-white mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚽</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">WC Check</h1>
              <p className="text-blue-100">Welcome back, {profile?.full_name || 'User'}!</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Today's Checks</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{stats?.todayCount || 0}</span>
              {stats && stats.todayCount > stats.yesterdayCount && (
                <span className="text-green-300 text-sm flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.todayCount - stats.yesterdayCount}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Avg Score</div>
            <div className="text-3xl font-bold text-white">{stats?.avgScore || 0}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between text-white/80 text-xs mb-2">
            <span>Daily Progress</span>
            <span>{stats?.completionRate || 0}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${stats?.completionRate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/scan')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all active:scale-95 text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
              <ScanIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="font-semibold text-gray-900">Scan QR</div>
            <div className="text-xs text-gray-600">Start inspection</div>
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all active:scale-95 text-left"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="font-semibold text-gray-900">Analytics</div>
            <div className="text-xs text-gray-600">View reports</div>
          </button>
        </div>

        {/* Recent Activity Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>{filterLabels[timeFilter]}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilterMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20">
                  {(['today', 'week', 'month'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => {
                        setTimeFilter(filter);
                        setShowFilterMenu(false);
                      }}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm
                        ${timeFilter === filter ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}
                      `}
                    >
                      {filterLabels[filter]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Inspections List */}
        <div className="space-y-3">
          {recentInspections?.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No inspections found</p>
                <p className="text-sm mt-1">Start by scanning a QR code</p>
              </div>
            </Card>
          ) : (
            recentInspections?.map((inspection) => (
              <Card key={inspection.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(inspection.overall_status)}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {inspection.locations?.name || 'Unknown Location'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {isToday(parseISO(inspection.inspection_date)) 
                            ? 'Today' 
                            : isYesterday(parseISO(inspection.inspection_date))
                            ? 'Yesterday'
                            : format(parseISO(inspection.inspection_date), 'MMM d')
                          }
                        </span>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(inspection.inspection_time)}</span>
                        {inspection.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(inspection.duration_seconds)}</span>
                          </>
                        )}
                      </div>
                      
                      {inspection.locations?.building && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {inspection.locations.building}
                            {inspection.locations.floor && ` • ${inspection.locations.floor}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(inspection.overall_status)}`}>
                    {inspection.overall_status}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader 
            title="Performance Overview"
            subtitle="Your inspection metrics"
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Weekly Average</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.weeklyAverage || 0}/day</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Total Locations</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.totalLocations || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Completion Rate</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.completionRate || 0}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};