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

// Compress image before upload
export const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
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

        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas toBlob failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
    }
    reader.onerror = reject
  })
}

// Add timestamp overlay to image
export const addTimestampToImage = async (file: File | Blob): Promise<Blob> => {
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
        
        const ctx = canvas.getContext('2d')!
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Add semi-transparent background for timestamp
        const timestamp = formatDateTime(new Date())
        const padding = 20
        const fontSize = Math.max(16, img.width * 0.02)
        
        ctx.font = `bold ${fontSize}px Arial`
        const textMetrics = ctx.measureText(timestamp)
        const textHeight = fontSize * 1.2
        
        // Background rectangle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(
          padding,
          img.height - textHeight - padding * 2,
          textMetrics.width + padding * 2,
          textHeight + padding
        )
        
        // Timestamp text
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(
          timestamp,
          padding * 1.5,
          img.height - padding * 1.5
        )
        
        // Add location watermark if needed
        const watermark = 'WC-CHECK'
        ctx.font = `bold ${fontSize * 0.8}px Arial`
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fillText(
          watermark,
          img.width - ctx.measureText(watermark).width - padding,
          padding + fontSize
        )
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to add timestamp'))
            }
          },
          'image/jpeg',
          0.9
        )
      }
    }
    reader.onerror = reject
  })
}

// Upload to Cloudinary
export const uploadToCloudinary = async (file: File | Blob, folder = 'toilet-inspections'): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  formData.append('folder', folder)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
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

// Process and upload image with timestamp
export const processAndUploadImage = async (file: File): Promise<string> => {
  // Compress image
  const compressedImage = await compressImage(file)
  
  // Add timestamp overlay
  const imageWithTimestamp = await addTimestampToImage(compressedImage)
  
  // Upload to Cloudinary
  const url = await uploadToCloudinary(imageWithTimestamp)
  
  return url
}

// Generate QR code URL
export const generateQRUrl = (locationId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wc-check.com'
  return `${baseUrl}/locations/${locationId}`
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