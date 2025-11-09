/**
 * QR Code Scanner Modal
 * Fullscreen camera scanner with optimized performance
 * Uses jsQR for QR detection
 */

'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import jsQR from 'jsqr';
import { X, CameraOff, Camera, Zap, ZapOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (locationId: string) => void;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Parse QR data to extract location ID
function parseQRData(data: string): string | null {
  try {
    // Check if URL format: /locations/uuid or /inspection/uuid
    const urlMatch = data.match(/(?:locations|inspection)\/([0-9a-f-]{36})/i);
    if (urlMatch) return urlMatch[1];

    // Check if direct UUID
    if (UUID_REGEX.test(data)) return data;

    return null;
  } catch {
    return null;
  }
}

function ScannerModalContent({ isOpen, onClose, onSuccess }: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // QR Code scanning loop
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      const locationId = parseQRData(code.data);

      if (locationId) {
        // Haptic feedback
        if ('vibrate' in navigator) navigator.vibrate(200);
        toast.success('QR Code Valid!');
        onSuccess(locationId);
        return; // Stop scanning
      } else {
        // Invalid QR
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        toast.error('Format QR Code tidak valid');
      }
    }

    // Continue scanning
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [onSuccess]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      setHasTorch(!!capabilities.torch);

      // Setup video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        await videoRef.current.play();
        setCameraReady(true);
        setIsInitializing(false);
        scanFrame();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsInitializing(false);

      // User-friendly error messages
      if (err.name === 'NotAllowedError') {
        setError('Akses kamera ditolak. Silakan izinkan akses kamera.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan di perangkat ini.');
      } else if (err.name === 'NotReadableError') {
        setError('Kamera sedang digunakan aplikasi lain.');
      } else {
        setError('Gagal menginisialisasi kamera.');
      }
    }
  }, [scanFrame]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setIsInitializing(false);
    setTorchEnabled(false);
  }, []);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const newState = !torchEnabled;

      await track.applyConstraints({
        // @ts-ignore - torch not in types yet
        advanced: [{ torch: newState }],
      });

      setTorchEnabled(newState);
      toast.success(newState ? 'Senter Aktif' : 'Senter Mati');
    } catch (err) {
      console.error('Torch error:', err);
      toast.error('Senter tidak tersedia');
    }
  }, [torchEnabled]);

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Scan frame overlay */}
      {cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl" />

            {/* Scanning line */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-[scan_2s_linear_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-transform"
          type="button"
          aria-label="Close scanner"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>

        {hasTorch && cameraReady && (
          <button
            onClick={toggleTorch}
            className={`backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-all ${
              torchEnabled ? 'bg-yellow-400' : 'bg-white/90'
            }`}
            type="button"
            aria-label={torchEnabled ? 'Turn off flash' : 'Turn on flash'}
          >
            {torchEnabled ? (
              <Zap className="w-6 h-6 text-gray-700" />
            ) : (
              <ZapOff className="w-6 h-6 text-gray-700" />
            )}
          </button>
        )}
      </div>

      {/* Instructions */}
      {cameraReady && (
        <div className="absolute bottom-8 left-0 right-0 text-center px-6 z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto">
            <Camera className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white text-lg font-medium mb-1">Pindai Kode QR</p>
            <p className="text-gray-300 text-sm">Arahkan kamera ke kode QR lokasi</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Menginisialisasi kamera...</p>
            <p className="text-gray-400 text-sm mt-2">Harap izinkan akses kamera</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-black flex items-center justify-center p-6 z-20">
          <div className="text-center max-w-md">
            <CameraOff className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Kesalahan Kamera</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">{error}</p>

            <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-white font-medium mb-2">💡 Pemecahan Masalah:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Periksa izin kamera di browser</li>
                <li>• Tutup aplikasi lain yang menggunakan kamera</li>
                <li>• Muat ulang halaman</li>
                <li>• Pastikan menggunakan HTTPS</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              type="button"
            >
              Tutup & Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized export
const ScannerModal = memo(ScannerModalContent);
ScannerModal.displayName = 'ScannerModal';

export default ScannerModal;
