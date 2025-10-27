// src/components/forms/EnhancedPhotoUpload.tsx
import { useState, useRef } from 'react';
import { Camera, X, MapPin, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoWithMetadata {
  file: File;
  preview: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

interface EnhancedPhotoUploadProps {
  componentId: string;
  photos: PhotoWithMetadata[];
  onPhotosChange: (photos: PhotoWithMetadata[]) => void;
  maxPhotos?: number;
  genZMode?: boolean;
}

export const EnhancedPhotoUpload = ({
  // componentId tidak dipakai, tapi tetap ada di props untuk compatibility
  photos,
  onPhotosChange,
  maxPhotos = 3,
  genZMode = false,
}: EnhancedPhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Get current location
      const location = await getCurrentLocation();

      // ✅ NON-BLOCKING reverse geocoding (don't await, just start it)
      let address: string | undefined = undefined;
      if (location) {
        // Fire and forget - we'll use GPS coords if address fails
        getAddressFromCoords(location.lat, location.lng)
          .then(addr => { address = addr; })
          .catch(() => { /* Silent fail - GPS coords still available */ });
      }

      // Create preview with overlay immediately (don't wait for address)
      const preview = await createPhotoWithOverlay(file, {
        timestamp: new Date().toISOString(),
        location: location ? { ...location, address } : undefined,
      });

      const photoMetadata: PhotoWithMetadata = {
        file,
        preview,
        timestamp: new Date().toISOString(),
        location: location ? { ...location, address } : undefined,
      };

      onPhotosChange([...photos, photoMetadata]);
    } catch (error) {
      console.error('Error processing photo:', error);
      // Still add photo without metadata if processing fails
      const preview = URL.createObjectURL(file);
      onPhotosChange([
        ...photos,
        {
          file,
          preview,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
                className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
              />
              
              {/* Metadata badges */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                {photo.location && (
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
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Capture Button */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`
            w-full h-24 border-2 border-dashed rounded-xl 
            flex flex-col items-center justify-center
            transition-all
            ${isProcessing
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
              : genZMode
                ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
              <span className="text-sm text-gray-500">Processing...</span>
            </>
          ) : (
            <>
              <Camera className={`w-8 h-8 mb-2 ${genZMode ? 'text-purple-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${genZMode ? 'text-purple-600' : 'text-gray-600'}`}>
                {genZMode ? '📸 Foto yuk!' : 'Take Photo'}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                {photos.length}/{maxPhotos} photos
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {/* Processing Modal - Prominent Loading Indicator */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            {/* Animated Spinner */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto relative">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                {/* Spinning ring */}
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Processing Photo
            </h3>
            <p className="text-gray-600 mb-1">
              Adding watermark with GPS location...
            </p>
            <p className="text-sm text-gray-500">
              Please wait 3-4 seconds
            </p>

            {/* Progress Steps */}
            <div className="mt-6 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Getting GPS coordinates...</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span>Applying watermark...</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span>Finalizing image...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    } else {
      resolve(null);
    }
  });
};

const getAddressFromCoords = async (lat: number, lng: number): Promise<string | undefined> => {
  try {
    // ✅ Add timeout protection - fail fast after 3 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: { 'User-Agent': 'ToiletCheck/1.0' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('⚠️ Geocoding failed:', response.status);
      return undefined;
    }

    const data = await response.json();
    return data.display_name;
  } catch (error: any) {
    // ✅ Silent fail - GPS coordinates are enough
    if (error.name === 'AbortError') {
      console.warn('⚠️ Geocoding timeout - using GPS coords only');
    } else {
      console.warn('⚠️ Geocoding error - using GPS coords only');
    }
    return undefined;
  }
};

const createPhotoWithOverlay = async (
  file: File,
  metadata: { timestamp: string; location?: { lat: number; lng: number; address?: string } }
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(URL.createObjectURL(file));
        return;
      }

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Add overlay
      const overlayHeight = 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

      // Add text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      
      const timestamp = format(new Date(metadata.timestamp), 'dd/MM/yyyy HH:mm:ss');
      ctx.fillText(timestamp, 10, canvas.height - 35);

      if (metadata.location) {
        ctx.font = '14px Arial';
        ctx.fillText(`📍 ${metadata.location.lat.toFixed(5)}, ${metadata.location.lng.toFixed(5)}`, 10, canvas.height - 10);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    reader.readAsDataURL(file);
  });
};

export type { PhotoWithMetadata };