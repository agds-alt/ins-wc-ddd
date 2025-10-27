import { format, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

// Format date ke format Indonesia
export const formatDate = (date: string | Date) => {
  const dateObject = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObject)) return '-'
  return format(dateObject, 'dd MMMM yyyy', { locale: id })
}

export const formatTime = (time: string) => {
  try {
    return format(parseISO(`2000-01-01T${time}`), 'HH:mm')
  } catch {
    return time
  }
}



export const formatDateTime = (date: string | Date) => {
  const dateObject = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObject)) return '-'
  return format(dateObject, 'dd MMM yyyy, HH:mm', { locale: id })
}

// OPTIMIZED: Compress image with dynamic quality and better algorithm
export const compressImage = async (file: File, maxWidth = 1920, quality?: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate optimal dimensions (maintain aspect ratio)
        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d', {
          alpha: false, // Disable alpha for better JPEG compression
          desynchronized: true, // Better performance
        })!

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Fill white background (improves JPEG quality)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)

        // Draw image
        ctx.drawImage(img, 0, 0, width, height)

        // Dynamic quality based on file size
        let compressionQuality = quality
        if (!compressionQuality) {
          const fileSizeMB = file.size / (1024 * 1024)
          if (fileSizeMB > 4) {
            compressionQuality = 0.7 // Heavy compression for large files
          } else if (fileSizeMB > 2) {
            compressionQuality = 0.75
          } else if (fileSizeMB > 1) {
            compressionQuality = 0.8
          } else {
            compressionQuality = 0.85 // Better quality for smaller files
          }
        }

        // Try WebP first (better compression), fallback to JPEG
        const tryWebP = () => {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                resolve(blob)
              } else {
                // WebP didn't improve size, use JPEG
                useJPEG()
              }
            },
            'image/webp',
            compressionQuality
          )
        }

        const useJPEG = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Canvas toBlob failed'))
              }
            },
            'image/jpeg',
            compressionQuality
          )
        }

        // Check if browser supports WebP
        const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
        if (supportsWebP) {
          tryWebP()
        } else {
          useJPEG()
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = reject
  })
}

// OPTIMIZED: Add timestamp and GPS watermark to image
export const addTimestampToImage = async (
  file: File | Blob,
  gpsLocation?: { latitude: number; longitude: number; address?: string }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
        })!

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Draw original image
        ctx.drawImage(img, 0, 0)

        // Calculate responsive sizes
        const timestamp = formatDateTime(new Date())
        const padding = Math.max(12, img.width * 0.015)
        const fontSize = Math.max(14, Math.min(24, img.width * 0.018))
        const smallFontSize = fontSize * 0.75

        // Prepare texts
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
        const timestampMetrics = ctx.measureText(timestamp)

        let gpsText = ''
        let gpsMetrics = null
        if (gpsLocation) {
          gpsText = gpsLocation.address
            ? `📍 ${gpsLocation.address.substring(0, 40)}...`
            : `📍 ${gpsLocation.latitude.toFixed(6)}, ${gpsLocation.longitude.toFixed(6)}`
          ctx.font = `500 ${smallFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
          gpsMetrics = ctx.measureText(gpsText)
        }

        // Calculate dimensions
        const maxWidth = Math.max(
          timestampMetrics.width,
          gpsMetrics?.width || 0
        )
        const textHeight = fontSize * 1.3
        const totalHeight = gpsLocation
          ? textHeight * 2 + padding * 3
          : textHeight + padding * 2

        // Draw modern watermark box (bottom-left)
        const gradient = ctx.createLinearGradient(
          0, img.height - totalHeight,
          0, img.height
        )
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')

        ctx.fillStyle = gradient
        ctx.fillRect(
          0,
          img.height - totalHeight,
          maxWidth + padding * 3,
          totalHeight
        )

        // Add subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.strokeRect(
          0.5,
          img.height - totalHeight + 0.5,
          maxWidth + padding * 3,
          totalHeight
        )

        // Draw timestamp with shadow
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(
          timestamp,
          padding * 1.5,
          img.height - totalHeight + padding + textHeight * 0.7
        )

        // Draw GPS location
        if (gpsLocation && gpsMetrics) {
          ctx.font = `500 ${smallFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillText(
            gpsText,
            padding * 1.5,
            img.height - totalHeight + padding * 2 + textHeight * 1.5
          )
        }

        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0

        // Top-right app watermark (subtle)
        const appWatermark = 'WC-CHECK'
        ctx.font = `700 ${fontSize * 0.9}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
        const watermarkMetrics = ctx.measureText(appWatermark)

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(
          img.width - watermarkMetrics.width - padding * 2.5,
          padding,
          watermarkMetrics.width + padding * 2,
          fontSize * 1.4
        )

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.fillText(
          appWatermark,
          img.width - watermarkMetrics.width - padding * 1.5,
          padding + fontSize
        )

        // Determine output format
        const outputFormat = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        const outputQuality = outputFormat === 'image/webp' ? 0.88 : 0.92

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to add watermark'))
            }
          },
          outputFormat,
          outputQuality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = reject
  })
}

// Upload to Cloudinary
export const uploadToCloudinary = async (file: File | Blob, folder = 'toilet-inspections'): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.VITE_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  formData.append('folder', folder)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.VITE_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  )
  
  if (!response.ok) {
    throw new Error('Upload failed')
  }
  
  const data = await response.json()
  return data.secure_url
}

// OPTIMIZED: Process and upload image with compression and watermark
export const processAndUploadImage = async (
  file: File,
  gpsLocation?: { latitude: number; longitude: number; address?: string }
): Promise<string> => {
  console.log('🖼️ Processing image:', {
    originalSize: (file.size / 1024).toFixed(2) + 'KB',
    hasGPS: !!gpsLocation,
  })

  // Step 1: Compress image with optimized algorithm
  const compressedImage = await compressImage(file)
  console.log('✅ Compressed:', (compressedImage.size / 1024).toFixed(2) + 'KB')

  // Step 2: Add timestamp and GPS watermark
  const imageWithWatermark = await addTimestampToImage(compressedImage, gpsLocation)
  console.log('✅ Watermarked:', (imageWithWatermark.size / 1024).toFixed(2) + 'KB')

  // Step 3: Upload to Cloudinary
  const url = await uploadToCloudinary(imageWithWatermark)
  console.log('✅ Uploaded to:', url)

  return url
}

// Generate QR code URL
export const generateQRUrl = (locationId: string) => {
  const productionUrl = 'https://wc-checks.vercel.app';
  const baseUrl = import.meta.env.DEV 
    ? (import.meta.env.VITE_APP_URL || 'http://localhost:5173')
    : productionUrl;
  return `${baseUrl}/locations/${locationId}`;
}
// Calculate inspection score (0-100)
export const calculateInspectionScore = (responses: Record<string, any>): number => {
  const items = Object.values(responses)
  const totalItems = items.length
  
  if (totalItems === 0) return 0
  
  // Count good responses
  const goodCount = items.filter(item => {
    if (typeof item === 'string') {
      return item.toLowerCase() === 'baik' || item.toLowerCase() === 'bersih' || item.toLowerCase() === 'ada'
    }
    if (typeof item === 'boolean') {
      return item === true
    }
    if (typeof item === 'object' && item.status) {
      return item.status === 'good'
    }
    return false
  }).length
  
  return Math.round((goodCount / totalItems) * 100)
}

// Get status color based on score
export const getStatusColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-100'
  if (score >= 60) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
}

export const getStatusEmoji = (score: number): string => {
  if (score >= 80) return '😊'
  if (score >= 60) return '😐'
  return '😟'
}

// Validate file size and type
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file terlalu besar. Maksimal 5MB.' }
  }
  
  return { valid: true }
}

// Format role display
export const formatRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    'super_admin': 'Super Admin',
    'admin': 'Admin',
    'supervisor': 'Supervisor',
    'cleaner': 'Cleaner',
    'user': 'User'
  }
  return roleMap[role] || role
}

// Truncate text
export const truncateText = (text: string, maxLength = 50): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Check if mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Vibrate device (for haptic feedback)
export const vibrate = (duration = 50): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}