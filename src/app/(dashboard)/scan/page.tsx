/**
 * Scan QR Code Page
 * Camera scanner for location QR codes with modern UI
 */

'use client';

import { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import { QrCode, Search } from 'lucide-react';

const ScannerModal = lazy(() => import('@/components/ScannerModal'));

export default function ScanPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Fetch all locations for quick access
  const { data: locations } = trpc.location.list.useQuery({ limit: 10 });

  const handleScanSuccess = (locationId: string) => {
    setScannerOpen(false);
    toast.success('QR Code detected!');
    // Navigate to inspection form
    router.push(`/inspection/${locationId}`);
  };

  const handleManualInput = async () => {
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code or location ID');
      return;
    }

    // Navigate directly to inspection
    router.push(`/inspection/${qrCode.trim()}`);
  };

  const handleLocationSelect = (locationId: string) => {
    router.push(`/inspection/${locationId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Scan QR Code</h1>
        <p className="text-muted-foreground mt-1">
          Scan location QR code or select from quick access
        </p>
      </div>

      {/* QR Scanner Button */}
      <button
        onClick={() => setScannerOpen(true)}
        className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-6 shadow-lg transition-all active:scale-95"
      >
        <div className="flex items-center justify-center gap-3">
          <QrCode className="w-8 h-8" />
          <div className="text-left">
            <div className="font-bold text-lg">Open Camera Scanner</div>
            <div className="text-sm text-blue-100">Scan QR code from location</div>
          </div>
        </div>
      </button>

      {/* Manual Input */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Manual Input
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Location ID or QR Code
            </label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter location ID..."
              className="input-field"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualInput();
                }
              }}
            />
          </div>

          <button
            onClick={handleManualInput}
            className="btn-primary w-full"
          >
            Go to Inspection
          </button>
        </div>
      </div>

      {/* Quick Access Locations */}
      {locations && locations.length > 0 && (
        <div className="container-elevated">
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>

          <div className="space-y-2">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location.id)}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors border border-gray-200"
              >
                <div className="font-medium text-gray-900">{location.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {location.building} • {location.floor} • {location.area}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {scannerOpen && (
        <Suspense fallback={<div>Loading scanner...</div>}>
          <ScannerModal
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onSuccess={handleScanSuccess}
          />
        </Suspense>
      )}
    </div>
  );
}
