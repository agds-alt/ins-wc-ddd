// src/pages/ReportsPage.tsx - WITH SIDEBAR
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMonthlyInspections, useDateInspections, InspectionReport } from '../hooks/useReports';
import { CalendarView } from '../components/reports/CalendarView';
import { InspectionDrawer } from '../components/reports/InspectionDrawer';
import { InspectionDetailModal } from '../components/reports/InspectionDetailModal';
import { Sidebar } from '../components/mobile/Sidebar';
import { Calendar, TrendingUp, FileText, Menu } from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();
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
          <Calendar className="w-6 h-6 text-gray-400" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <FileText className="w-4 h-4 text-white" />
              <span className="text-xs text-blue-100">This Month</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalInspections}
            </div>
            <div className="text-xs text-blue-100 mt-1">Inspections</div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-xs text-blue-100">Average</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {averageScore}
            </div>
            <div className="text-xs text-blue-100 mt-1">Score</div>
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
    </div>
  );
};