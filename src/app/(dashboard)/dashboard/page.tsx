/**
 * Dashboard Page
 * Main dashboard with stats
 */

'use client';

import { trpc } from '@/lib/trpc/client';

export default function DashboardPage() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: stats } = trpc.inspection.stats.useQuery();
  const { data: recentInspections } = trpc.inspection.recent.useQuery({ limit: 10 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.fullName}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inspections"
          value={stats?.total || 0}
          icon="clipboard"
        />
        <StatCard
          title="Today"
          value={stats?.today || 0}
          icon="calendar"
          color="blue"
        />
        <StatCard
          title="This Week"
          value={stats?.this_week || 0}
          icon="chart"
          color="green"
        />
        <StatCard
          title="Needs Attention"
          value={stats?.needs_attention || 0}
          icon="alert"
          color="red"
        />
      </div>

      {/* Status Breakdown */}
      {stats && (
        <div className="container-elevated">
          <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.by_status.excellent}
              </div>
              <div className="text-sm text-muted-foreground">Excellent</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.by_status.good}
              </div>
              <div className="text-sm text-muted-foreground">Good</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.by_status.fair}
              </div>
              <div className="text-sm text-muted-foreground">Fair</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.by_status.poor}
              </div>
              <div className="text-sm text-muted-foreground">Poor</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Inspections */}
      <div className="container-elevated">
        <h2 className="text-xl font-semibold mb-4">Recent Inspections</h2>
        {recentInspections && recentInspections.length > 0 ? (
          <div className="space-y-2">
            {recentInspections.map((inspection) => (
              <div
                key={inspection.id}
                className="p-4 bg-secondary rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{inspection.location_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {inspection.inspection_date} at {inspection.inspection_time}
                  </div>
                </div>
                <div>
                  <span
                    className={`badge ${
                      inspection.overall_status === 'excellent'
                        ? 'badge-success'
                        : inspection.overall_status === 'good'
                        ? 'badge-info'
                        : inspection.overall_status === 'fair'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {inspection.overall_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No inspections yet
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = 'default',
}: {
  title: string;
  value: number;
  icon: string;
  color?: 'default' | 'blue' | 'green' | 'red';
}) {
  return (
    <div className="container-elevated">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
