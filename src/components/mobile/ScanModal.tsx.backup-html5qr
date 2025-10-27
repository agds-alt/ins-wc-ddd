// src/components/mobile/ScanModal.tsx
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CameraOff, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (locationId: string) => void;
}

export const ScanModal = ({ isOpen, onClose, onScan }: ScanModalProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Parse QR data
  const parseQRData = (qrData: string): string | null => {
    try {
      // URL format: /locations/uuid
      if (qrData.includes('/locations/')) {
        const match = qrData.match(/locations\/([0-9a-f-]{36})/i);
        return match ? match[1] : null;
      }
      
      // Direct UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrData)) {
        return qrData;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    let permissionGranted = false;

    const checkCameraPermission = async () => {
      try {
        // ✅ SIMPLIFIED: Request basic camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true // Simple request
        });

        // Permission granted - stop test stream
        stream.getTracks().forEach(track => track.stop());
        permissionGranted = true;

        if (!mounted) return;

        // Step 2: Initialize scanner after permission granted
        await initializeScanner();
        
      } catch (error: any) {
        console.error('Camera permission error:', error);
        
        if (!mounted) return;
        
        if (error.name === 'NotAllowedError') {
          setCameraError('❌ Camera permission denied. Please enable camera in browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('❌ No camera found on this device.');
        } else if (error.name === 'NotReadableError') {
          setCameraError('❌ Camera is being used by another app. Please close other apps and try again.');
        } else {
          setCameraError('❌ Camera initialization failed. Please try again.');
        }
        
        setIsScanning(false);
      }
    };

    const initializeScanner = async () => {
      try {
        setIsScanning(true);
        setCameraReady(false);

        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!mounted) return;

        const container = document.getElementById('qr-scanner-container');
        if (!container) {
          throw new Error('Scanner container not found');
        }

        // ✅ SIMPLIFIED CONFIG - More compatible
        scannerRef.current = new Html5QrcodeScanner(
          'qr-scanner-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            supportedScanTypes: [0], // QR Code only
          },
          false // verbose
        );

        scannerRef.current.render(
          (decodedText) => {
            console.log('📷 QR Scanned:', decodedText);

            const locationId = parseQRData(decodedText);

            if (locationId) {
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(200);
              }

              toast.success('Valid QR Code!');
              onScan(locationId);
              stopScanner();
            } else {
              // Invalid QR
              if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
              toast.error('Invalid QR code format');
            }
          },
          () => {
            // Silent error - scanning continues
          }
        );

        if (mounted) {
          setCameraReady(true);
          setIsScanning(false);
        }

      } catch (error: any) {
        console.error('Scanner initialization error:', error);
        if (mounted) {
          setCameraError('Failed to initialize QR scanner. Please check camera permissions.');
          setIsScanning(false);
        }
      }
    };

    // Start permission check
    checkCameraPermission();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen, onScan]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
    setCameraReady(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Scanner Container */}
      <div 
        id="qr-scanner-container" 
        className="w-full h-full"
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

      {/* Scanner Guide */}
      {cameraReady && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Instructions */}
          <div className="absolute bottom-8 left-0 right-0 text-center px-6">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto">
              <Camera className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white text-lg font-medium mb-1">
                Scan QR Code
              </p>
              <p className="text-gray-300 text-sm">
                Point camera at location QR code
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">
              Initializing camera...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Please allow camera access
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {cameraError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <CameraOff className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Camera Error
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {cameraError}
            </p>
            
            {/* Troubleshooting Tips */}
            <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-white font-medium mb-2">💡 Troubleshooting:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Check browser camera permissions</li>
                <li>• Close other apps using camera</li>
                <li>• Try refreshing the page</li>
                <li>• Make sure you're on HTTPS</li>
              </ul>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Close & Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};