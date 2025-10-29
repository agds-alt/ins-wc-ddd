// src/pages/Dashboard.tsx - WITH SIDEBAR
import { useState } from 'react';
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
  Clock,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

export const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ WAIT for auth to complete AND user to exist
  const isAuthReady = !authLoading && !!user?.id;

  // Fetch user statistics - OPTIMIZED FOR PERFORMANCE
  const { data: stats, isLoading: statsLoading, error } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: inspections, error: fetchError } = await supabase
        .from('inspection_records')
        .select('id, overall_status, inspection_date, responses')
        .eq('user_id', user.id)
        .order('inspection_date', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Dashboard query error:', fetchError);
        // Return empty stats instead of throwing (prevents ErrorBoundary)
        return {
          total: 0,
          todayCount: 0,
          completed: 0,
          recent: [],
        };
      }

      const total = inspections?.length || 0;

      // ✅ Better date handling - account for timezone
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Also check for dates that might be stored in local timezone
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const todayCount = inspections?.filter(i => {
        if (!i.inspection_date) return false;
        // Try multiple date comparison methods
        if (i.inspection_date === todayStr) return true;
        if (i.inspection_date.startsWith(todayStr)) return true;

        // Parse the stored date and compare
        try {
          const inspDate = new Date(i.inspection_date);
          return inspDate.getFullYear() === today.getFullYear() &&
                 inspDate.getMonth() === today.getMonth() &&
                 inspDate.getDate() === today.getDate();
        } catch {
          return false;
        }
      }).length || 0;

      const completed = inspections?.filter(i => {
        return i.overall_status === 'completed' ||
               i.overall_status === 'excellent' ||
               i.overall_status === 'good' ||
               (i.responses?.score && i.responses.score >= 60);
      }).length || 0;

      const recentData = inspections?.slice(0, 3) || [];

      return {
        total,
        todayCount,
        completed,
        recent: recentData,
      };
    },
    enabled: isAuthReady,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes (was 2 mins)
    gcTime: 10 * 60 * 1000, // Keep in memory 10 minutes (was 5)
    refetchOnMount: false, // ⚡ Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false,
    retry: false, // ⚡ Fail fast, don't retry
  });

  // ✅ Use default empty stats if no data (removed redundant auth check - handled by App.tsx routing)
  const dashboardStats = stats || {
    total: 0,
    todayCount: 0,
    completed: 0,
    recent: [],
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Simple Header - White */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="WC Check"
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback to PNG if SVG fails
                  const img = e.target as HTMLImageElement;
                  if (img.src.endsWith('.svg')) {
                    img.src = '/logo.png';
                  } else {
                    // If both fail, just hide the image (text will remain)
                    img.style.display = 'none';
                  }
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">WC Check</h1>
                <p className="text-sm text-gray-500">
                  Hi, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
              </div>
            </div>
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
          type="button"
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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      <BottomNav />
    </div>
  );
};