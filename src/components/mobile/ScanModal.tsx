// src/components/mobile/ScanModal.tsx - FIXED: Unused error variable
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CameraOff } from 'lucide-react';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (locationId: string) => void;
}

export const ScanModal = ({ isOpen, onClose, onScan }: ScanModalProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Extract location ID from scanned URL or raw UUID
  const parseQRData = (qrData: string): string | null => {
    try {
      // Case 1: Full URL (e.g., "http://localhost:5173/locations/uuid")
      if (qrData.includes('/locations/')) {
        const urlParts = qrData.split('/locations/');
        const locationId = urlParts[1]?.split('?')[0]?.split('#')[0]; // Remove query params & hash
        
        if (locationId && isValidUUID(locationId)) {
          return locationId;
        }
      }
      
      // Case 2: Direct UUID (backward compatibility)
      if (isValidUUID(qrData)) {
        return qrData;
      }
      
      // Case 3: Try to find UUID anywhere in string
      const uuidMatch = qrData.match(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
      if (uuidMatch) {
        return uuidMatch[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  };

  // Validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    if (!isOpen) return;

    const initializeScanner = async () => {
      try {
        setIsScanning(true);
        setCameraError(null);

        scannerRef.current = new Html5QrcodeScanner(
          'qr-scanner-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            supportedScanTypes: [],
          },
          false
        );

        await scannerRef.current.render(
          (decodedText) => {
            console.log('📷 QR Code scanned:', decodedText);
            
            // Parse QR data to extract location ID
            const locationId = parseQRData(decodedText);
            
            if (locationId) {
              console.log('✅ Valid location ID:', locationId);
              
              // Success vibration
              if ('vibrate' in navigator) {
                navigator.vibrate(200);
              }
              
              onScan(locationId);
              stopScanner();
            } else {
              console.warn('⚠️ Invalid QR format:', decodedText);
              
              // Error vibration pattern
              if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
            }
          },
          (_error) => {
            // Silent - just scanning, error tidak dipakai
          }
        );

      } catch (error: any) {
        console.error('Scanner initialization error:', error);
        setCameraError(error.message || 'Failed to initialize camera');
        setIsScanning(false);
      }
    };

    initializeScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 safe-area-top">
      {/* Scanner Container */}
      <div 
        id="qr-scanner-container" 
        className="w-full h-full relative"
      />
      
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={handleClose}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-transform"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Scanner Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
        
        {/* Center Guide */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 border-2 border-white rounded-xl relative">
            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
            
            {/* Format Hint */}
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="text-xs text-white/80 bg-black/40 px-3 py-1 rounded-full">
                URL or UUID Format
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8">
          <div className="text-center">
            <p className="text-white text-lg font-medium mb-1">Scan QR Code</p>
            <p className="text-gray-300 text-sm">Point camera at location QR</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isScanning && !cameraError && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {cameraError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center p-6">
          <div className="text-center">
            <CameraOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
            <p className="text-gray-300 mb-4">{cameraError}</p>
            <button
              onClick={handleClose}
              className="bg-white text-gray-900 px-6 py-3 rounded-xl font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};