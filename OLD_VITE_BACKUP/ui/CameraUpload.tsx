// src/components/ui/CameraUpload.tsx
import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraUploadProps {
  onImageCapture: (file: File) => void;
  onRemove: () => void;
  imagePreview?: string;
}

export const CameraUpload = ({ onImageCapture, onRemove, imagePreview }: CameraUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageCapture(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {imagePreview ? (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-2xl border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerFileInput}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          <Camera className="w-8 h-8 mb-2" />
          <span className="text-sm font-medium">Take Photo</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};