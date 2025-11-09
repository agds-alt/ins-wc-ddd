import { vi } from 'vitest'

/**
 * Mock Cloudinary uploader for testing
 */
export const mockCloudinaryUpload = vi.fn().mockResolvedValue({
  secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-image.jpg',
  public_id: 'test-public-id-123',
  width: 1920,
  height: 1080,
  format: 'jpg',
  resource_type: 'image',
  created_at: new Date().toISOString(),
  bytes: 512000,
  type: 'upload',
  url: 'http://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-image.jpg',
  version: 1234567890,
})

export const mockCloudinaryDelete = vi.fn().mockResolvedValue({
  result: 'ok',
})

export const mockCloudinaryClient = {
  uploader: {
    upload: mockCloudinaryUpload,
    destroy: mockCloudinaryDelete,
  },
  api: {
    resource: vi.fn().mockResolvedValue({ resource: {} }),
    resources: vi.fn().mockResolvedValue({ resources: [] }),
  },
}
