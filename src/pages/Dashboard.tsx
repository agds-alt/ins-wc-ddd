// src/pages/Dashboard.tsx - COMPLETE FIXED VERSION
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Droplets, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  Bell,
  ChevronRight,
  Camera,
  FileText,
  TrendingUp,
  MapPin,
  Building2,
  Settings
} from 'lucide-react';

// Components
import { Card } from '../components/ui/Card';
import { MiniStatCard } from '../components/ui/StatCard';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusBadge } from '../components/ui/Badge';
import { BottomNav } from '../components/mobile/BottomNav';

// Helper function untuk score emoji
const getScoreEmoji = (score: number | undefined) => {
  if (!score) return '😐';
  if (score >= 80) return '😊';
  if (score >= 60) return '😐';
  return '😟';
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: inspections, error } = await supabase
        .from('inspection_records')
        .select('id, overall_status, inspection_date, responses')
        .eq('user_id', user.id)
        .order('inspection_date', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const total = inspections?.length || 0;
      const today = new Date().toISOString().split('T')[0];
      const todayCount = inspections?.filter(i => i.inspection_date === today).length || 0;
      const completedCount = inspections?.filter(i => i.overall_status === 'completed').length || 0;
      const pendingCount = total - completedCount;

      // Calculate average score
      const totalScore = inspections?.reduce((sum, inspection) => {
        const responses = inspection.responses as any;
        const values = Object.values(responses || {});
        const goodCount = values.filter(v => v === true || v === 'good' || v === 'excellent').length;
        return sum + (values.length > 0 ? (goodCount / values.length) * 100 : 0);
      }, 0) || 0;
      
      const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

      return {
        total,
        todayCount,
        completedCount,
        pendingCount,
        avgScore,
        recentInspections: inspections?.slice(0, 5) || [],
      };
    },
    enabled: !!user?.id,
  });

  // Fetch recent locations
  const { data: recentLocations } = useQuery({
    queryKey: ['recent-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations_with_details')
        .select('id, name, building_name, floor, area')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        navigate('/scan');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'locations':
        navigate('/locations');
        break;
      default:
        break;
    }
  };

  // Custom CardHeader component
  const CardHeader = ({ 
    title, 
    subtitle, 
    icon, 
    action 
  }: { 
    title: string; 
    subtitle?: string; 
    icon?: React.ReactNode; 
    action?: React.ReactNode; 
  }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );

  // EmptyState component
  const EmptyState = ({ 
    icon, 
    title, 
    message, 
    action 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    message: string; 
    action?: { label: string; onClick: () => void }; 
  }) => (
    <div className="text-center py-8">
      <div className="w-12 h-12 text-gray-400 mx-auto mb-3">{icon}</div>
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-gray-600 text-sm mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-white/20 rounded-xl animate-pulse" />
            <div className="h-24 bg-white/20 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="p-4 space-y-4 -mt-6">
          <div className="h-32 bg-white rounded-xl animate-pulse" />
          <div className="h-48 bg-white rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">Unable to fetch your statistics. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between text-white mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
              <span>👤</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                Hi, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}! 👋
              </h1>
              <p className="text-blue-100 text-sm">Ready for inspections today?</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {stats && stats.pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {stats.pendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards in Header - OPSI 1: PAKAI LABEL */}
        <div className="grid grid-cols-2 gap-3">
          <MiniStatCard
            icon={CheckCircle2}
            value={stats?.completedCount?.toString() || '0'}
            label="Completed Today"
            color="green"
            onClick={() => navigate('/history')}
          />
          <MiniStatCard
            icon={Clock}
            value={stats?.pendingCount?.toString() || '0'}
            label="Pending Tasks"
            color="yellow"
            onClick={() => navigate('/history')}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 space-y-4 -mt-6 relative z-10">
        {/* Quick Actions Card */}
        <Card className="p-6">
          <CardHeader 
            title="Quick Actions"
            subtitle="Start your inspection workflow"
          />
          <div className="grid grid-cols-4 gap-3">
            <ActionButton
              icon={Camera}
              label="Scan QR"
              variant="primary"
              onClick={() => handleQuickAction('scan')}
            />
            <ActionButton
              icon={FileText}
              label="History"
              onClick={() => handleQuickAction('history')}
            />
            <ActionButton
              icon={TrendingUp}
              label="Reports"
              onClick={() => handleQuickAction('reports')}
            />
            <ActionButton
              icon={MapPin}
              label="Locations"
              onClick={() => handleQuickAction('locations')}
            />
          </div>
        </Card>

        {/* Performance Overview */}
        <Card className="p-6">
          <CardHeader 
            title="Today's Performance"
            subtitle={`${stats?.todayCount || 0} inspections completed`}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            action={
              <button 
                onClick={() => navigate('/analytics')}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                View All
              </button>
            }
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Avg. Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-900">
                  {stats?.avgScore || 0}
                </span>
                <span className="text-sm text-green-700">/ 100</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {getScoreEmoji(stats?.avgScore)}
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {stats?.avgScore && stats.avgScore >= 80 ? 'Excellent' : stats?.avgScore && stats.avgScore >= 60 ? 'Good' : 'Needs Work'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Inspections */}
        <Card className="p-6">
          <CardHeader 
            title="Recent Inspections"
            subtitle="Your latest inspection activity"
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

          {stats?.recentInspections && stats.recentInspections.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInspections.map((inspection: any, index: number) => (
                <button
                  key={inspection.id}
                  onClick={() => navigate(`/inspection/${inspection.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">
                      Inspection #{stats.total - index}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(inspection.inspection_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <StatusBadge status={inspection.overall_status} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-gray-400" />}
              title="No Inspections Yet"
              message="Start your first inspection by scanning a QR code"
              action={{
                label: 'Scan Now',
                onClick: () => navigate('/scan')
              }}
            />
          )}
        </Card>

        {/* Quick Access Locations */}
        {recentLocations && recentLocations.length > 0 && (
          <Card className="p-6">
            <CardHeader 
              title="Quick Access Locations"
              subtitle="Recently added locations"
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
            />
            <div className="space-y-2">
              {recentLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => navigate(`/inspect/${location.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-500">
                        {location.building_name} • {location.floor}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="p-6 border border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Pro Tip of the Day
              </h3>
              <p className="text-sm text-gray-600">
                Complete inspections during off-peak hours for more accurate assessments. 
                Early morning checks often reveal the best cleanliness standards! 🌅
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;