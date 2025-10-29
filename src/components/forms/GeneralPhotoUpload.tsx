// src/components/forms/GeneralPhotoUpload.tsx - FIXED: Separate Camera & Gallery buttons
import { useState, useRef } from 'react';
import { Camera, X, MapPin, Clock, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { PhotoWithMetadata } from '../../types/inspection.types';

interface GeneralPhotoUploadProps {
  photos: PhotoWithMetadata[];
  onPhotosChange: (photos: PhotoWithMetadata[]) => void;
  maxPhotos?: number;
  genZMode?: boolean;
  locationName: string;
}

export const GeneralPhotoUpload = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  genZMode = false,
  locationName,
}: GeneralPhotoUploadProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // ✅ Handle CAMERA capture (with permissions)
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPermissionError(null);

    try {
      // ✅ Get location (optional, don't block if fails)
      const location = await getCurrentLocation();

      // Get address (non-blocking)
      let address: string | undefined = undefined;
      if (location) {
        getAddressFromCoords(location.lat, location.lng)
          .then(addr => { address = addr; })
          .catch(() => { /* Silent fail */ });
      }

      // Create watermarked photo
      const watermarkedBlob = await addWatermarkToPhoto(file, {
        timestamp: new Date().toISOString(),
        location: location ? { ...location, address } : undefined,
        locationName,
      });

      const preview = URL.createObjectURL(watermarkedBlob);
      const watermarkedFile = new File([watermarkedBlob], file.name, { type: 'image/jpeg' });

      const photoMetadata: PhotoWithMetadata = {
        file: watermarkedFile,
        preview,
        timestamp: new Date().toISOString(),
        geolocation: location,
      };

      onPhotosChange([...photos, photoMetadata]);

      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

    } catch (error: any) {
      console.error('Error processing camera photo:', error);

      // Fallback: add without watermark
      const preview = URL.createObjectURL(file);
      onPhotosChange([...photos, {
        file,
        preview,
        timestamp: new Date().toISOString(),
      }]);

      setPermissionError(
        genZMode
          ? 'Foto ditambah tanpa watermark'
          : 'Photo added without watermark'
      );
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  // ✅ Handle GALLERY selection (NO permissions needed!)
  const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPermissionError(null);

    try {
      // ✅ Gallery photos: Skip GPS (old photos, GPS not accurate anyway)
      // This makes gallery upload MUCH faster (no GPS wait)

      // ✅ Add watermark with timestamp only (no location for gallery)
      const watermarkedBlob = await addWatermarkToPhoto(file, {
        timestamp: new Date().toISOString(),
        location: undefined, // No GPS for gallery photos
        locationName,
      });

      const preview = URL.createObjectURL(watermarkedBlob);
      const watermarkedFile = new File([watermarkedBlob], file.name, { type: 'image/jpeg' });

      const photoMetadata: PhotoWithMetadata = {
        file: watermarkedFile,
        preview,
        timestamp: new Date().toISOString(),
        geolocation: undefined, // No GPS for gallery photos
      };

      onPhotosChange([...photos, photoMetadata]);

    } catch (error: any) {
      console.error('Error processing gallery photo:', error);

      // Fallback: add without watermark
      const preview = URL.createObjectURL(file);
      onPhotosChange([...photos, {
        file,
        preview,
        timestamp: new Date().toISOString(),
      }]);

      setPermissionError(
        genZMode
          ? 'Foto ditambah tanpa watermark'
          : 'Photo added without watermark'
      );
    } finally {
      setIsProcessing(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className="w-full aspect-[4/3] object-cover rounded-xl border-2 border-gray-200"
              />

              {/* Metadata badges */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                {photo.geolocation && (
                  <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>GPS</span>
                  </div>
                )}
                <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(photo.timestamp), 'HH:mm')}</span>
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Permission Error */}
      {permissionError && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">{permissionError}</p>
        </div>
      )}

      {/* ✅ TWO SEPARATE BUTTONS */}
      {canAddMore && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className={`
              py-5 border-2 border-dashed rounded-xl
              flex flex-col items-center justify-center space-y-2
              transition-all
              ${isProcessing
                ? 'bg-gray-50 border-gray-300 cursor-wait'
                : genZMode
                  ? 'border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 text-purple-700'
                  : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 text-blue-700'
              }
            `}
          >
            <Camera className="w-7 h-7" />
            <div className="text-center">
              <p className="text-sm font-semibold">
                {genZMode ? '📸 Kamera' : '📸 Camera'}
              </p>
              <p className="text-xs opacity-75">
                {genZMode ? 'Ambil foto' : 'Take photo'}
              </p>
            </div>
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessing}
            className={`
              py-5 border-2 border-dashed rounded-xl
              flex flex-col items-center justify-center space-y-2
              transition-all
              ${isProcessing
                ? 'bg-gray-50 border-gray-300 cursor-wait'
                : genZMode
                  ? 'border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 text-purple-700'
                  : 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700'
              }
            `}
          >
            <ImageIcon className="w-7 h-7" />
            <div className="text-center">
              <p className="text-sm font-semibold">
                {genZMode ? '🖼️ Galeri' : '🖼️ Gallery'}
              </p>
              <p className="text-xs opacity-75">
                {genZMode ? 'Pilih file' : 'Choose file'}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Camera Input (with capture) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Gallery Input (NO capture) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />

      {/* Info Text */}
      {canAddMore && (
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-600 font-medium">
            {photos.length}/{maxPhotos} photos
          </p>
          <p className="text-xs text-gray-500">
            {genZMode
              ? '✨ Watermark otomatis: Tanggal, Jam & Lokasi'
              : '✨ Auto watermark: Date, Time & Location'
            }
          </p>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {genZMode ? 'Memproses Foto' : 'Processing Photo'}
            </h3>
            <p className="text-gray-600 mb-1">
              {genZMode ? 'Menambahkan watermark...' : 'Adding watermark...'}
            </p>
            <p className="text-sm text-gray-500">
              {genZMode ? 'Tunggu sebentar' : 'Please wait'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Location permission denied or unavailable:', error.message);
        resolve(null); // ✅ Don't block, just resolve null
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

const getAddressFromCoords = async (lat: number, lng: number): Promise<string | undefined> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
      {
        headers: { 'User-Agent': 'ToiletCheck/1.0' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) return undefined;

    const data = await response.json();
    const addr = data.address;
    return [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.county]
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.log('Address fetch failed:', error.message);
    }
    return undefined;
  }
};

const addWatermarkToPhoto = async (
  file: File,
  metadata: {
    timestamp: string;
    location?: { lat: number; lng: number; address?: string };
    locationName: string;
  }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Watermark config
        const fontSize = Math.max(20, img.width * 0.03);
        const padding = Math.max(20, img.width * 0.025);

        const date = format(new Date(metadata.timestamp), 'dd/MM/yyyy');
        const time = format(new Date(metadata.timestamp), 'HH:mm:ss');

        const lines = [
          `📍 ${metadata.locationName}`,
          `📅 ${date} ⏰ ${time}`,
        ];

        if (metadata.location?.address) {
          lines.push(`🗺️ ${metadata.location.address}`);
        } else if (metadata.location) {
          lines.push(`🧭 ${metadata.location.lat.toFixed(6)}, ${metadata.location.lng.toFixed(6)}`);
        }

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const lineHeight = fontSize * 1.4;
        const boxHeight = lines.length * lineHeight + padding * 2;

        // Draw watermark box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(padding, img.height - boxHeight - padding, maxWidth + padding * 3, boxHeight);

        // Draw text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        lines.forEach((line, i) => {
          ctx.fillText(line, padding * 2, img.height - boxHeight - padding + lineHeight * (i + 1));
        });

        // Draw branding
        ctx.font = `bold ${fontSize * 0.9}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const brandText = 'TOILET CHECK ✓';
        const brandWidth = ctx.measureText(brandText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(img.width - brandWidth - padding * 3, padding, brandWidth + padding * 2, lineHeight * 1.8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillText(brandText, img.width - brandWidth - padding * 2, padding + lineHeight * 1.2);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create watermarked photo'));
            }
          },
          'image/jpeg',
          0.92
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
