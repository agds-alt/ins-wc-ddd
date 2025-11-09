/**
 * Reports Page
 */

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
  });

  const { data: exportData } = trpc.report.export.useQuery(dateRange);
  const { data: trending } = trpc.report.trending.useQuery({
    ...dateRange,
    days: 30,
  });

  const handleExport = () => {
    if (!exportData) return;

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csv = [
      headers.join(','),
      ...exportData.map((row) =>
        headers.map((h) => JSON.stringify(row[h as keyof typeof row])).join(',')
      ),
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspections-${dateRange.date_from}-to-${dateRange.date_to}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate and export inspection reports
        </p>
      </div>

      {/* Date Range */}
      <div className="container-elevated">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.date_from}
              onChange={(e) =>
                setDateRange({ ...dateRange, date_from: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.date_to}
              onChange={(e) =>
                setDateRange({ ...dateRange, date_to: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div className="flex items-end">
            <button onClick={handleExport} className="btn-primary w-full">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="container-elevated">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>

        {exportData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{exportData.length}</div>
              <div className="text-sm text-muted-foreground">
                Total Inspections
              </div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {exportData.filter((i) => i.overall_status === 'Sangat Baik').length}
              </div>
              <div className="text-sm text-muted-foreground">Excellent</div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {exportData.filter((i) => i.overall_status === 'Cukup').length}
              </div>
              <div className="text-sm text-muted-foreground">Fair</div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {exportData.filter((i) => i.overall_status === 'Buruk').length}
              </div>
              <div className="text-sm text-muted-foreground">Poor</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Trending Chart Placeholder */}
      <div className="container-elevated">
        <h2 className="text-xl font-semibold mb-4">Trends (Last 30 Days)</h2>
        <div className="h-64 bg-secondary rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">
            Chart visualization will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
