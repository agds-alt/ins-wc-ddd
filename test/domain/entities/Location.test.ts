import { describe, it, expect } from 'vitest'
import { Location, LocationProps, Coordinates } from '@/domain/entities/Location'
import { mockLocation } from '../../mocks/testData'

describe('Location Entity', () => {
  describe('Factory method', () => {
    it('should create a valid location', () => {
      const location = Location.create(mockLocation)

      expect(location).toBeInstanceOf(Location)
      expect(location.id).toBe(mockLocation.id)
      expect(location.name).toBe(mockLocation.name)
      expect(location.qrCode).toBe(mockLocation.qr_code)
    })
  })

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      const coords: Coordinates = { latitude: -6.2088, longitude: 106.8456 }
      const props: LocationProps = {
        id: 'loc-123',
        name: 'Toilet Lantai 1',
        qr_code: 'QR-LOC-123',
        building_id: 'building-456',
        organization_id: 'org-789',
        code: 'TL1-001',
        floor: '1',
        area: 'West Wing',
        section: 'A',
        building: 'Main Building',
        description: 'Public toilet on first floor',
        photo_url: 'https://test.com/photo.jpg',
        coordinates: coords,
        is_active: true,
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        building_name: 'Main Building',
        organization_name: 'Test Org',
      }
      const location = Location.create(props)

      expect(location.id).toBe('loc-123')
      expect(location.name).toBe('Toilet Lantai 1')
      expect(location.qrCode).toBe('QR-LOC-123')
      expect(location.buildingId).toBe('building-456')
      expect(location.organizationId).toBe('org-789')
      expect(location.code).toBe('TL1-001')
      expect(location.floor).toBe('1')
      expect(location.area).toBe('West Wing')
      expect(location.section).toBe('A')
      expect(location.building).toBe('Main Building')
      expect(location.description).toBe('Public toilet on first floor')
      expect(location.photoUrl).toBe('https://test.com/photo.jpg')
      expect(location.coordinates).toEqual(coords)
      expect(location.isActive).toBe(true)
      expect(location.createdBy).toBe('admin-123')
      expect(location.buildingName).toBe('Main Building')
      expect(location.organizationName).toBe('Test Org')
    })
  })

  describe('Business logic - getFullName', () => {
    it('should combine all parts with building_name', () => {
      const props: LocationProps = {
        ...mockLocation,
        building_name: 'Main Building',
        floor: 'Floor 2',
        area: 'East Wing',
        name: 'Toilet A',
      }
      const location = Location.create(props)

      const fullName = location.getFullName()

      expect(fullName).toBe('Main Building - Floor 2 - East Wing - Toilet A')
    })

    it('should use building field if building_name is not available', () => {
      const props: LocationProps = {
        ...mockLocation,
        building_name: undefined,
        building: 'Building B',
        floor: 'Floor 1',
        name: 'Toilet B',
        area: null,
      }
      const location = Location.create(props)

      const fullName = location.getFullName()

      expect(fullName).toBe('Building B - Floor 1 - Toilet B')
    })

    it('should handle missing optional parts', () => {
      const props: LocationProps = {
        ...mockLocation,
        building_name: undefined,
        building: null,
        floor: null,
        area: null,
        name: 'Standalone Toilet',
      }
      const location = Location.create(props)

      const fullName = location.getFullName()

      expect(fullName).toBe('Standalone Toilet')
    })

    it('should filter out null and undefined values', () => {
      const props: LocationProps = {
        ...mockLocation,
        building_name: 'Building A',
        floor: null,
        area: undefined,
        name: 'Toilet',
      }
      const location = Location.create(props)

      const fullName = location.getFullName()

      expect(fullName).toBe('Building A - Toilet')
    })
  })

  describe('Business logic - getDisplayCode', () => {
    it('should return code when available', () => {
      const props: LocationProps = {
        ...mockLocation,
        code: 'LOC-001',
        qr_code: 'QRCODE-VERY-LONG-STRING',
      }
      const location = Location.create(props)

      expect(location.getDisplayCode()).toBe('LOC-001')
    })

    it('should return first 8 chars of qr_code when code is null', () => {
      const props: LocationProps = {
        ...mockLocation,
        code: null,
        qr_code: 'QRCODE123456789',
      }
      const location = Location.create(props)

      expect(location.getDisplayCode()).toBe('QRCODE12')
    })

    it('should handle short qr_code', () => {
      const props: LocationProps = {
        ...mockLocation,
        code: null,
        qr_code: 'QR123',
      }
      const location = Location.create(props)

      expect(location.getDisplayCode()).toBe('QR123')
    })
  })

  describe('Business logic - hasPhoto', () => {
    it('should return true when photo_url exists', () => {
      const props: LocationProps = {
        ...mockLocation,
        photo_url: 'https://test.com/photo.jpg',
      }
      const location = Location.create(props)

      expect(location.hasPhoto()).toBe(true)
    })

    it('should return false when photo_url is null', () => {
      const props: LocationProps = {
        ...mockLocation,
        photo_url: null,
      }
      const location = Location.create(props)

      expect(location.hasPhoto()).toBe(false)
    })

    it('should return false when photo_url is undefined', () => {
      const props: LocationProps = {
        ...mockLocation,
        photo_url: undefined,
      }
      const location = Location.create(props)

      expect(location.hasPhoto()).toBe(false)
    })
  })

  describe('Business logic - hasCoordinates', () => {
    it('should return true when coordinates exist', () => {
      const props: LocationProps = {
        ...mockLocation,
        coordinates: { latitude: -6.2088, longitude: 106.8456 },
      }
      const location = Location.create(props)

      expect(location.hasCoordinates()).toBe(true)
    })

    it('should return false when coordinates is null', () => {
      const props: LocationProps = {
        ...mockLocation,
        coordinates: null,
      }
      const location = Location.create(props)

      expect(location.hasCoordinates()).toBe(false)
    })

    it('should return false when coordinates is undefined', () => {
      const props: LocationProps = {
        ...mockLocation,
        coordinates: undefined,
      }
      const location = Location.create(props)

      expect(location.hasCoordinates()).toBe(false)
    })
  })

  describe('Update methods - update', () => {
    it('should update provided fields', () => {
      const location = Location.create(mockLocation)

      const updated = location.update({
        name: 'Updated Toilet Name',
        floor: 'Floor 3',
        description: 'Updated description',
      })

      expect(updated.name).toBe('Updated Toilet Name')
      expect(updated.floor).toBe('Floor 3')
      expect(updated.description).toBe('Updated description')
      expect(updated.updatedAt).not.toBe(mockLocation.updated_at)
    })

    it('should not change unspecified fields', () => {
      const location = Location.create(mockLocation)

      const updated = location.update({
        name: 'Updated Name',
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.qrCode).toBe(mockLocation.qr_code)
      expect(updated.buildingId).toBe(mockLocation.building_id)
    })

    it('should update coordinates', () => {
      const location = Location.create(mockLocation)
      const newCoords: Coordinates = { latitude: -6.3, longitude: 106.9 }

      const updated = location.update({
        coordinates: newCoords,
      })

      expect(updated.coordinates).toEqual(newCoords)
    })

    it('should create a new instance', () => {
      const location = Location.create(mockLocation)

      const updated = location.update({ name: 'Updated Name' })

      expect(updated).not.toBe(location)
      expect(updated).toBeInstanceOf(Location)
    })
  })

  describe('Update methods - updateQRCode', () => {
    it('should update qr_code', () => {
      const location = Location.create(mockLocation)

      const updated = location.updateQRCode('NEW-QR-CODE-123')

      expect(updated.qrCode).toBe('NEW-QR-CODE-123')
      expect(updated.updatedAt).not.toBe(mockLocation.updated_at)
    })

    it('should create a new instance', () => {
      const location = Location.create(mockLocation)

      const updated = location.updateQRCode('NEW-QR-CODE')

      expect(updated).not.toBe(location)
      expect(updated).toBeInstanceOf(Location)
    })
  })

  describe('Update methods - activate', () => {
    it('should set is_active to true', () => {
      const location = Location.create({ ...mockLocation, is_active: false })

      const activated = location.activate()

      expect(activated.isActive).toBe(true)
      expect(activated.updatedAt).not.toBe(mockLocation.updated_at)
    })

    it('should create a new instance', () => {
      const location = Location.create(mockLocation)

      const activated = location.activate()

      expect(activated).not.toBe(location)
      expect(activated).toBeInstanceOf(Location)
    })
  })

  describe('Update methods - deactivate', () => {
    it('should set is_active to false', () => {
      const location = Location.create({ ...mockLocation, is_active: true })

      const deactivated = location.deactivate()

      expect(deactivated.isActive).toBe(false)
      expect(deactivated.updatedAt).not.toBe(mockLocation.updated_at)
    })

    it('should create a new instance', () => {
      const location = Location.create(mockLocation)

      const deactivated = location.deactivate()

      expect(deactivated).not.toBe(location)
      expect(deactivated).toBeInstanceOf(Location)
    })
  })

  describe('toObject', () => {
    it('should return plain object with all properties', () => {
      const location = Location.create(mockLocation)

      const obj = location.toObject()

      expect(obj).toEqual(mockLocation)
      expect(obj).not.toBe(mockLocation) // Should be a copy
    })
  })
})
