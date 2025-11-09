// src/components/mobile/ScanModal.tsx - REWRITTEN with jsQR
import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { X, CameraOff, Camera, Zap, ZapOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (locationId: string) => void;
}

export const ScanModal = ({ isOpen, onClose, onScan }: ScanModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

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

  // Scan QR code from video frame
  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      console.log('📷 QR Scanned:', code.data);

      const locationId = parseQRData(code.data);

      if (locationId) {
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }

        toast.success('Kode QR Valid!');
        onScan(locationId);
        stopCamera();
        return; // Stop scanning
      } else {
        // Invalid QR
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        toast.error('Format kode QR tidak valid');
      }
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  }, [onScan]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      setCameraError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      // Check for torch/flashlight capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        setHasTorch(true);
      }

      // Set video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // iOS fix
        await videoRef.current.play();

        setCameraReady(true);
        setIsScanning(false);

        // Start scanning
        scanQRCode();
      }

    } catch (error: any) {
      console.error('Camera error:', error);

      if (error.name === 'NotAllowedError') {
        setCameraError('❌ Izin kamera ditolak. Harap aktifkan kamera di pengaturan browser.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('❌ Tidak ditemukan kamera di perangkat ini.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('❌ Kamera sedang digunakan aplikasi lain. Harap tutup aplikasi lain dan coba lagi.');
      } else if (error.name === 'OverconstrainedError') {
        // Retry with simpler constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            setCameraReady(true);
            setIsScanning(false);
            scanQRCode();
          }
        } catch {
          setCameraError('❌ Gagal menginisialisasi kamera. Harap coba lagi.');
        }
      } else {
        setCameraError('❌ Gagal menginisialisasi kamera. Harap coba lagi.');
      }

      setIsScanning(false);
    }
  }, [scanQRCode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop video tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setIsScanning(false);
    setTorchEnabled(false);
  }, []);

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const newTorchState = !torchEnabled;

      await track.applyConstraints({
        // @ts-ignore - torch is not in standard types yet
        advanced: [{ torch: newTorchState }],
      });

      setTorchEnabled(newTorchState);
      toast.success(newTorchState ? 'Senter Hidup' : 'Senter Mati');
    } catch (error) {
      console.error('Torch error:', error);
      toast.error('Senter tidak tersedia');
    }
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Hidden Canvas for QR processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Scan Frame Overlay */}
      {cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Scanning Box */}
          <div className="relative w-64 h-64">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl"></div>

            {/* Scanning Line Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-scan"></div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar - Close Button */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-transform"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>

        {/* Torch/Flashlight Toggle */}
        {hasTorch && cameraReady && (
          <button
            onClick={toggleTorch}
            className={`backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-all ${
              torchEnabled ? 'bg-yellow-400' : 'bg-white/90'
            }`}
          >
            {torchEnabled ? (
              <Zap className="w-6 h-6 text-gray-700" />
            ) : (
              <ZapOff className="w-6 h-6 text-gray-700" />
            )}
          </button>
        )}
      </div>

      {/* Bottom Instructions */}
      {cameraReady && (
        <div className="absolute bottom-8 left-0 right-0 text-center px-6 z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto">
            <Camera className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white text-lg font-medium mb-1">
              Pindai Kode QR
            </p>
            <p className="text-gray-300 text-sm">
              Arahkan kamera ke kode QR lokasi
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">
              Menginisialisasi kamera...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Harap izinkan akses kamera
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {cameraError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center p-6 z-20">
          <div className="text-center max-w-md">
            <CameraOff className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Kesalahan Kamera
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {cameraError}
            </p>

            {/* Troubleshooting Tips */}
            <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-white font-medium mb-2">💡 Pemecahan Masalah:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Periksa izin kamera browser</li>
                <li>• Tutup aplikasi lain yang menggunakan kamera</li>
                <li>• Coba muat ulang halaman</li>
                <li>• Pastikan Anda menggunakan HTTPS</li>
              </ul>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Tutup & Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* CSS for scan animation */}
      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(400%);
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
