/**
 * User Domain Entity
 * Pure business logic - no infrastructure dependencies
 */

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserProps {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  occupation_id?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  role?: UserRole;
  role_level?: number;
}

export class User {
  private constructor(private props: UserProps) {}

  // Factory method
  static create(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get fullName(): string {
    return this.props.full_name;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get profilePhotoUrl(): string | null | undefined {
    return this.props.profile_photo_url;
  }

  get occupationId(): string | null | undefined {
    return this.props.occupation_id;
  }

  get isActive(): boolean {
    return this.props.is_active;
  }

  get lastLoginAt(): string | null | undefined {
    return this.props.last_login_at;
  }

  get createdAt(): string {
    return this.props.created_at;
  }

  get updatedAt(): string {
    return this.props.updated_at;
  }

  get role(): UserRole | undefined {
    return this.props.role;
  }

  get roleLevel(): number | undefined {
    return this.props.role_level;
  }

  // Business logic methods
  isAdmin(): boolean {
    return this.props.role === 'admin' || this.props.role === 'super_admin';
  }

  isSuperAdmin(): boolean {
    return this.props.role === 'super_admin';
  }

  hasRoleLevel(minLevel: number): boolean {
    return (this.props.role_level ?? 0) >= minLevel;
  }

  canManageUsers(): boolean {
    return this.isAdmin();
  }

  canManageOrganizations(): boolean {
    return this.isSuperAdmin();
  }

  canVerifyInspections(): boolean {
    return this.isAdmin();
  }

  // Update methods
  updateProfile(data: {
    full_name?: string;
    phone?: string;
    profile_photo_url?: string;
    occupation_id?: string;
  }): User {
    return new User({
      ...this.props,
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  updateLastLogin(): User {
    return new User({
      ...this.props,
      last_login_at: new Date().toISOString(),
    });
  }

  activate(): User {
    return new User({
      ...this.props,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  deactivate(): User {
    return new User({
      ...this.props,
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  // Convert to plain object (for persistence)
  toObject(): UserProps {
    return { ...this.props };
  }

  // Safe version without sensitive data
  toSafeObject(): Omit<UserProps, 'password_hash'> {
    return { ...this.props };
  }
}
