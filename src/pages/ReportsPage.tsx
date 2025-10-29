// src/pages/ReportsPage.tsx - WITH SIDEBAR
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMonthlyInspections, useDateInspections, InspectionReport } from '../hooks/useReports';
import { CalendarView } from '../components/reports/CalendarView';
import { InspectionDrawer } from '../components/reports/InspectionDrawer';
import { InspectionDetailModal } from '../components/reports/InspectionDetailModal';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import { Calendar, TrendingUp, FileText, Menu, Download, Users } from 'lucide-react';
import { exportToCSV, type ExportInspectionData } from '../lib/exportUtils';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ReportsPage = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionReport | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch monthly data
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyInspections(
    user?.id,
    currentDate
  );

  // Fetch specific date data when date is selected
  const { data: dateInspections } = useDateInspections(
    user?.id,
    selectedDate || ''
  );

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleCloseDrawer = () => {
    setSelectedDate(null);
  };

  const handleInspectionClick = (inspection: InspectionReport) => {
    setSelectedInspection(inspection);
  };

  const handleCloseDetail = () => {
    setSelectedInspection(null);
  };

  // Calculate stats
  const totalInspections = monthlyData?.reduce((sum, d) => sum + d.count, 0) || 0;
  const averageScore = monthlyData && monthlyData.length > 0
    ? Math.round(
        monthlyData.reduce((sum, d) => sum + (d.averageScore * d.count), 0) / totalInspections
      )
    : 0;

  // Export current month's inspections
  const handleExportMonth = async () => {
    if (!user?.id) return;

    toast.loading('Preparing export...');

    try {
      const startDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');

      // Fetch all inspections for current month with related data
      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          *,
          users!inspection_records_user_id_fkey (full_name, email, phone, occupation_id),
          locations!inner (
            name,
            floor,
            area,
            section,
            building_id,
            buildings!inner (name, organization_id, organizations!inner (name))
          )
        `)
        .eq('user_id', user.id)
        .gte('inspection_date', startDate)
        .lte('inspection_date', endDate)
        .order('inspection_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.dismiss();
        toast.error('No inspections to export for this month');
        return;
      }

      // Format data for export
      const exportData: ExportInspectionData[] = await Promise.all(
        data.map(async (inspection: any) => {
          // Get occupation name
          let occupationName = 'N/A';
          if (inspection.users?.occupation_id) {
            const { data: occupation } = await supabase
              .from('user_occupations')
              .select('display_name')
              .eq('id', inspection.users.occupation_id)
              .single();
            if (occupation) occupationName = occupation.display_name;
          }

          return {
            inspection_id: inspection.id,
            inspection_date: inspection.inspection_date || '',
            inspection_time: inspection.inspection_time || '',
            submitted_at: inspection.submitted_at ? format(new Date(inspection.submitted_at), 'yyyy-MM-dd HH:mm:ss') : '',
            overall_status: inspection.overall_status || '',
            notes: inspection.notes || '',
            user_full_name: inspection.users?.full_name || '',
            user_email: inspection.users?.email || '',
            user_phone: inspection.users?.phone || '',
            user_occupation: occupationName,
            location_name: inspection.locations?.name || '',
            building_name: inspection.locations?.buildings?.name || '',
            organization_name: inspection.locations?.buildings?.organizations?.name || '',
            floor: inspection.locations?.floor || '',
            area: inspection.locations?.area || '',
            section: inspection.locations?.section || '',
            photo_urls: (inspection.photo_urls || []).join('; '),
            responses: JSON.stringify(inspection.responses || {}),
          };
        })
      );

      toast.dismiss();
      exportToCSV(exportData, `inspections_${format(currentDate, 'yyyy-MM')}.csv`);
      toast.success(`Exported ${exportData.length} inspections`);
    } catch (error: any) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Failed to export: ' + error.message);
    }
  };

  // 👑 ADMIN ONLY: Export ALL users' inspections for current month
  const handleExportAllUsers = async () => {
    if (!user?.id || !isAdmin) {
      toast.error('Admin access required');
      return;
    }

    toast.loading('Preparing export for all users...');

    try {
      const startDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');

      // Fetch ALL inspections for current month (no user_id filter)
      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          *,
          users!inspection_records_user_id_fkey (full_name, email, phone, occupation_id),
          locations!inner (
            name,
            floor,
            area,
            section,
            building_id,
            buildings!inner (name, organization_id, organizations!inner (name))
          )
        `)
        .gte('inspection_date', startDate)
        .lte('inspection_date', endDate)
        .order('inspection_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.dismiss();
        toast.error('No inspections to export for this month');
        return;
      }

      // Format data for export
      const exportData: ExportInspectionData[] = await Promise.all(
        data.map(async (inspection: any) => {
          // Get occupation name
          let occupationName = 'N/A';
          if (inspection.users?.occupation_id) {
            const { data: occupation } = await supabase
              .from('user_occupations')
              .select('display_name')
              .eq('id', inspection.users.occupation_id)
              .single();
            if (occupation) occupationName = occupation.display_name;
          }

          return {
            inspection_id: inspection.id,
            inspection_date: inspection.inspection_date || '',
            inspection_time: inspection.inspection_time || '',
            submitted_at: inspection.submitted_at ? format(new Date(inspection.submitted_at), 'yyyy-MM-dd HH:mm:ss') : '',
            overall_status: inspection.overall_status || '',
            notes: inspection.notes || '',
            user_full_name: inspection.users?.full_name || '',
            user_email: inspection.users?.email || '',
            user_phone: inspection.users?.phone || '',
            user_occupation: occupationName,
            location_name: inspection.locations?.name || '',
            building_name: inspection.locations?.buildings?.name || '',
            organization_name: inspection.locations?.buildings?.organizations?.name || '',
            floor: inspection.locations?.floor || '',
            area: inspection.locations?.area || '',
            section: inspection.locations?.section || '',
            photo_urls: (inspection.photo_urls || []).join('; '),
            responses: JSON.stringify(inspection.responses || {}),
          };
        })
      );

      toast.dismiss();
      exportToCSV(exportData, `ALL_INSPECTIONS_${format(currentDate, 'yyyy-MM')}.csv`);
      toast.success(`✅ Exported ${exportData.length} inspections from all users`);
    } catch (error: any) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Failed to export: ' + error.message);
    }
  };

  if (monthlyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header - White Theme */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-500">Inspection history & analytics</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExportMonth}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md text-xs"
              disabled={totalInspections === 0}
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">My Data</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleExportAllUsers}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md text-xs"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">All Users</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards - White Theme */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">This Month</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalInspections}
            </div>
            <div className="text-xs text-gray-500 mt-1">Inspections</div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Average</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {averageScore}
            </div>
            <div className="text-xs text-gray-500 mt-1">Score</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Tap a date to view inspections
              </p>
              <p className="text-xs text-blue-700">
                Colored dots indicate average scores:
                <span className="font-semibold"> Green</span> (excellent),
                <span className="font-semibold"> Yellow</span> (good),
                <span className="font-semibold"> Red</span> (needs work)
              </p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <CalendarView
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          dateInspections={monthlyData || []}
          onDateClick={handleDateClick}
        />

        {/* Empty State */}
        {(!monthlyData || monthlyData.length === 0) && (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-bold text-gray-900 mb-2">No inspections yet</h3>
            <p className="text-gray-600 text-sm">
              Start inspecting locations to see them here
            </p>
          </div>
        )}
      </div>

      {/* Bottom Drawer */}
      <InspectionDrawer
        isOpen={!!selectedDate}
        onClose={handleCloseDrawer}
        inspections={dateInspections || []}
        selectedDate={selectedDate || ''}
        onInspectionClick={handleInspectionClick}
      />

      {/* Detail Modal */}
      <InspectionDetailModal
        isOpen={!!selectedInspection}
        onClose={handleCloseDetail}
        inspection={selectedInspection}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};