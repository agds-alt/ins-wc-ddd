import type { InspectionProps, InspectionStatus } from '@/domain/entities/Inspection'

/**
 * Mock test data for common entities
 */

export const mockUser = {
  id: 'user-test-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user' as const,
  organization_id: 'org-test-123',
  phone: '+62812345678',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockAdmin = {
  id: 'admin-test-123',
  email: 'admin@example.com',
  full_name: 'Test Admin',
  role: 'admin' as const,
  organization_id: 'org-test-123',
  phone: '+62812345679',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockSuperAdmin = {
  id: 'superadmin-test-123',
  email: 'superadmin@example.com',
  full_name: 'Test Super Admin',
  role: 'super_admin' as const,
  organization_id: 'org-test-123',
  phone: '+62812345680',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockOrganization = {
  id: 'org-test-123',
  name: 'Test Organization',
  code: 'TEST-ORG',
  address: 'Test Address 123',
  contact_person: 'Test Contact',
  contact_phone: '+62812345678',
  contact_email: 'contact@test.com',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockBuilding = {
  id: 'building-test-123',
  organization_id: 'org-test-123',
  name: 'Test Building',
  code: 'TB-001',
  address: 'Test Building Address',
  total_floors: 5,
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockLocation = {
  id: 'location-test-123',
  building_id: 'building-test-123',
  organization_id: 'org-test-123',
  name: 'Test Toilet',
  code: 'TT-001',
  floor: 1,
  room_number: '101',
  description: 'Test toilet on first floor',
  qr_code: 'QR-TEST-123',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockTemplate = {
  id: 'template-test-123',
  organization_id: 'org-test-123',
  name: 'Standard Inspection Template',
  description: 'Standard template for toilet inspections',
  fields: [
    {
      id: 'field-1',
      label: 'Cleanliness',
      type: 'rating',
      required: true,
      options: ['1', '2', '3', '4', '5'],
    },
    {
      id: 'field-2',
      label: 'Odor',
      type: 'rating',
      required: true,
      options: ['1', '2', '3', '4', '5'],
    },
    {
      id: 'field-3',
      label: 'Supplies',
      type: 'rating',
      required: true,
      options: ['1', '2', '3', '4', '5'],
    },
  ],
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const createMockInspection = (
  overrides?: Partial<InspectionProps>
): InspectionProps => ({
  id: 'inspection-test-123',
  location_id: 'location-test-123',
  template_id: 'template-test-123',
  user_id: 'user-test-123',
  inspection_date: '2024-01-15',
  inspection_time: '10:30:00',
  overall_status: 'good' as InspectionStatus,
  responses: {
    'field-1': 4,
    'field-2': 4,
    'field-3': 5,
  },
  notes: 'Test inspection notes',
  photo_urls: ['https://test.cloudinary.com/photo1.jpg'],
  duration_seconds: 180,
  submitted_at: '2024-01-15T10:33:00.000Z',
  verified_by: null,
  verified_at: null,
  verification_notes: null,
  ...overrides,
})

export const mockInspection = createMockInspection()

export const mockPhoto = {
  id: 'photo-test-123',
  inspection_id: 'inspection-test-123',
  url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-photo.jpg',
  public_id: 'test-public-id-456',
  description: 'Test photo description',
  uploaded_at: '2024-01-15T10:32:00.000Z',
  uploaded_by: 'user-test-123',
}

export const mockAuditLog = {
  id: 'audit-test-123',
  user_id: 'user-test-123',
  action: 'CREATE_INSPECTION' as const,
  entity_type: 'inspection' as const,
  entity_id: 'inspection-test-123',
  details: {
    location_id: 'location-test-123',
    overall_status: 'good',
  },
  ip_address: '127.0.0.1',
  user_agent: 'Test User Agent',
  created_at: '2024-01-15T10:33:00.000Z',
}

/**
 * Helper function to create multiple mock inspections
 */
export const createMockInspections = (count: number): InspectionProps[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockInspection({
      id: `inspection-test-${i + 1}`,
      inspection_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    })
  )
}
