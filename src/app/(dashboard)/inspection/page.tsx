/**
 * Inspections List Page
 */

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';

export default function InspectionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    overall_status: undefined as any,
    date_from: '',
    date_to: '',
  });

  const { data: inspections, isLoading } = trpc.inspection.list.useQuery({
    ...filters,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspections</h1>
          <p className="text-muted-foreground mt-1">
            View and manage toilet inspections
          </p>
        </div>
        <button
          onClick={() => router.push('/scan')}
          className="btn-primary"
        >
          New Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="container-elevated">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.overall_status || ''}
              onChange={(e) =>
                setFilters({ ...filters, overall_status: e.target.value || undefined })
              }
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                setFilters({ ...filters, date_from: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                setFilters({ ...filters, date_to: e.target.value })
              }
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Inspections List */}
      <div className="container-elevated">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : inspections && inspections.length > 0 ? (
          <div className="space-y-3">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="p-4 bg-secondary rounded-lg hover:shadow-elevation-2 transition-shadow cursor-pointer"
                onClick={() => router.push(`/inspection/${inspection.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{inspection.location_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {inspection.inspection_date} at {inspection.inspection_time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      By: {inspection.user_name}
                    </p>
                  </div>
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

                {inspection.notes && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {inspection.notes}
                  </p>
                )}

                {inspection.verified_at && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    ✓ Verified by {inspection.verifier_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No inspections found</p>
          </div>
        )}
      </div>
    </div>
  );
}
