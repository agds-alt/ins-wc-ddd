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
  componentId,
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
      
      // Get reverse geocoding (address from coordinates)
      const address = location ? await getAddressFromCoords(location.lat, location.lng) : undefined;

      // Create preview with overlay
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
              ? 'bg-gray-50 border-gray-300 cursor-wait'
              : genZMode
                ? 'border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 text-purple-700'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 mb-1 animate-spin" />
              <span className="text-sm font-medium">Processing...</span>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-sm font-medium">
                {genZMode ? '📸 Ambil Foto (Optional)' : 'Take Photo (Optional)'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
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

      {/* Info Text */}
      {photos.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {genZMode 
            ? '✨ Foto otomatis include timestamp & lokasi GPS'
            : '✨ Photos automatically include timestamp & GPS location'
          }
        </p>
      )}
    </div>
  );
};

// Helper functions
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
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

const getAddressFromCoords = async (lat: number, lng: number): Promise<string | undefined> => {
  try {
    // Using Nominatim (free reverse geocoding)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ToiletCheck/1.0',
        },
      }
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    // Format address nicely
    const address = data.display_name;
    return address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return undefined;
  }
};

const createPhotoWithOverlay = async (
  file: File,
  metadata: {
    timestamp: string;
    location?: { lat: number; lng: number; address?: string };
  }
): Promise<string> => {
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
        
        // Calculate dimensions
        const padding = img.width * 0.03;
        const fontSize = Math.max(16, img.width * 0.025);
        
        // Format timestamp
        const timeStr = format(new Date(metadata.timestamp), 'dd/MM/yyyy HH:mm:ss');
        
        // Format location
        let locationStr = '';
        if (metadata.location) {
          if (metadata.location.address) {
            // Truncate address if too long
            const maxLength = 50;
            locationStr = metadata.location.address.length > maxLength
              ? metadata.location.address.substring(0, maxLength) + '...'
              : metadata.location.address;
          } else {
            locationStr = `${metadata.location.lat.toFixed(6)}, ${metadata.location.lng.toFixed(6)}`;
          }
        }
        
        // Calculate text metrics
        ctx.font = `bold ${fontSize}px Arial`;
        const timeWidth = ctx.measureText(timeStr).width;
        const locationWidth = metadata.location ? ctx.measureText(`📍 ${locationStr}`).width : 0;
        const maxWidth = Math.max(timeWidth, locationWidth);
        
        // Draw semi-transparent background
        const bgHeight = metadata.location ? fontSize * 4.5 : fontSize * 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(
          padding,
          img.height - bgHeight - padding,
          maxWidth + padding * 2,
          bgHeight
        );
        
        // Draw timestamp
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(
          timeStr,
          padding * 1.5,
          img.height - (metadata.location ? fontSize * 2.8 : fontSize * 1.8) - padding
        );
        
        // Draw location if available
        if (metadata.location && locationStr) {
          ctx.font = `${fontSize * 0.8}px Arial`;
          ctx.fillText(
            `📍 ${locationStr}`,
            padding * 1.5,
            img.height - fontSize * 1.2 - padding
          );
        }
        
        // Add watermark
        ctx.font = `bold ${fontSize * 0.7}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const watermark = 'TOILET-CHECK';
        const watermarkWidth = ctx.measureText(watermark).width;
        ctx.fillText(
          watermark,
          img.width - watermarkWidth - padding * 1.5,
          padding * 2 + fontSize * 0.7
        );
        
        // Convert to blob URL
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Failed to create photo overlay'));
            }
          },
          'image/jpeg',
          0.9
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export type { PhotoWithMetadata };