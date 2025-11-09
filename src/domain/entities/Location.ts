/**
 * Location Domain Entity
 * Represents a toilet/restroom location that can be inspected
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationProps {
  id: string;
  name: string;
  qr_code: string;
  building_id: string;
  organization_id: string;
  code?: string | null;
  floor?: string | null;
  area?: string | null;
  section?: string | null;
  building?: string | null;
  description?: string | null;
  photo_url?: string | null;
  coordinates?: Coordinates | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Virtual fields (from joins)
  building_name?: string;
  organization_name?: string;
}

export class Location {
  private constructor(private props: LocationProps) {}

  // Factory method
  static create(props: LocationProps): Location {
    return new Location(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get qrCode(): string {
    return this.props.qr_code;
  }

  get buildingId(): string {
    return this.props.building_id;
  }

  get organizationId(): string {
    return this.props.organization_id;
  }

  get code(): string | null | undefined {
    return this.props.code;
  }

  get floor(): string | null | undefined {
    return this.props.floor;
  }

  get area(): string | null | undefined {
    return this.props.area;
  }

  get section(): string | null | undefined {
    return this.props.section;
  }

  get building(): string | null | undefined {
    return this.props.building;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get photoUrl(): string | null | undefined {
    return this.props.photo_url;
  }

  get coordinates(): Coordinates | null | undefined {
    return this.props.coordinates;
  }

  get isActive(): boolean {
    return this.props.is_active;
  }

  get createdBy(): string | null | undefined {
    return this.props.created_by;
  }

  get createdAt(): string {
    return this.props.created_at;
  }

  get updatedAt(): string {
    return this.props.updated_at;
  }

  get buildingName(): string | undefined {
    return this.props.building_name;
  }

  get organizationName(): string | undefined {
    return this.props.organization_name;
  }

  // Business logic
  getFullName(): string {
    const parts = [
      this.props.building_name || this.props.building,
      this.props.floor,
      this.props.area,
      this.props.name,
    ].filter(Boolean);
    return parts.join(' - ');
  }

  getDisplayCode(): string {
    return this.props.code || this.props.qr_code.slice(0, 8);
  }

  hasPhoto(): boolean {
    return !!this.props.photo_url;
  }

  hasCoordinates(): boolean {
    return !!this.props.coordinates;
  }

  // Update methods
  update(data: {
    name?: string;
    code?: string;
    floor?: string;
    area?: string;
    section?: string;
    building?: string;
    description?: string;
    photo_url?: string;
    coordinates?: Coordinates;
  }): Location {
    return new Location({
      ...this.props,
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  updateQRCode(qr_code: string): Location {
    return new Location({
      ...this.props,
      qr_code,
      updated_at: new Date().toISOString(),
    });
  }

  activate(): Location {
    return new Location({
      ...this.props,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  deactivate(): Location {
    return new Location({
      ...this.props,
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  toObject(): LocationProps {
    return { ...this.props };
  }
}
