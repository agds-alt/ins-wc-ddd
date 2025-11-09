/**
 * Admin Dashboard Page
 */

'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  QrCode,
  Building,
  MapPin,
  FileText,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: systemStats } = trpc.admin.systemStats.useQuery();
  const { data: pendingSummary } = trpc.admin.pendingVerificationsSummary.useQuery();

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user.isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with gradient background */}
      <div className="container-elevated bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-100 mt-1">
              System management and overview
            </p>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={systemStats?.users || 0}
        />
        <StatCard
          title="Locations"
          value={systemStats?.locations || 0}
        />
        <StatCard
          title="Buildings"
          value={systemStats?.buildings || 0}
        />
        <StatCard
          title="Inspections"
          value={systemStats?.inspections || 0}
        />
      </div>

      {/* Pending Verifications */}
      {pendingSummary && pendingSummary.total > 0 && (
        <div className="container-elevated border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Pending Verifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingSummary.total} inspection(s) waiting for verification
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/verifications')}
              className="btn-primary"
            >
              Review
            </button>
          </div>

          {pendingSummary.needs_attention > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-red-600">
                ⚠️ {pendingSummary.needs_attention} location(s) need immediate
                attention
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="container-elevated">
        <h2 className="text-xl font-semibold mb-4">🚀 Admin Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Users className="w-6 h-6" />}
            title="Manage Users"
            description="View and manage user accounts & roles"
            onClick={() => router.push('/admin/users')}
            color="blue"
          />
          <QuickActionCard
            icon={<Building2 className="w-6 h-6" />}
            title="Manage Buildings"
            description="Add and edit buildings"
            onClick={() => router.push('/admin/buildings')}
            color="green"
          />
          {user?.isSuperAdmin && (
            <QuickActionCard
              icon={<Building className="w-6 h-6" />}
              title="Organizations"
              description="Manage organizations (Super Admin)"
              onClick={() => router.push('/admin/organizations')}
              color="purple"
            />
          )}
          <QuickActionCard
            icon={<MapPin className="w-6 h-6" />}
            title="Manage Locations"
            description="Add and edit toilet locations"
            onClick={() => router.push('/locations')}
            color="orange"
          />
          <QuickActionCard
            icon={<QrCode className="w-6 h-6" />}
            title="Generate QR Codes"
            description="Create QR codes for locations"
            onClick={() => router.push('/admin/qrcodes')}
            color="indigo"
          />
          <QuickActionCard
            icon={<FileText className="w-6 h-6" />}
            title="View Reports"
            description="Access detailed inspection reports"
            onClick={() => router.push('/reports')}
            color="gray"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="container-elevated">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  color = 'blue',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
    indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
    gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  };

  return (
    <button
      onClick={onClick}
      className="group container-elevated hover:shadow-lg transition-all duration-200 text-left w-full p-6 hover:scale-105"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}
