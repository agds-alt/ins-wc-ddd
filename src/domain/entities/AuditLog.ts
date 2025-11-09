/**
 * AuditLog Domain Entity
 * For tracking all system actions (optional - for future use)
 */

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'verify'
  | 'approve'
  | 'reject';

export type AuditEntityType =
  | 'user'
  | 'inspection'
  | 'location'
  | 'building'
  | 'organization'
  | 'photo';

export interface AuditLogProps {
  id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  user_id: string;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;

  // Virtual fields
  user_name?: string;
}

export class AuditLog {
  private constructor(private props: AuditLogProps) {}

  // Factory method
  static create(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get action(): AuditAction {
    return this.props.action;
  }

  get entityType(): AuditEntityType {
    return this.props.entity_type;
  }

  get entityId(): string {
    return this.props.entity_id;
  }

  get userId(): string {
    return this.props.user_id;
  }

  get changes(): Record<string, any> | null | undefined {
    return this.props.changes;
  }

  get metadata(): Record<string, any> | null | undefined {
    return this.props.metadata;
  }

  get ipAddress(): string | null | undefined {
    return this.props.ip_address;
  }

  get userAgent(): string | null | undefined {
    return this.props.user_agent;
  }

  get createdAt(): string {
    return this.props.created_at;
  }

  get userName(): string | undefined {
    return this.props.user_name;
  }

  // Business logic
  getActionLabel(): string {
    const labels: Record<AuditAction, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      login: 'Logged In',
      logout: 'Logged Out',
      verify: 'Verified',
      approve: 'Approved',
      reject: 'Rejected',
    };
    return labels[this.props.action];
  }

  getEntityTypeLabel(): string {
    const labels: Record<AuditEntityType, string> = {
      user: 'User',
      inspection: 'Inspection',
      location: 'Location',
      building: 'Building',
      organization: 'Organization',
      photo: 'Photo',
    };
    return labels[this.props.entity_type];
  }

  getDescription(): string {
    return `${this.getActionLabel()} ${this.getEntityTypeLabel()}`;
  }

  hasChanges(): boolean {
    return !!this.props.changes && Object.keys(this.props.changes).length > 0;
  }

  toObject(): AuditLogProps {
    return { ...this.props };
  }
}
