// src/pages/admin/AdminDashboard.tsx - Main Admin Dashboard
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Users,
  MapPin,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  Settings,
  BarChart3,
  Calendar,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { AdminCard } from '../../components/admin/AdminCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { format, subDays } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  totalLocations: number;
  totalInspections: number;
  todayInspections: number;
  activeUsers: number;
  avgScore: number;
  userGrowth: number;
  inspectionGrowth: number;
}

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch admin stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total locations
      const { count: totalLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total inspections
      const { count: totalInspections } = await supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true });

      // Today's inspections
      const { count: todayInspections } = await supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_date', today);

      // Yesterday's inspections for comparison
      const { count: yesterdayInspections } = await supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_date', yesterday);

      // Active users (logged in last 7 days)
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', weekAgo)
        .eq('is_active', true);

      // Average score calculation
      const { data: inspections } = await supabase
        .from('inspection_records')
        .select('responses')
        .limit(100);

      const calculateScore = (responses: any): number => {
        const values = Object.values(responses || {});
        if (values.length === 0) return 0;
        const goodCount = values.filter(v => 
          v === true || v === 'good' || v === 'excellent' || 
          v === 'baik' || v === 'bersih' || v === 'ada'
        ).length;
        return Math.round((goodCount / values.length) * 100);
      };

      const avgScore = inspections && inspections.length > 0
        ? Math.round(inspections.reduce((sum, i) => sum + calculateScore(i.responses), 0) / inspections.length)
        : 0;

      // Growth calculations
      const inspectionGrowth = yesterdayInspections && yesterdayInspections > 0
        ? Math.round(((todayInspections || 0) - yesterdayInspections) / yesterdayInspections * 100)
        : 0;

      return {
        totalUsers: totalUsers || 0,
        totalLocations: totalLocations || 0,
        totalInspections: totalInspections || 0,
        todayInspections: todayInspections || 0,
        activeUsers: activeUsers || 0,
        avgScore,
        userGrowth: 0, // Can be calculated with historical data
        inspectionGrowth
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between text-white mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-white mb-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-purple-100">Welcome back, {profile?.full_name}!</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Today's Inspections */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              {stats && stats.inspectionGrowth !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stats.inspectionGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.inspectionGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{Math.abs(stats.inspectionGrowth)}%</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.todayInspections || 0}</div>
            <div className="text-xs text-gray-600">Today's Inspections</div>
          </Card>

          {/* Average Score */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.avgScore || 0}</div>
            <div className="text-xs text-gray-600">Average Score</div>
          </Card>

          {/* Total Users */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
            <div className="text-xs text-gray-600">Total Users</div>
          </Card>

          {/* Active Users */}
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</div>
            <div className="text-xs text-gray-600">Active Users (7d)</div>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCard
              icon={Users}
              title="User Management"
              description="Manage users, roles, and permissions"
              path="/admin/users"
              color="blue"
              count={stats?.totalUsers}
            />

            <AdminCard
              icon={MapPin}
              title="Locations"
              description="Manage toilet locations and QR codes"
              path="/admin/locations"
              color="green"
              count={stats?.totalLocations}
            />

            <AdminCard
              icon={Briefcase}
              title="Occupations"
              description="Manage job titles and roles"
              path="/admin/occupations"
              color="purple"
            />

            <AdminCard
              icon={Building2}
              title="Organizations"
              description="Manage buildings and organizations"
              path="/admin/organizations"
              color="cyan"
            />

            <AdminCard
              icon={FileText}
              title="Templates"
              description="Manage inspection templates"
              path="/admin/templates"
              color="orange"
            />

            <AdminCard
              icon={BarChart3}
              title="Reports"
              description="View detailed analytics and reports"
              path="/admin/reports"
              color="red"
              count={stats?.totalInspections}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader 
            title="System Overview"
            subtitle="Key metrics at a glance"
            icon={<Activity className="w-5 h-5 text-blue-600" />}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Total Inspections</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.totalInspections || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Active Locations</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.totalLocations || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Today's Activity</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.todayInspections || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};