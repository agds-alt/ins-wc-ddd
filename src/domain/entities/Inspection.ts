/**
 * Inspection Domain Entity
 * Represents a toilet inspection record
 */

export type InspectionStatus = 'excellent' | 'good' | 'fair' | 'poor';

export interface InspectionResponses {
  [key: string]: any; // Flexible JSON structure for inspection fields
}

export interface InspectionProps {
  id: string;
  location_id: string;
  template_id: string;
  user_id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: InspectionStatus;
  responses: InspectionResponses;
  notes?: string | null;
  photo_urls?: string[] | null;
  duration_seconds?: number | null;
  submitted_at?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;

  // Virtual fields (from joins)
  location_name?: string;
  user_name?: string;
  verifier_name?: string;
}

export class Inspection {
  private constructor(private props: InspectionProps) {}

  // Factory method
  static create(props: InspectionProps): Inspection {
    return new Inspection(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get locationId(): string {
    return this.props.location_id;
  }

  get templateId(): string {
    return this.props.template_id;
  }

  get userId(): string {
    return this.props.user_id;
  }

  get inspectionDate(): string {
    return this.props.inspection_date;
  }

  get inspectionTime(): string {
    return this.props.inspection_time;
  }

  get overallStatus(): InspectionStatus {
    return this.props.overall_status;
  }

  get responses(): InspectionResponses {
    return this.props.responses;
  }

  get notes(): string | null | undefined {
    return this.props.notes;
  }

  get photoUrls(): string[] | null | undefined {
    return this.props.photo_urls;
  }

  get durationSeconds(): number | null | undefined {
    return this.props.duration_seconds;
  }

  get submittedAt(): string | null | undefined {
    return this.props.submitted_at;
  }

  get verifiedBy(): string | null | undefined {
    return this.props.verified_by;
  }

  get verifiedAt(): string | null | undefined {
    return this.props.verified_at;
  }

  get verificationNotes(): string | null | undefined {
    return this.props.verification_notes;
  }

  get locationName(): string | undefined {
    return this.props.location_name;
  }

  get userName(): string | undefined {
    return this.props.user_name;
  }

  get verifierName(): string | undefined {
    return this.props.verifier_name;
  }

  // Business logic
  isVerified(): boolean {
    return !!this.props.verified_at;
  }

  isSubmitted(): boolean {
    return !!this.props.submitted_at;
  }

  hasPhotos(): boolean {
    return (this.props.photo_urls?.length ?? 0) > 0;
  }

  getPhotoCount(): number {
    return this.props.photo_urls?.length ?? 0;
  }

  getDurationInMinutes(): number {
    return Math.round((this.props.duration_seconds ?? 0) / 60);
  }

  getStatusColor(): string {
    const colors: Record<InspectionStatus, string> = {
      excellent: 'green',
      good: 'blue',
      fair: 'yellow',
      poor: 'red',
    };
    return colors[this.props.overall_status];
  }

  getStatusLabel(): string {
    const labels: Record<InspectionStatus, string> = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      fair: 'Cukup',
      poor: 'Buruk',
    };
    return labels[this.props.overall_status];
  }

  needsAttention(): boolean {
    return this.props.overall_status === 'poor' || this.props.overall_status === 'fair';
  }

  // Update methods
  submit(): Inspection {
    return new Inspection({
      ...this.props,
      submitted_at: new Date().toISOString(),
    });
  }

  verify(verifiedBy: string, notes?: string): Inspection {
    return new Inspection({
      ...this.props,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      verification_notes: notes,
    });
  }

  addPhoto(photoUrl: string): Inspection {
    const currentPhotos = this.props.photo_urls ?? [];
    return new Inspection({
      ...this.props,
      photo_urls: [...currentPhotos, photoUrl],
    });
  }

  addPhotos(photoUrls: string[]): Inspection {
    const currentPhotos = this.props.photo_urls ?? [];
    return new Inspection({
      ...this.props,
      photo_urls: [...currentPhotos, ...photoUrls],
    });
  }

  updateNotes(notes: string): Inspection {
    return new Inspection({
      ...this.props,
      notes,
    });
  }

  toObject(): InspectionProps {
    return { ...this.props };
  }
}
