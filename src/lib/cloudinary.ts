// lib/cloudinary.ts
// src/lib/cloudinary.ts
import imageCompression from 'browser-image-compression';
export const uploadToCloudinary = async (file: File): Promise<string> => {
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

/**
 * Upload to Cloudinary with auto-format and quality optimization
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Compress first
  const compressedFile = await compressImage(file);
  
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', 'toilet-checks');
  formData.append('cloud_name', 'dcg56qkae');
  formData.append('folder', 'toilet-inspections');
  
  // Cloudinary transformations for additional optimization
  formData.append('quality', 'auto:good');
  formData.append('fetch_format', 'auto');

  try {
    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
      
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/dcg56qkae/image/upload');
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload photo');
  }
};

/**
 * Batch upload with concurrency limit
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