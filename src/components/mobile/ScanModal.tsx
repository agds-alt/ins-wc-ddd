// src/components/mobile/ScanModal.tsx - FIXED: Camera loading & dark screen
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CameraOff, Camera } from 'lucide-react';


interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (locationId: string) => void;
}

export const ScanModal = ({ isOpen, onClose, onScan }: ScanModalProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const parseQRData = (qrData: string): string | null => {
    try {
      if (qrData.includes('/locations/')) {
        const urlParts = qrData.split('/locations/');
        const locationId = urlParts[1]?.split('?')[0]?.split('#')[0];
        if (locationId && isValidUUID(locationId)) return locationId;
      }
      
      if (isValidUUID(qrData)) return qrData;
      
      const uuidMatch = qrData.match(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
      if (uuidMatch) return uuidMatch[0];
      
      return null;
    } catch (error) {
      console.error('Error parsing QR:', error);
      return null;
    }
  };

  const isValidUUID = (uuid: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  };

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const initializeScanner = async () => {
      try {
        setIsInitializing(true);
        setCameraError(null);
        setIsReady(false);

        // STEP 1: Request camera permission explicitly
        console.log('📷 Requesting camera permission...');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment' // Rear camera
            } 
          });
          
          // Stop immediately - just checking permission
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Camera permission granted');
        } catch (permError: any) {
          console.error('❌ Camera permission denied:', permError);
          throw new Error('Camera access denied. Please enable camera permission in your browser settings.');
        }

        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mounted) return;

        // STEP 2: Initialize scanner with proper config
        console.log('🔧 Initializing scanner...');
        
        scannerRef.current = new Html5QrcodeScanner(
          'qr-scanner-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            // Force rear camera
            videoConstraints: {
              facingMode: 'environment'
            }
          } as any,
          false // verbose
        );

        // STEP 3: Render scanner
        await scannerRef.current.render(
          (decodedText) => {
            console.log('📷 QR scanned:', decodedText);
            
            const locationId = parseQRData(decodedText);
            
            if (locationId) {
              console.log('✅ Valid location:', locationId);
              
              if ('vibrate' in navigator) {
                navigator.vibrate(200);
              }
              
              onScan(locationId);
              stopScanner();
            } else {
              console.warn('⚠️ Invalid QR format');
              if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
            }
          },
          (error) => {
            // Silent - normal scanning errors
          }
        );

        if (mounted) {
          console.log('✅ Scanner ready');
          setIsReady(true);
          setIsInitializing(false);
        }

      } catch (error: any) {
        console.error('❌ Scanner init failed:', error);
        if (mounted) {
          setCameraError(error.message || 'Failed to initialize camera');
          setIsInitializing(false);
        }
      }
    };

    initializeScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsReady(false);
    setIsInitializing(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Scanner Container - ALWAYS visible when ready */}
      <div 
        id="qr-scanner-container" 
        className="w-full h-full"
        style={{
          display: isReady ? 'block' : 'none'
        }}
      />
      
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={handleClose}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-transform"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Scanner Guide Overlay - Only when ready */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-center pt-6">
              <div className="text-white text-center">
                <p className="text-lg font-semibold">Scan QR Code</p>
                <p className="text-sm text-gray-300 mt-1">Align QR code within frame</p>
              </div>
            </div>
          </div>
          
          {/* Center frame */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 border-2 border-white/80 rounded-2xl relative">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Loading State */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
          <div className="text-center">
            <div className="relative">
              <Camera className="w-20 h-20 text-white/40 mx-auto mb-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-white/20 border-t-white"></div>
              </div>
            </div>
            <p className="text-white text-lg font-medium">Initializing camera...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera access</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {cameraError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center p-6 z-30">
          <div className="text-center max-w-sm">
            <CameraOff className="w-20 h-20 text-red-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-2">Camera Access Required</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">{cameraError}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCameraError(null);
                  window.location.reload();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors"
              >
                Grant Permission & Retry
              </button>
              
              <button
                onClick={handleClose}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 px-6 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>

            {/* Help text */}
            <div className="mt-6 p-4 bg-gray-900/50 rounded-xl text-left">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-300">💡 Tip:</span> Make sure camera permission is enabled in your browser settings. 
                On mobile, go to Settings → Safari/Chrome → Camera → Allow
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dev Test Buttons */}
      {import.meta.env.DEV && isReady && (
        <div className="absolute bottom-6 left-4 right-4 space-y-2 z-50">
          <button
            onClick={() => {
              const testId = crypto.randomUUID();
              console.log('🧪 Test UUID:', testId);
              onScan(testId);
            }}
            className="w-full bg-green-600/90 hover:bg-green-600 text-white py-3 rounded-xl font-medium shadow-lg transition-colors"
          >
            🧪 DEV: Test Random UUID
          </button>
        </div>
      )}
    </div>
  );
};