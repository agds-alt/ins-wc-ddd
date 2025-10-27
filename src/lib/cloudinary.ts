// src/lib/cloudinary.ts
import imageCompression from 'browser-image-compression';

/**
 * Compress image before upload
 */
export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5, // Max 500KB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    fileType: 'image/webp' // Convert to WebP
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`✅ Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    return file; // Fallback to original
  }
};


// src/lib/cloudinary.ts - FIXED WITH BATCH UPLOAD

/**
 * Upload single file to Cloudinary
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'toilet-checks');
  formData.append('cloud_name', 'dcg56qkae');
  formData.append('folder', 'toilet-inspections');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dcg56qkae/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
    
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload photo');
  }
};

/**
 * Batch upload with concurrency limit and progress tracking
 */
export const batchUploadToCloudinary = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const CONCURRENT_UPLOADS = 3; // Upload 3 at a time
  const results: string[] = [];
  let completed = 0;

  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);
    
    const batchResults = await Promise.all(
      batch.map(file => uploadToCloudinary(file))
    );
    
    results.push(...batchResults);
    completed += batch.length;
    
    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  return results;
};