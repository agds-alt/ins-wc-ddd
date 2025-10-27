// src/pages/Dashboard.tsx - FIXED WITH submitted_at
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  QrCode, 
  MapPin, 
  Calendar, 
  User,
  ChevronRight,
  Droplets,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { BottomNav } from '../components/mobile/BottomNav';

export const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  console.log('🏠 Dashboard - Auth:', { userId: user?.id, authLoading });

  // ✅ WAIT for auth to complete AND user to exist
  const isAuthReady = !authLoading && !!user?.id;

  // Fetch user statistics - STABLE
  const { data: stats, isLoading: statsLoading, error } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('⚠️ No user ID in query function');
        return null;
      }

      console.log('📊 Fetching stats for user:', user.id);

      const { data: inspections, error } = await supabase
        .from('inspection_records')
        .select('id, overall_status, inspection_date, inspection_time, responses, submitted_at')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching inspections:', error);
        throw error;
      }

      console.log(`✅ Fetched ${inspections?.length || 0} inspections`);

      const total = inspections?.length || 0;
      const today = new Date().toISOString().split('T')[0];
      const todayCount = inspections?.filter(i => i.inspection_date === today).length || 0;

      const completed = inspections?.filter(i => {
        if (i.overall_status === 'completed' ||
            i.overall_status === 'excellent' ||
            i.overall_status === 'good') {
          return true;
        }
        if (i.responses?.score && i.responses.score >= 60) {
          return true;
        }
        return false;
      }).length || 0;

      const recentData = inspections?.slice(0, 3) || [];

      console.log('📈 Stats:', { total, todayCount, completed });

      return {
        total,
        todayCount,
        completed,
        recent: recentData,
      };
    },
    enabled: isAuthReady, // ✅ ONLY run when auth is DONE and user exists
    staleTime: 60 * 1000, // Cache 1 minute (longer cache)
    cacheTime: 5 * 60 * 1000, // Keep in memory 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ✅ Show loading until BOTH auth ready AND stats loaded
  const isLoading = !isAuthReady || (isAuthReady && statsLoading);

  console.log('🎨 Render:', { isAuthReady, statsLoading, isLoading, hasStats: !!stats });

  if (isLoading) {
    console.log('⏳ Loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Dashboard error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error.message || 'Failed to load data'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Use default empty stats if no data (instead of blocking render)
  const dashboardStats = stats || {
    total: 0,
    todayCount: 0,
    completed: 0,
    recent: [],
  };

  console.log('📊 Final stats for render:', dashboardStats);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">WC Check</h1>
            <p className="text-blue-100 text-sm">
              Welcome, {profile?.full_name || user?.email?.split('@')[0]}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-100 text-xs mb-1">Total</p>
            <p className="text-2xl font-bold">{dashboardStats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-100 text-xs mb-1">Today</p>
            <p className="text-2xl font-bold">{dashboardStats.todayCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-100 text-xs mb-1">Done</p>
            <p className="text-2xl font-bold">{dashboardStats.completed}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Primary Action */}
        <button
          onClick={() => {
            console.log('🎯 Navigating to scan page');
            navigate('/scan');
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <QrCode className="w-7 h-7" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Scan QR Code</p>
                <p className="text-blue-100 text-sm">Start new inspection</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/locations')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <MapPin className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Locations</p>
            <p className="text-gray-500 text-xs">View all</p>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <Calendar className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Reports</p>
            <p className="text-gray-500 text-xs">View history</p>
          </button>
        </div>

        {/* Recent Activity */}
        {dashboardStats.recent && dashboardStats.recent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-blue-600 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {dashboardStats.recent.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Inspection
                      </p>
                      <p className="text-xs text-gray-500">
                        {inspection.inspection_date} {inspection.inspection_time}
                      </p>
                    </div>
                  </div>
                  {inspection.overall_status === 'completed' || 
                   inspection.overall_status === 'excellent' ||
                   inspection.overall_status === 'good' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {dashboardStats.total === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Inspections Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start your first inspection by scanning a QR code
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Scan QR Code
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};