// lib/cloudinary.ts
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