import { describe, it, expect } from 'vitest'
import { Inspection, InspectionProps } from '@/domain/entities/Inspection'
import { createMockInspection } from '../../mocks/testData'

describe('Inspection Entity', () => {
  describe('Factory method', () => {
    it('should create a valid inspection', () => {
      const props = createMockInspection()
      const inspection = Inspection.create(props)

      expect(inspection).toBeInstanceOf(Inspection)
      expect(inspection.id).toBe(props.id)
      expect(inspection.locationId).toBe(props.location_id)
      expect(inspection.userId).toBe(props.user_id)
      expect(inspection.overallStatus).toBe(props.overall_status)
    })
  })

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      const props = createMockInspection({
        id: 'insp-123',
        location_id: 'loc-456',
        user_id: 'user-789',
        template_id: 'template-001',
        inspection_date: '2024-01-15',
        inspection_time: '14:30:00',
        overall_status: 'excellent',
        notes: 'Very clean',
        photo_urls: ['https://test.com/photo1.jpg'],
      })
      const inspection = Inspection.create(props)

      expect(inspection.id).toBe('insp-123')
      expect(inspection.locationId).toBe('loc-456')
      expect(inspection.userId).toBe('user-789')
      expect(inspection.templateId).toBe('template-001')
      expect(inspection.inspectionDate).toBe('2024-01-15')
      expect(inspection.inspectionTime).toBe('14:30:00')
      expect(inspection.overallStatus).toBe('excellent')
      expect(inspection.notes).toBe('Very clean')
      expect(inspection.photoUrls).toEqual(['https://test.com/photo1.jpg'])
    })
  })

  describe('Business logic - isVerified', () => {
    it('should return true when verified', () => {
      const props = createMockInspection({
        verified_at: '2024-01-15T15:00:00.000Z',
        verified_by: 'admin-123',
      })
      const inspection = Inspection.create(props)

      expect(inspection.isVerified()).toBe(true)
    })

    it('should return false when not verified', () => {
      const props = createMockInspection({
        verified_at: null,
        verified_by: null,
      })
      const inspection = Inspection.create(props)

      expect(inspection.isVerified()).toBe(false)
    })
  })

  describe('Business logic - isSubmitted', () => {
    it('should return true when submitted', () => {
      const props = createMockInspection({
        submitted_at: '2024-01-15T10:33:00.000Z',
      })
      const inspection = Inspection.create(props)

      expect(inspection.isSubmitted()).toBe(true)
    })

    it('should return false when not submitted', () => {
      const props = createMockInspection({
        submitted_at: null,
      })
      const inspection = Inspection.create(props)

      expect(inspection.isSubmitted()).toBe(false)
    })
  })

  describe('Business logic - hasPhotos', () => {
    it('should return true when photos exist', () => {
      const props = createMockInspection({
        photo_urls: ['photo1.jpg', 'photo2.jpg'],
      })
      const inspection = Inspection.create(props)

      expect(inspection.hasPhotos()).toBe(true)
    })

    it('should return false when no photos', () => {
      const props = createMockInspection({
        photo_urls: [],
      })
      const inspection = Inspection.create(props)

      expect(inspection.hasPhotos()).toBe(false)
    })

    it('should return false when photo_urls is null', () => {
      const props = createMockInspection({
        photo_urls: null,
      })
      const inspection = Inspection.create(props)

      expect(inspection.hasPhotos()).toBe(false)
    })
  })

  describe('Business logic - getPhotoCount', () => {
    it('should return correct count when photos exist', () => {
      const props = createMockInspection({
        photo_urls: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      })
      const inspection = Inspection.create(props)

      expect(inspection.getPhotoCount()).toBe(3)
    })

    it('should return 0 when no photos', () => {
      const props = createMockInspection({
        photo_urls: null,
      })
      const inspection = Inspection.create(props)

      expect(inspection.getPhotoCount()).toBe(0)
    })
  })

  describe('Business logic - getDurationInMinutes', () => {
    it('should convert seconds to minutes correctly', () => {
      const props = createMockInspection({
        duration_seconds: 180, // 3 minutes
      })
      const inspection = Inspection.create(props)

      expect(inspection.getDurationInMinutes()).toBe(3)
    })

    it('should round to nearest minute', () => {
      const props = createMockInspection({
        duration_seconds: 150, // 2.5 minutes
      })
      const inspection = Inspection.create(props)

      expect(inspection.getDurationInMinutes()).toBe(3)
    })

    it('should return 0 when duration is null', () => {
      const props = createMockInspection({
        duration_seconds: null,
      })
      const inspection = Inspection.create(props)

      expect(inspection.getDurationInMinutes()).toBe(0)
    })
  })

  describe('Business logic - getStatusColor', () => {
    it('should return green for excellent status', () => {
      const props = createMockInspection({ overall_status: 'excellent' })
      const inspection = Inspection.create(props)

      expect(inspection.getStatusColor()).toBe('green')
    })

    it('should return blue for good status', () => {
      const props = createMockInspection({ overall_status: 'good' })
      const inspection = Inspection.create(props)

      expect(inspection.getStatusColor()).toBe('blue')
    })

    it('should return yellow for fair status', () => {
      const props = createMockInspection({ overall_status: 'fair' })
      const inspection = Inspection.create(props)

      expect(inspection.getStatusColor()).toBe('yellow')
    })

    it('should return red for poor status', () => {
      const props = createMockInspection({ overall_status: 'poor' })
      const inspection = Inspection.create(props)

      expect(inspection.getStatusColor()).toBe('red')
    })
  })

  describe('Business logic - getStatusLabel', () => {
    it('should return correct Indonesian label for each status', () => {
      const statuses: Array<[any, string]> = [
        ['excellent', 'Sangat Baik'],
        ['good', 'Baik'],
        ['fair', 'Cukup'],
        ['poor', 'Buruk'],
      ]

      statuses.forEach(([status, expectedLabel]) => {
        const props = createMockInspection({ overall_status: status })
        const inspection = Inspection.create(props)
        expect(inspection.getStatusLabel()).toBe(expectedLabel)
      })
    })
  })

  describe('Business logic - needsAttention', () => {
    it('should return true for poor status', () => {
      const props = createMockInspection({ overall_status: 'poor' })
      const inspection = Inspection.create(props)

      expect(inspection.needsAttention()).toBe(true)
    })

    it('should return true for fair status', () => {
      const props = createMockInspection({ overall_status: 'fair' })
      const inspection = Inspection.create(props)

      expect(inspection.needsAttention()).toBe(true)
    })

    it('should return false for good status', () => {
      const props = createMockInspection({ overall_status: 'good' })
      const inspection = Inspection.create(props)

      expect(inspection.needsAttention()).toBe(false)
    })

    it('should return false for excellent status', () => {
      const props = createMockInspection({ overall_status: 'excellent' })
      const inspection = Inspection.create(props)

      expect(inspection.needsAttention()).toBe(false)
    })
  })

  describe('Update methods - submit', () => {
    it('should mark inspection as submitted', () => {
      const props = createMockInspection({ submitted_at: null })
      const inspection = Inspection.create(props)

      const submitted = inspection.submit()

      expect(submitted.isSubmitted()).toBe(true)
      expect(submitted.submittedAt).toBeTruthy()
    })

    it('should create a new instance', () => {
      const props = createMockInspection()
      const inspection = Inspection.create(props)

      const submitted = inspection.submit()

      expect(submitted).not.toBe(inspection)
      expect(submitted).toBeInstanceOf(Inspection)
    })
  })

  describe('Update methods - verify', () => {
    it('should mark inspection as verified', () => {
      const props = createMockInspection()
      const inspection = Inspection.create(props)

      const verified = inspection.verify('admin-123', 'Looks good')

      expect(verified.isVerified()).toBe(true)
      expect(verified.verifiedBy).toBe('admin-123')
      expect(verified.verificationNotes).toBe('Looks good')
      expect(verified.verifiedAt).toBeTruthy()
    })

    it('should work without notes', () => {
      const props = createMockInspection()
      const inspection = Inspection.create(props)

      const verified = inspection.verify('admin-123')

      expect(verified.isVerified()).toBe(true)
      expect(verified.verifiedBy).toBe('admin-123')
      expect(verified.verificationNotes).toBeUndefined()
    })

    it('should create a new instance', () => {
      const props = createMockInspection()
      const inspection = Inspection.create(props)

      const verified = inspection.verify('admin-123')

      expect(verified).not.toBe(inspection)
      expect(verified).toBeInstanceOf(Inspection)
    })
  })

  describe('Update methods - addPhoto', () => {
    it('should add a single photo', () => {
      const props = createMockInspection({ photo_urls: [] })
      const inspection = Inspection.create(props)

      const withPhoto = inspection.addPhoto('https://test.com/photo1.jpg')

      expect(withPhoto.getPhotoCount()).toBe(1)
      expect(withPhoto.photoUrls).toContain('https://test.com/photo1.jpg')
    })

    it('should add photo to existing photos', () => {
      const props = createMockInspection({
        photo_urls: ['https://test.com/photo1.jpg'],
      })
      const inspection = Inspection.create(props)

      const withPhoto = inspection.addPhoto('https://test.com/photo2.jpg')

      expect(withPhoto.getPhotoCount()).toBe(2)
      expect(withPhoto.photoUrls).toContain('https://test.com/photo2.jpg')
    })

    it('should handle null photo_urls', () => {
      const props = createMockInspection({ photo_urls: null })
      const inspection = Inspection.create(props)

      const withPhoto = inspection.addPhoto('https://test.com/photo1.jpg')

      expect(withPhoto.getPhotoCount()).toBe(1)
    })
  })

  describe('Update methods - addPhotos', () => {
    it('should add multiple photos at once', () => {
      const props = createMockInspection({ photo_urls: [] })
      const inspection = Inspection.create(props)

      const withPhotos = inspection.addPhotos([
        'https://test.com/photo1.jpg',
        'https://test.com/photo2.jpg',
        'https://test.com/photo3.jpg',
      ])

      expect(withPhotos.getPhotoCount()).toBe(3)
    })
  })

  describe('Update methods - updateNotes', () => {
    it('should update notes', () => {
      const props = createMockInspection({ notes: 'Old notes' })
      const inspection = Inspection.create(props)

      const updated = inspection.updateNotes('New notes')

      expect(updated.notes).toBe('New notes')
    })
  })

  describe('toObject', () => {
    it('should return plain object with all properties', () => {
      const props = createMockInspection()
      const inspection = Inspection.create(props)

      const obj = inspection.toObject()

      expect(obj).toEqual(props)
      expect(obj).not.toBe(props) // Should be a copy
    })
  })
})
