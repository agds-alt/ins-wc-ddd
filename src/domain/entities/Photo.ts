/**
 * Photo Domain Entity
 * Represents uploaded photos for inspections or locations
 */

export interface PhotoProps {
  id: string;
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  caption?: string | null;
  field_reference?: string | null;
  inspection_id?: string | null;
  location_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export class Photo {
  private constructor(private props: PhotoProps) {}

  // Factory method
  static create(props: PhotoProps): Photo {
    return new Photo(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get fileUrl(): string {
    return this.props.file_url;
  }

  get fileName(): string | null | undefined {
    return this.props.file_name;
  }

  get fileSize(): number | null | undefined {
    return this.props.file_size;
  }

  get mimeType(): string | null | undefined {
    return this.props.mime_type;
  }

  get caption(): string | null | undefined {
    return this.props.caption;
  }

  get fieldReference(): string | null | undefined {
    return this.props.field_reference;
  }

  get inspectionId(): string | null | undefined {
    return this.props.inspection_id;
  }

  get locationId(): string | null | undefined {
    return this.props.location_id;
  }

  get createdBy(): string | null | undefined {
    return this.props.created_by;
  }

  get updatedBy(): string | null | undefined {
    return this.props.updated_by;
  }

  get deletedBy(): string | null | undefined {
    return this.props.deleted_by;
  }

  get isDeleted(): boolean {
    return this.props.is_deleted;
  }

  get createdAt(): string {
    return this.props.created_at;
  }

  get updatedAt(): string {
    return this.props.updated_at;
  }

  get deletedAt(): string | null | undefined {
    return this.props.deleted_at;
  }

  // Business logic
  getFileSizeInKB(): number {
    return Math.round((this.props.file_size ?? 0) / 1024);
  }

  getFileSizeInMB(): number {
    return Math.round((this.props.file_size ?? 0) / (1024 * 1024) * 100) / 100;
  }

  isImage(): boolean {
    return this.props.mime_type?.startsWith('image/') ?? false;
  }

  getFileExtension(): string {
    if (!this.props.file_name) return '';
    const parts = this.props.file_name.split('.');
    return parts[parts.length - 1].toLowerCase();
  }

  belongsToInspection(): boolean {
    return !!this.props.inspection_id;
  }

  belongsToLocation(): boolean {
    return !!this.props.location_id;
  }

  // Update methods
  updateCaption(caption: string, updatedBy: string): Photo {
    return new Photo({
      ...this.props,
      caption,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    });
  }

  softDelete(deletedBy: string): Photo {
    return new Photo({
      ...this.props,
      is_deleted: true,
      deleted_by: deletedBy,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  restore(updatedBy: string): Photo {
    return new Photo({
      ...this.props,
      is_deleted: false,
      deleted_by: null,
      deleted_at: null,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    });
  }

  toObject(): PhotoProps {
    return { ...this.props };
  }
}
