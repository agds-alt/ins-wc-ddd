/**
 * Organization Domain Entity
 * Root entity for multi-tenant system
 */

export interface OrganizationProps {
  id: string;
  name: string;
  short_code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export class Organization {
  private constructor(private props: OrganizationProps) {}

  // Factory method
  static create(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get shortCode(): string {
    return this.props.short_code;
  }

  get email(): string | null | undefined {
    return this.props.email;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get address(): string | null | undefined {
    return this.props.address;
  }

  get logoUrl(): string | null | undefined {
    return this.props.logo_url;
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

  // Business logic
  hasLogo(): boolean {
    return !!this.props.logo_url;
  }

  hasContactInfo(): boolean {
    return !!this.props.email || !!this.props.phone;
  }

  // Update methods
  update(data: {
    name?: string;
    short_code?: string;
    email?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
  }): Organization {
    return new Organization({
      ...this.props,
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  activate(): Organization {
    return new Organization({
      ...this.props,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  deactivate(): Organization {
    return new Organization({
      ...this.props,
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  toObject(): OrganizationProps {
    return { ...this.props };
  }
}
