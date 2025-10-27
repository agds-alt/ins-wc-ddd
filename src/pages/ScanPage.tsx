// src/pages/ScanPage.tsx - UPDATED: Query by location ID
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ScanModal } from '../components/mobile/ScanModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  QrCode, 
  History, 
  MapPin, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export const ScanPage = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  // ✅ Wait for auth to complete before querying
  const isReady = !authLoading && !!user?.id;

  // Fetch recent inspections
  const { data: recentInspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['recent-inspections', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          inspection_time,
          overall_status,
          locations!inner (
            id,
            name,
            building,
            floor,
            code
          )
        `)
        .eq('user_id', user.id)
        .order('inspection_date', { ascending: false })
        .order('inspection_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: isReady,
    staleTime: 30 * 1000, // Cache 30 seconds
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inspection_records')
        .select('id, overall_status, inspection_date')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(r => r.overall_status === 'completed').length;
      const today = data.filter(r => {
        const recordDate = new Date(r.inspection_date || '');
        const now = new Date();
        return recordDate.toDateString() === now.toDateString();
      }).length;

      return { total, completed, today };
    },
    enabled: isReady,
    staleTime: 60 * 1000, // Cache 1 minute
  });

  const handleScan = async (locationId: string) => {
    try {
      console.log('🔍 Scanned Location ID:', locationId);
      
      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(locationId)) {
        toast.error('Invalid location ID format');
        return;
      }

      // Query location directly by ID (primary key - very fast!)
      const { data: location, error } = await supabase
        .from('locations')
        .select('id, name, is_active, building, floor')
        .eq('id', locationId)
        .single();

      if (error || !location) {
        console.error('❌ Location not found:', error);
        toast.error('Location not found. Please contact admin.');
        return;
      }

      if (!location.is_active) {
        toast.error('This location is currently inactive');
        return;
      }

      console.log('✅ Location found:', location);
      toast.success(`Opening ${location.name}...`);
      
      setShowScanner(false);
      navigate(`/inspect/${location.id}`);

    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to process QR code');
    }
  };

  // Show loading while auth completes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Simple Header - White */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Hi, {user?.email?.split('@')[0] || 'Guest'}! 👋
            </h1>
            <p className="text-sm text-gray-500">Ready to scan?</p>
          </div>
        </div>

        {/* Stats Cards - Simple 3D Shadow */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.today || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Today</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Success</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Scan Button - Big with 3D Shadow */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-full bg-white rounded-3xl p-8 shadow-[0_12px_40px_rgb(0,0,0,0.12)] active:shadow-[0_8px_30px_rgb(0,0,0,0.1)] active:translate-y-1 transition-all border border-gray-100"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
              <p className="text-gray-500 text-sm mt-1">
                Point camera at location QR
              </p>
            </div>
          </div>
        </button>

        {/* Quick Actions - Simple Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/locations')}
            className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all border border-gray-50"
          >
            <MapPin className="w-7 h-7 text-blue-600 mb-3" />
            <span className="text-sm font-semibold text-gray-900">Locations</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all border border-gray-50"
          >
            <TrendingUp className="w-7 h-7 text-green-600 mb-3" />
            <span className="text-sm font-semibold text-gray-900">Dashboard</span>
          </button>
        </div>

        {/* Recent Inspections - Simple */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent</h3>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {loadingInspections ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : recentInspections?.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                <p className="text-gray-400 text-sm">No inspections yet</p>
              </div>
            ) : (
              recentInspections?.slice(0, 5).map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      inspection.overall_status === 'completed'
                        ? 'bg-green-50'
                        : 'bg-gray-50'
                    }`}>
                      {inspection.overall_status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {inspection.locations.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(inspection.inspection_date), 'dd MMM')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scan Modal */}
      <ScanModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
};