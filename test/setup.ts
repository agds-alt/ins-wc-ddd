import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { default: React } = require('react')
    return React.createElement('img', props)
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-testing-purposes-only'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-for-testing-purposes-only'
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-api-key'
process.env.CLOUDINARY_API_SECRET = 'test-api-secret'
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-jwt-signing'
