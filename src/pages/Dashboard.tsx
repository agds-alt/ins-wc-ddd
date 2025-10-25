// src/pages/DashboardEnhanced.tsx - Phase 1: Analytics & Management Dashboard
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Home,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  MapPin,
  BarChart3,
  Users,
  Sparkles,
  ChevronRight,
  Award,
  Target
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isToday } from 'date-fns';

// Components
import { Card, CardHeader } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';

interface DashboardStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  avgScore: number;
  avgScoreChange: number;
  totalLocations: number;
  topLocations: Array<{ name: string; score: number; count: number }>;
  bottomLocations: Array<{ name: string; score: number; count: number }>;
  recentInspections: Array<any>;
  calendarData: Array<{ date: string; count: number; avgScore: number }>;
  hourlyPattern: Array<{ hour: number; count: number }>;
}

export const DashboardEnhanced = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Fetch comprehensive stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', user?.id, selectedPeriod],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(now), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const prevWeekStart = format(subDays(startOfWeek(now), 7), 'yyyy-MM-dd');
      const prevWeekEnd = format(subDays(endOfWeek(now), 7), 'yyyy-MM-dd');

      // Fetch all inspections
      const { data: inspections, error: inspError } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          inspection_time,
          overall_status,
          responses,
          location_id,
          locations (
            id,
            name,
            building,
            floor
          )
        `)
        .eq('user_id', user?.id)
        .order('inspection_date', { ascending: false })
        .order('inspection_time', { ascending: false });

      if (inspError) throw inspError;

      // Calculate score from responses
      const calculateScore = (responses: any): number => {
        const values = Object.values(responses || {});
        if (values.length === 0) return 0;
        const goodCount = values.filter(v => 
          v === true || 
          v === 'good' || 
          v === 'excellent' ||
          v === 'baik' ||
          v === 'bersih' ||
          v === 'ada'
        ).length;
        return Math.round((goodCount / values.length) * 100);
      };

      // Today's count
      const todayInspections = inspections?.filter(i => i.inspection_date === today) || [];
      
      // This week
      const thisWeekInspections = inspections?.filter(i => 
        i.inspection_date >= weekStart && i.inspection_date <= weekEnd
      ) || [];
      
      // This month
      const thisMonthInspections = inspections?.filter(i => 
        i.inspection_date >= monthStart && i.inspection_date <= monthEnd
      ) || [];

      // Previous week (for comparison)
      const prevWeekInspections = inspections?.filter(i => 
        i.inspection_date >= prevWeekStart && i.inspection_date <= prevWeekEnd
      ) || [];

      // Calculate average scores
      const calculateAvgScore = (list: any[]) => {
        if (list.length === 0) return 0;
        const total = list.reduce((sum, i) => sum + calculateScore(i.responses), 0);
        return Math.round(total / list.length);
      };

      const thisWeekAvg = calculateAvgScore(thisWeekInspections);
      const prevWeekAvg = calculateAvgScore(prevWeekInspections);
      const avgScoreChange = thisWeekAvg - prevWeekAvg;

      // Location performance
      const locationMap = new Map<string, { scores: number[]; name: string }>();
      
      (inspections || []).forEach(insp => {
        if (!insp.locations) return;
        const locId = insp.location_id;
        const score = calculateScore(insp.responses);
        
        if (!locationMap.has(locId)) {
          locationMap.set(locId, { scores: [], name: insp.locations.name });
        }
        locationMap.get(locId)!.scores.push(score);
      });

      const locationPerformance = Array.from(locationMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        count: data.scores.length
      }));

      const topLocations = locationPerformance
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      const bottomLocations = locationPerformance
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);

      // Calendar data for mini calendar (last 30 days)
      const calendarData: Array<{ date: string; count: number; avgScore: number }> = [];
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        const dayInspections = inspections?.filter(insp => insp.inspection_date === date) || [];
        if (dayInspections.length > 0) {
          calendarData.push({
            date,
            count: dayInspections.length,
            avgScore: calculateAvgScore(dayInspections)
          });
        }
      }

      // Hourly pattern analysis
      const hourlyMap = new Map<number, number>();
      (inspections || []).forEach(insp => {
        if (insp.inspection_time) {
          const hour = parseInt(insp.inspection_time.split(':')[0]);
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        }
      });

      const hourlyPattern = Array.from(hourlyMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);

      // Get unique locations count
      const { count: totalLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true });

      return {
        today: todayInspections.length,
        thisWeek: thisWeekInspections.length,
        thisMonth: thisMonthInspections.length,
        avgScore: thisWeekAvg,
        avgScoreChange,
        totalLocations: totalLocations || 0,
        topLocations,
        bottomLocations,
        recentInspections: inspections?.slice(0, 5) || [],
        calendarData,
        hourlyPattern
      };
    },
    enabled: !!user?.id,
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 85) return '😊';
    if (score >= 70) return '😐';
    return '😟';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-6 rounded-b-3xl shadow-lg">
        {/* User Profile */}
        <div className="flex items-center justify-between text-white mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">{profile?.full_name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">Hi, {profile?.full_name || 'User'}! 👋</h2>
              <p className="text-sm text-blue-100">{format(new Date(), 'EEEE, dd MMM yyyy')}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Users className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Today */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Today</div>
            <div className="text-3xl font-bold text-white">{stats?.today || 0}</div>
            <div className="text-white/70 text-xs mt-1">inspections</div>
          </div>

          {/* This Week */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">This Week</div>
            <div className="text-3xl font-bold text-white">{stats?.thisWeek || 0}</div>
            <div className="text-white/70 text-xs mt-1">inspections</div>
          </div>

          {/* Avg Score */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Avg Score</div>
            <div className="flex items-center space-x-1">
              <span className="text-3xl font-bold text-white">{stats?.avgScore || 0}</span>
              <span className="text-lg">{getScoreEmoji(stats?.avgScore || 0)}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {stats && stats.avgScoreChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-300" />
                  <span className="text-xs text-green-300">+{stats.avgScoreChange}</span>
                </>
              ) : stats && stats.avgScoreChange < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 text-red-300" />
                  <span className="text-xs text-red-300">{stats.avgScoreChange}</span>
                </>
              ) : (
                <span className="text-xs text-white/70">no change</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Mini Calendar Heat Map */}
        <Card>
          <CardHeader 
            title="Activity Calendar"
            subtitle="Last 30 days inspection history"
            icon={<Calendar className="w-5 h-5 text-blue-600" />}
            action={
              <button 
                onClick={() => navigate('/history')}
                className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
              >
                Full View
                <ChevronRight className="w-4 h-4" />
              </button>
            }
          />
          
          {/* Heat Map Grid */}
          <div className="grid grid-cols-10 gap-1 p-4">
            {Array.from({ length: 30 }).map((_, index) => {
              const date = format(subDays(new Date(), 29 - index), 'yyyy-MM-dd');
              const data = stats?.calendarData.find(d => d.date === date);
              const isCurrentDay = isToday(subDays(new Date(), 29 - index));
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg transition-all
                    ${data 
                      ? `${getScoreColor(data.avgScore)} opacity-${Math.min(data.count * 25, 100)}` 
                      : 'bg-gray-100'
                    }
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                  `}
                  title={data ? `${date}: ${data.count} inspections, avg ${data.avgScore}` : date}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600">Excellent</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-gray-600">Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-600">Needs Work</span>
            </div>
          </div>
        </Card>

        {/* Performance Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top Locations */}
          <Card>
            <CardHeader 
              title="Top Performers"
              icon={<Award className="w-5 h-5 text-green-600" />}
            />
            <div className="space-y-3">
              {stats?.topLocations.map((loc, index) => (
                <div key={loc.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{loc.name}</div>
                    <div className="text-xs text-gray-500">{loc.count} checks</div>
                  </div>
                  <div className="text-lg font-bold text-green-600">{loc.score}</div>
                </div>
              ))}
              {!stats?.topLocations.length && (
                <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
              )}
            </div>
          </Card>

          {/* Bottom Locations */}
          <Card>
            <CardHeader 
              title="Needs Attention"
              icon={<Target className="w-5 h-5 text-red-600" />}
            />
            <div className="space-y-3">
              {stats?.bottomLocations.map((loc, index) => (
                <div key={loc.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{loc.name}</div>
                    <div className="text-xs text-gray-500">{loc.count} checks</div>
                  </div>
                  <div className="text-lg font-bold text-red-600">{loc.score}</div>
                </div>
              ))}
              {!stats?.bottomLocations.length && (
                <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader 
            title="Recent Inspections"
            subtitle="Your latest activity"
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            action={
              <button 
                onClick={() => navigate('/history')}
                className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
              >
                See All
                <ChevronRight className="w-4 h-4" />
              </button>
            }
          />

          <div className="space-y-3">
            {stats?.recentInspections.map((inspection: any) => {
              const score = (() => {
                const values = Object.values(inspection.responses || {});
                if (values.length === 0) return 0;
                const goodCount = values.filter((v: any) => 
                  v === true || v === 'good' || v === 'excellent'
                ).length;
                return Math.round((goodCount / values.length) * 100);
              })();

              return (
                <button
                  key={inspection.id}
                  onClick={() => navigate(`/history`)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 ${getScoreColor(score)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg">{getScoreEmoji(score)}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {inspection.locations?.name || 'Unknown Location'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(inspection.inspection_date), 'dd MMM yyyy')} • {inspection.inspection_time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{score}</div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </button>
              );
            })}

            {!stats?.recentInspections.length && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No inspections yet</p>
                <button
                  onClick={() => navigate('/scan')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Start First Inspection
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
          >
            <Camera className="w-5 h-5" />
            <span>New Inspection</span>
          </button>
          <button
            onClick={() => navigate('/locations')}
            className="flex items-center justify-center space-x-2 p-4 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl font-medium hover:bg-gray-50 transition-colors active:scale-95"
          >
            <MapPin className="w-5 h-5" />
            <span>View Locations</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};