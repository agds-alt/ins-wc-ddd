/**
 * Dashboard Page
 * Main dashboard with stats - Modern UI
 */

'use client';

import { trpc } from '@/lib/trpc/client';
import {
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  QrCode
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function DashboardPage() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: stats } = trpc.inspection.stats.useQuery();
  const { data: recentInspections } = trpc.inspection.recent.useQuery({ limit: 5 });

  return (
    <div className="space-y-6 pb-24">
      {/* Header with greeting */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Home className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <p className="text-blue-100 text-lg">
          Selamat datang kembali, {user?.fullName}!
        </p>
        <p className="text-blue-200 text-sm mt-1">
          {format(new Date(), 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <a
          href="/scan"
          className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all active:scale-95"
        >
          <QrCode className="w-8 h-8 text-green-600 mb-2" />
          <div className="font-semibold text-green-900">Scan QR</div>
          <div className="text-sm text-green-600">Mulai inspeksi</div>
        </a>

        <a
          href="/reports"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all active:scale-95"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <div className="font-semibold text-purple-900">Laporan</div>
          <div className="text-sm text-purple-600">Lihat kalender</div>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Inspeksi"
          value={stats?.total || 0}
          icon={CheckCircle2}
          iconColor="text-blue-600"
          bgColor="from-blue-50 to-blue-100"
          borderColor="border-blue-200"
        />
        <StatCard
          title="Hari Ini"
          value={stats?.today || 0}
          icon={Clock}
          iconColor="text-green-600"
          bgColor="from-green-50 to-green-100"
          borderColor="border-green-200"
        />
        <StatCard
          title="Minggu Ini"
          value={stats?.this_week || 0}
          icon={TrendingUp}
          iconColor="text-purple-600"
          bgColor="from-purple-50 to-purple-100"
          borderColor="border-purple-200"
        />
        <StatCard
          title="Perlu Perhatian"
          value={stats?.needs_attention || 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="from-red-50 to-red-100"
          borderColor="border-red-200"
        />
      </div>

      {/* Status Breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Status Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-3xl font-bold text-green-700">
                {stats.by_status.excellent}
              </div>
              <div className="text-sm text-green-600 font-medium mt-1">
                Sangat Baik
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">
                {stats.by_status.good}
              </div>
              <div className="text-sm text-blue-600 font-medium mt-1">Baik</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">
                {stats.by_status.fair}
              </div>
              <div className="text-sm text-yellow-600 font-medium mt-1">Cukup</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="text-3xl font-bold text-red-700">
                {stats.by_status.poor}
              </div>
              <div className="text-sm text-red-600 font-medium mt-1">Buruk</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Inspections */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Inspeksi Terbaru
        </h2>
        {recentInspections && recentInspections.length > 0 ? (
          <div className="space-y-3">
            {recentInspections.map((inspection) => (
              <div
                key={inspection.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {inspection.location_name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {format(new Date(inspection.inspection_date), 'dd MMM yyyy')} · {inspection.inspection_time}
                  </div>
                </div>
                <div>
                  <span className={`badge ${getStatusBadgeClass(inspection.overall_status)}`}>
                    {translateStatus(inspection.overall_status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Belum ada inspeksi</p>
            <p className="text-gray-400 text-sm mt-2">Mulai dengan scan QR code lokasi</p>
            <a
              href="/scan"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              Scan Sekarang
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
}: {
  title: string;
  value: number;
  icon: typeof Home;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-2xl p-4 border ${borderColor}`}>
      <Icon className={`w-6 h-6 ${iconColor} mb-2`} />
      <div className="text-sm text-gray-600 font-medium mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
