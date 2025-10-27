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
    <div className="min-h-screen bg-white pb-20">
      {/* Simple Header - White */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">WC Check</h1>
            <p className="text-sm text-gray-500">
              Hi, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-5 space-y-5">
        {/* Stats Cards - Simple 3D Shadow */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-gray-900">{dashboardStats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-blue-600">{dashboardStats.todayCount}</p>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-green-600">{dashboardStats.completed}</p>
            <p className="text-xs text-gray-500 mt-1">Done</p>
          </div>
        </div>

        {/* Primary Action - Big Button with 3D Shadow */}
        <button
          onClick={() => navigate('/scan')}
          className="w-full bg-white rounded-3xl p-6 shadow-[0_12px_40px_rgb(0,0,0,0.12)] active:shadow-[0_8px_30px_rgb(0,0,0,0.1)] active:translate-y-1 transition-all border border-gray-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-lg text-gray-900">Scan QR Code</p>
              <p className="text-gray-500 text-sm">Start new inspection</p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </div>
        </button>

        {/* Quick Actions - Simple Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/locations')}
            className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all border border-gray-50"
          >
            <MapPin className="w-7 h-7 text-blue-600 mb-3" />
            <p className="font-semibold text-gray-900 text-sm">Locations</p>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all border border-gray-50"
          >
            <Calendar className="w-7 h-7 text-blue-600 mb-3" />
            <p className="font-semibold text-gray-900 text-sm">Reports</p>
          </button>
        </div>

        {/* Recent Activity - Minimal */}
        {dashboardStats.recent && dashboardStats.recent.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Recent</h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-blue-600 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {dashboardStats.recent.slice(0, 3).map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {inspection.overall_status === 'completed' ||
                     inspection.overall_status === 'excellent' ||
                     inspection.overall_status === 'good' ? (
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Inspection</p>
                      <p className="text-xs text-gray-500">{inspection.inspection_date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Simple */}
        {dashboardStats.total === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No Inspections Yet
            </h3>
            <p className="text-gray-500 text-sm">
              Scan a QR code to start
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};