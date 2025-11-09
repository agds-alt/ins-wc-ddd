/**
 * QR Code Generator Page
 * View and generate QR codes for locations (Admin only)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import { QrCode, Download, RefreshCw, Search, Building2 } from 'lucide-react';

export default function QRCodesPage() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast.error('Admin access required');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch locations
  const { data: locations, isLoading } = trpc.location.list.useQuery({
    search: search || undefined,
    building_id: selectedBuilding || undefined,
    is_active: true,
    limit: 100,
  });

  // Fetch buildings for filter
  const { data: buildings } = trpc.building.list.useQuery({
    is_active: true,
  });

  const handleDownloadQR = (_locationId: string, locationName: string) => {
    // TODO: Implement actual QR code generation and download
    toast.success(`QR code for "${locationName}" will be downloaded`);
  };

  const handleDownloadAll = () => {
    // TODO: Implement batch QR code download
    toast.success('All QR codes will be downloaded as a zip file');
  };

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">QR Code Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate and download QR codes for all locations
        </p>
      </div>

      {/* Filters */}
      <div className="container-elevated">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Locations
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, or QR code..."
              className="input-field"
            />
          </div>

          {/* Building Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Filter by Building
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="input-field"
            >
              <option value="">All Buildings</option>
              {buildings?.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Download All Button */}
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={handleDownloadAll}
            className="btn-primary flex items-center gap-2"
            disabled={!locations || locations.length === 0}
          >
            <Download className="w-4 h-4" />
            Download All QR Codes ({locations?.length || 0})
          </button>
        </div>
      </div>

      {/* QR Codes Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : locations && locations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <QRCodeCard
              key={location.id}
              location={location}
              onDownload={handleDownloadQR}
            />
          ))}
        </div>
      ) : (
        <div className="container-elevated text-center py-12">
          <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search || selectedBuilding
              ? 'No locations found matching your filters'
              : 'No locations found'}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="container-elevated bg-blue-50 border-l-4 border-blue-500">
        <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
          <li>Download individual QR codes for specific locations</li>
          <li>Download all QR codes as a ZIP file for printing</li>
          <li>Print and display QR codes at each location</li>
          <li>Staff can scan these codes to start inspections</li>
        </ul>
      </div>
    </div>
  );
}

interface QRCodeCardProps {
  location: {
    id: string;
    name: string;
    qr_code: string;
    code?: string | null;
    building_name?: string | null;
    floor?: string | null;
    area?: string | null;
  };
  onDownload: (locationId: string, locationName: string) => void;
}

function QRCodeCard({ location, onDownload }: QRCodeCardProps) {
  const utils = trpc.useUtils();

  const regenerateQR = trpc.location.regenerateQR.useMutation({
    onSuccess: () => {
      toast.success('QR code regenerated!');
      utils.location.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to regenerate QR code');
    },
  });

  const handleRegenerate = () => {
    if (
      confirm(
        `Regenerate QR code for "${location.name}"? The old QR code will no longer work.`
      )
    ) {
      regenerateQR.mutate(location.id);
    }
  };

  return (
    <div className="container-elevated hover:shadow-lg transition-shadow">
      {/* QR Code Placeholder */}
      <div className="bg-secondary rounded-xl p-6 flex items-center justify-center mb-4">
        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
          <QrCode className="w-20 h-20 text-gray-400" />
        </div>
      </div>

      {/* Location Info */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-lg truncate">{location.name}</h3>

        <code className="block text-xs bg-secondary px-2 py-1 rounded font-mono">
          {location.qr_code}
        </code>

        <div className="text-sm text-muted-foreground space-y-1">
          {location.building_name && <p>🏢 {location.building_name}</p>}
          {location.floor && <p>📍 Floor: {location.floor}</p>}
          {location.area && <p>📐 Area: {location.area}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(location.id, location.name)}
          className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={handleRegenerate}
          className="btn-secondary flex items-center justify-center p-2"
          disabled={regenerateQR.isPending}
          title="Regenerate QR Code"
        >
          <RefreshCw
            className={`w-4 h-4 ${regenerateQR.isPending ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
