/**
 * Admin Dashboard Page
 */

'use client';

import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: systemStats } = trpc.admin.systemStats.useQuery();
  const { data: pendingSummary } = trpc.admin.pendingVerificationsSummary.useQuery();

  // Redirect if not admin
  if (user && !user.isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System management and overview
        </p>
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
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickActionCard
            title="Manage Users"
            description="View and manage user accounts"
            onClick={() => router.push('/admin/users')}
          />
          <QuickActionCard
            title="Manage Locations"
            description="Add and edit locations"
            onClick={() => router.push('/locations')}
          />
          <QuickActionCard
            title="Manage Buildings"
            description="Add and edit buildings"
            onClick={() => router.push('/admin/buildings')}
          />
          <QuickActionCard
            title="Generate QR Codes"
            description="Create QR codes for locations"
            onClick={() => router.push('/admin/qrcodes')}
          />
          <QuickActionCard
            title="View Reports"
            description="Access detailed reports"
            onClick={() => router.push('/reports')}
          />
          {user?.isSuperAdmin && (
            <QuickActionCard
              title="Organizations"
              description="Manage organizations"
              onClick={() => router.push('/admin/organizations')}
            />
          )}
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
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-interactive text-left w-full"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
