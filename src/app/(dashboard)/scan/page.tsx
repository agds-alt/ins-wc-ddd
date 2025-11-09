/**
 * Scan QR Code Page
 * Camera scanner for location QR codes
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';

export default function ScanPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [_isScanning, _setIsScanning] = useState(false);

  const scanMutation = trpc.qrcode.scan.useQuery(
    qrCode,
    { enabled: false }
  );

  const handleManualInput = async () => {
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    try {
      const result = await scanMutation.refetch();

      if (result.data) {
        toast.success(`Found: ${result.data.location_name}`);
        router.push(`/inspection/create?qr=${qrCode}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid QR code');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan QR Code</h1>
        <p className="text-muted-foreground mt-1">
          Scan location QR code to start inspection
        </p>
      </div>

      {/* Camera placeholder */}
      <div className="container-elevated">
        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-24 h-24 mx-auto text-muted-foreground mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            <p className="text-muted-foreground">
              Camera scanner will be available here
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use manual input below for now
            </p>
          </div>
        </div>
      </div>

      {/* Manual input */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4">Manual Input</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              QR Code
            </label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter QR code (e.g., LOC-xxxxxxxxxxxx)"
              className="input-field"
            />
          </div>

          <button
            onClick={handleManualInput}
            disabled={scanMutation.isFetching}
            className="btn-primary w-full"
          >
            {scanMutation.isFetching ? 'Scanning...' : 'Scan QR Code'}
          </button>
        </div>
      </div>

      {/* Recent scans */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <p className="text-sm text-muted-foreground">
          Recent locations will appear here
        </p>
      </div>
    </div>
  );
}
