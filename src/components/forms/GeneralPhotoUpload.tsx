// src/components/forms/GeneralPhotoUpload.tsx - Enhanced watermark & permissions
import { useState, useRef } from 'react';
import { Camera, X, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PhotoWithMetadata } from '../../types/inspection.types';

interface GeneralPhotoUploadProps {
  photos: PhotoWithMetadata[];
  onPhotosChange: (photos: PhotoWithMetadata[]) => void;
  maxPhotos?: number;
  genZMode?: boolean;
  locationName: string; // Location name from form
}

export const GeneralPhotoUpload = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  genZMode = false,
  locationName,
}: GeneralPhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      
      // Request location permission (will prompt if not granted)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      console.log('✅ Permissions granted');
      return true;
    } catch (error: any) {
      console.error('❌ Permission error:', error);
      setPermissionError(
        genZMode
          ? 'Butuh akses kamera & lokasi untuk watermark otomatis. Cek pengaturan browser kamu.'
          : 'Camera & location access required for auto-watermark. Check your browser settings.'
      );
      return false;
    }
  };

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPermissionError(null);

    try {
      // Request permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setIsProcessing(false);
        return;
      }

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

      // Create watermarked photo immediately (don't wait for address)
      const watermarkedBlob = await addWatermarkToPhoto(file, {
        timestamp: new Date().toISOString(),
        location: location ? { ...location, address } : undefined,
        locationName,
      });

      // Create preview URL
      const preview = URL.createObjectURL(watermarkedBlob);
      
      // Create new file from watermarked blob
      const watermarkedFile = new File(
        [watermarkedBlob], 
        file.name, 
        { type: 'image/jpeg' }
      );

      const photoMetadata: PhotoWithMetadata = {
        file: watermarkedFile,
        preview,
        timestamp: new Date().toISOString(),
        geolocation: location,
      };

      onPhotosChange([...photos, photoMetadata]);

      // Success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

    } catch (error: any) {
      console.error('Error processing photo:', error);
      
      // Fallback: add photo without watermark
      const preview = URL.createObjectURL(file);
      onPhotosChange([
        ...photos,
        {
          file,
          preview,
          timestamp: new Date().toISOString(),
        },
      ]);
      
      setPermissionError(
        genZMode
          ? 'Foto berhasil ditambah tapi tanpa watermark (permission ditolak)'
          : 'Photo added without watermark (permission denied)'
      );
    } finally {
      setIsProcessing(false);
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

      {/* Capture Button */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`
            w-full py-6 border-2 border-dashed rounded-xl 
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
          {isProcessing ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium">
                {genZMode ? 'Processing foto...' : 'Processing photo...'}
              </span>
            </>
          ) : (
            <>
              <Camera className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">
                  {genZMode ? '📸 Ambil Foto' : '📸 Take Photo'}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {photos.length}/{maxPhotos} photos • Auto watermark
                </p>
              </div>
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

      {/* Info Text */}
      {canAddMore && (
        <p className="text-xs text-gray-500 text-center">
          {genZMode 
            ? '✨ Watermark otomatis: Tanggal, Jam, Lokasi GPS & Nama Toilet'
            : '✨ Auto watermark: Date, Time, GPS Location & Toilet Name'
          }
        </p>
      )}
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
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
        console.warn('Geolocation error:', error);
        resolve(null);
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
    // ✅ Add timeout protection - fail fast after 3 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
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

    // Get short address (road + suburb)
    const address = data.address;
    const parts = [
      address.road,
      address.suburb || address.neighbourhood,
      address.city || address.county
    ].filter(Boolean);

    return parts.slice(0, 2).join(', ');
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
        
        const ctx = canvas.getContext('2d')!;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Calculate responsive dimensions
        const padding = Math.max(20, img.width * 0.025);
        const fontSize = Math.max(20, img.width * 0.03); // Larger font
        
        // Format data
        const date = format(new Date(metadata.timestamp), 'dd/MM/yyyy');
        const time = format(new Date(metadata.timestamp), 'HH:mm:ss');
        
        // Prepare text lines
        const lines: string[] = [
          `📍 ${metadata.locationName}`,
          `📅 ${date} ⏰ ${time}`,
        ];
        
        if (metadata.location?.address) {
          lines.push(`🗺️ ${metadata.location.address}`);
        } else if (metadata.location) {
          lines.push(`🧭 ${metadata.location.lat.toFixed(6)}, ${metadata.location.lng.toFixed(6)}`);
        }
        
        // Calculate dimensions
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const lineHeight = fontSize * 1.4;
        const bgHeight = (lines.length * lineHeight) + (padding * 2);
        
        // Draw semi-transparent background (bottom-left)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(
          padding,
          img.height - bgHeight - padding,
          maxWidth + (padding * 3),
          bgHeight
        );
        
        // Draw text lines
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        
        lines.forEach((line, index) => {
          ctx.fillText(
            line,
            padding * 2,
            img.height - bgHeight - padding + (lineHeight * (index + 1))
          );
        });
        
        // Add branding watermark (top-right)
        ctx.font = `bold ${fontSize * 0.9}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const brandText = 'TOILET CHECK ✓';
        const brandWidth = ctx.measureText(brandText).width;
        
        // Brand background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(
          img.width - brandWidth - (padding * 3),
          padding,
          brandWidth + (padding * 2),
          fontSize * 1.8
        );
        
        // Brand text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillText(
          brandText,
          img.width - brandWidth - (padding * 2),
          padding + (fontSize * 1.2)
        );
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create watermarked photo'));
            }
          },
          'image/jpeg',
          0.92 // High quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};