/**
 * Building Domain Entity
 * Represents a physical building in an organization
 */

export interface BuildingProps {
  id: string;
  name: string;
  short_code: string;
  organization_id: string;
  address?: string | null;
  type?: string | null;
  total_floors?: number | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export class Building {
  private constructor(private props: BuildingProps) {}

  // Factory method
  static create(props: BuildingProps): Building {
    return new Building(props);
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

  get organizationId(): string {
    return this.props.organization_id;
  }

  get address(): string | null | undefined {
    return this.props.address;
  }

  get type(): string | null | undefined {
    return this.props.type;
  }

  get totalFloors(): number | null | undefined {
    return this.props.total_floors;
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
  hasMultipleFloors(): boolean {
    return (this.props.total_floors ?? 0) > 1;
  }

  getFloorsList(): string[] {
    const floors = this.props.total_floors ?? 0;
    if (floors === 0) return [];
    return Array.from({ length: floors }, (_, i) => `Floor ${i + 1}`);
  }

  // Update methods
  update(data: {
    name?: string;
    short_code?: string;
    address?: string;
    type?: string;
    total_floors?: number;
  }): Building {
    return new Building({
      ...this.props,
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  activate(): Building {
    return new Building({
      ...this.props,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  deactivate(): Building {
    return new Building({
      ...this.props,
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  toObject(): BuildingProps {
    return { ...this.props };
  }
}
