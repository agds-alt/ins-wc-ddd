// src/lib/cloudinary.ts
import imageCompression from 'browser-image-compression';

// Environment variables for Cloudinary
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'toilet-inspections';

// Validate environment variables
const validateCloudinaryConfig = (): void => {
  const missingVars: string[] = [];

  if (!CLOUDINARY_CLOUD_NAME) missingVars.push('VITE_CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_UPLOAD_PRESET) missingVars.push('VITE_CLOUDINARY_UPLOAD_PRESET');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Cloudinary environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all variables are set.'
    );
  }
};

// Validate on module load
validateCloudinaryConfig();

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
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
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
 * Uses Promise.allSettled to continue uploading even if some files fail
 */
export const batchUploadToCloudinary = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const CONCURRENT_UPLOADS = 3; // Upload 3 at a time
  const results: string[] = [];
  const failedFiles: Array<{ fileName: string; error: string }> = [];
  let completed = 0;

  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);

    // Use Promise.allSettled instead of Promise.all
    // This allows remaining uploads to continue even if some fail
    const batchResults = await Promise.allSettled(
      batch.map((file, index) =>
        uploadToCloudinary(file).catch(error => {
          failedFiles.push({
            fileName: file.name,
            error: error.message || 'Unknown error'
          });
          throw error;
        })
      )
    );

    // Extract successful uploads
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to upload ${batch[index].name}:`, result.reason);
      }
    });

    completed += batch.length;

    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  // Log summary if there were failures
  if (failedFiles.length > 0) {
    console.warn(
      `⚠️ Upload completed with ${failedFiles.length} failure(s) out of ${files.length} file(s):`,
      failedFiles
    );
  } else {
    console.log(`✅ All ${files.length} file(s) uploaded successfully`);
  }

  return results;
};