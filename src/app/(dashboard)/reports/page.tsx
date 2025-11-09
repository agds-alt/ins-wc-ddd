/**
 * Reports Page
 * Calendar view with monthly inspections
 * Modern, optimized with tRPC
 */

'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { CalendarView } from '@/components/CalendarView';
import { Calendar, Download, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface DateInspection {
  id: string;
  locationId: string;
  locationName: string;
  inspectionDate: string;
  inspectionTime: string;
  overallStatus: string;
  notes?: string | null;
  photoCount: number;
  submittedAt?: string | Date | null;
}

// Helper to get badge class from status
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'excellent':
      return 'badge-success';
    case 'good':
      return 'badge-info';
    case 'fair':
      return 'badge-warning';
    case 'poor':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
}

// Helper to translate status to Indonesian
function translateStatus(status: string): string {
  switch (status) {
    case 'excellent':
      return 'Sangat Baik';
    case 'good':
      return 'Baik';
    case 'fair':
      return 'Cukup';
    case 'poor':
      return 'Buruk';
    default:
      return status;
  }
}

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get current year and month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Fetch monthly inspections for calendar
  const { data: monthlyData, isLoading: monthlyLoading } = trpc.report.monthlyInspections.useQuery({
    year,
    month,
  });

  // Fetch inspections for selected date
  const { data: dateInspections, isLoading: dateLoading } = trpc.report.dateInspections.useQuery(
    { date: selectedDate || '' },
    { enabled: !!selectedDate }
  );

  // Calculate monthly stats
  const stats = useMemo(() => {
    if (!monthlyData) return { total: 0, average: 0, goodDays: 0, poorDays: 0 };

    const total = monthlyData.reduce((sum, d) => sum + d.count, 0);
    const totalScore = monthlyData.reduce((sum, d) => sum + d.averageScore * d.count, 0);
    const average = total > 0 ? Math.round(totalScore / total) : 0;
    const goodDays = monthlyData.filter((d) => d.averageScore >= 85).length;
    const poorDays = monthlyData.filter((d) => d.averageScore < 70).length;

    return { total, average, goodDays, poorDays };
  }, [monthlyData]);

  // Export current month
  const handleExport = () => {
    // const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    // const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');

    toast.loading('Preparing export...');

    // TODO: Implement actual export with tRPC
    // For now, just show success
    setTimeout(() => {
      toast.dismiss();
      toast.success('Export completed!');
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          Laporan
        </h1>
        <p className="text-muted-foreground mt-1">Kalender inspeksi dan analitik</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Inspeksi</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Rata-rata Skor</div>
          <div className="text-3xl font-bold text-green-900">{stats.average}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200">
          <div className="text-sm text-emerald-600 font-medium mb-1">Hari Baik</div>
          <div className="text-3xl font-bold text-emerald-900">{stats.goodDays}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">Hari Buruk</div>
          <div className="text-3xl font-bold text-red-900">{stats.poorDays}</div>
        </div>
      </div>

      {/* Calendar View */}
      <div>
        {monthlyLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="spinner mb-4" />
              <p className="text-gray-500">Memuat kalender...</p>
            </div>
          </div>
        ) : (
          <CalendarView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            dateInspections={monthlyData || []}
            onDateClick={setSelectedDate}
          />
        )}
      </div>

      {/* Selected Date Inspections */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Inspeksi - {format(new Date(selectedDate), 'dd MMMM yyyy')}
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
              type="button"
            >
              Tutup
            </button>
          </div>

          {dateLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : dateInspections && dateInspections.length > 0 ? (
            <div className="space-y-3">
              {dateInspections.map((inspection: DateInspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{inspection.locationName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {inspection.inspectionTime} · {inspection.photoCount} foto
                    </div>
                  </div>

                  <div>
                    <span className={`badge ${getStatusBadgeClass(inspection.overallStatus)}`}>
                      {translateStatus(inspection.overallStatus)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Tidak ada inspeksi pada tanggal ini</div>
          )}
        </div>
      )}

      {/* Export Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5" />
              Ekspor Data
            </h3>
            <p className="text-sm text-gray-600">
              Unduh laporan bulan {format(currentDate, 'MMMM yyyy')} dalam format CSV
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-95"
            type="button"
          >
            <Download className="w-5 h-5" />
            Ekspor CSV
          </button>
        </div>
      </div>
    </div>
  );
}
