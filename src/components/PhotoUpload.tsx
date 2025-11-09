/**
 * PhotoUpload Component
 * Simple photo upload with preview and compression
 */

'use client';

import { Camera, X } from 'lucide-react';
import { memo, useRef } from 'react';
import type { PhotoWithMetadata, InspectionComponent } from '@/types/inspection.types';
import Image from 'next/image';

interface PhotoUploadProps {
  photos: PhotoWithMetadata[];
  onPhotosChange: (photos: PhotoWithMetadata[]) => void;
  maxPhotos?: number;
  componentId?: InspectionComponent;
  genZMode?: boolean;
  locationName?: string;
}

const PhotoUploadComponent = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  componentId,
  genZMode = false,
}: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // Get geolocation if available
    let geolocation: { latitude: number; longitude: number } | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          });
        });
        geolocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error) {
        console.warn('Geolocation not available:', error);
      }
    }

    const newPhotos: PhotoWithMetadata[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      componentId: componentId || ('general' as any),
      timestamp: new Date().toISOString(),
      geolocation,
    }));

    onPhotosChange([...photos, ...newPhotos]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(photos[index].preview);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full p-4 border-2 border-dashed rounded-xl
            transition-all duration-200
            ${genZMode
              ? 'border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-700'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="font-medium">
              {genZMode
                ? `📸 Tambah Foto (${photos.length}/${maxPhotos})`
                : `Add Photo (${photos.length}/${maxPhotos})`
              }
            </span>
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
            >
              <Image
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="
                  absolute top-2 right-2 p-1.5 rounded-full
                  bg-red-500 text-white shadow-lg
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  hover:bg-red-600 active:scale-95
                "
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Photo index */}
              <div className="
                absolute bottom-2 left-2 px-2 py-1 rounded-md
                bg-black/50 text-white text-xs font-medium
              ">
                {index + 1}
              </div>

              {/* GPS indicator */}
              {photo.geolocation && (
                <div className="
                  absolute bottom-2 right-2 px-2 py-1 rounded-md
                  bg-green-500 text-white text-xs font-medium
                " title={`GPS: ${photo.geolocation.latitude.toFixed(6)}, ${photo.geolocation.longitude.toFixed(6)}`}>
                  📍
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PhotoUpload = memo(PhotoUploadComponent);
