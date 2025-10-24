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
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  // Fetch recent inspections
  const { data: recentInspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['recent-inspections', user?.id],
    queryFn: async () => {
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
        .eq('user_id', user?.id)
        .order('inspection_date', { ascending: false })
        .order('inspection_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_records')
        .select('id, overall_status, inspection_date')
        .eq('user_id', user?.id);

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
    enabled: !!user?.id,
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between text-white mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hi, {user?.email?.split('@')[0]}! 👋</h1>
            <p className="text-blue-100 mt-1">Ready for inspection?</p>
          </div>
          <button 
            onClick={() => navigate('/admin/locations')}
            className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            title="Manage Locations"
          >
            <MapPin className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {stats?.total || 0}
            </div>
            <div className="text-xs text-blue-100 mt-1">Total</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {stats?.today || 0}
            </div>
            <div className="text-xs text-blue-100 mt-1">Today</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0}%
            </div>
            <div className="text-xs text-blue-100 mt-1">Success</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-6">
        {/* Scan Button - Prominent */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl">
          <button
            onClick={() => setShowScanner(true)}
            className="w-full py-6 flex flex-col items-center space-y-3 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <QrCode className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Scan QR Code</h2>
              <p className="text-blue-100 text-sm mt-1">
                Point camera at toilet location QR
              </p>
            </div>
          </button>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/locations')}
            className="h-24 flex flex-col items-center justify-center space-y-2"
          >
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium">Locations</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="h-24 flex flex-col items-center justify-center space-y-2"
          >
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium">Dashboard</span>
          </Button>
        </div>

        {/* Recent Inspections */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-600" />
              <span>Recent Inspections</span>
            </h3>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {loadingInspections ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : recentInspections?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No inspections yet</p>
                <p className="text-sm mt-1">Scan a QR code to start</p>
              </div>
            ) : (
              recentInspections?.map((inspection: any) => (
                <div 
                  key={inspection.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/inspect/${inspection.locations.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      inspection.overall_status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {inspection.overall_status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {inspection.locations.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {inspection.locations.building} • {inspection.locations.floor}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(inspection.inspection_date), 'dd MMM')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {inspection.inspection_time?.substring(0, 5)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
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