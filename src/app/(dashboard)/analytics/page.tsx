/**
 * Analytics Page
 */

'use client';

import { trpc } from '@/lib/trpc/client';

export default function AnalyticsPage() {
  const { data: stats } = trpc.inspection.stats.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Detailed inspection analytics and insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Inspections" value={stats?.total || 0} />
        <StatCard title="Today" value={stats?.today || 0} />
        <StatCard title="This Week" value={stats?.this_week || 0} />
        <StatCard title="This Month" value={stats?.this_month || 0} />
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="container-elevated">
          <h2 className="text-xl font-semibold mb-4">Status Distribution</h2>

          {stats && (
            <div className="space-y-3">
              <ProgressBar
                label="Excellent"
                value={stats.by_status.excellent}
                total={stats.total}
                color="green"
              />
              <ProgressBar
                label="Good"
                value={stats.by_status.good}
                total={stats.total}
                color="blue"
              />
              <ProgressBar
                label="Fair"
                value={stats.by_status.fair}
                total={stats.total}
                color="yellow"
              />
              <ProgressBar
                label="Poor"
                value={stats.by_status.poor}
                total={stats.total}
                color="red"
              />
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div className="container-elevated">
          <h2 className="text-xl font-semibold mb-4">Verification Status</h2>

          {stats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Verified</div>
                  <div className="text-2xl font-bold">{stats.verified_count}</div>
                </div>
                <div className="text-green-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Pending Verification
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.pending_verification}
                  </div>
                </div>
                <div className="text-yellow-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Needs Attention */}
      {stats && stats.needs_attention > 0 && (
        <div className="container-elevated border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="text-red-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Attention Required</h3>
              <p className="text-sm text-muted-foreground">
                {stats.needs_attention} location(s) need immediate attention
              </p>
            </div>
          </div>
        </div>
      )}
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

function ProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'blue' | 'yellow' | 'red';
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colorClasses = {
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
