/**
 * Report Service
 * Business logic for generating reports and analytics
 */

import { Inspection } from '../entities/Inspection';
import { Location } from '../entities/Location';
import { IInspectionRepository, InspectionFilters } from '../repositories/IInspectionRepository';
import { ILocationRepository } from '../repositories/ILocationRepository';
import { IBuildingRepository } from '../repositories/IBuildingRepository';
import { IOrganizationRepository } from '../repositories/IOrganizationRepository';

export interface ReportFilters {
  organization_id?: string;
  building_id?: string;
  location_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface LocationReport {
  location: Location;
  total_inspections: number;
  average_rating: number;
  last_inspection_date?: string;
  status_breakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  needs_attention: boolean;
}

export interface BuildingReport {
  building_id: string;
  building_name: string;
  total_locations: number;
  total_inspections: number;
  average_rating: number;
  locations_need_attention: number;
}

export interface OrganizationReport {
  organization_id: string;
  organization_name: string;
  total_buildings: number;
  total_locations: number;
  total_inspections: number;
  average_rating: number;
}

export class ReportService {
  constructor(
    private inspectionRepository: IInspectionRepository,
    private locationRepository: ILocationRepository,
    private buildingRepository: IBuildingRepository,
    private organizationRepository: IOrganizationRepository
  ) {}

  /**
   * Generate location report
   */
  async generateLocationReport(locationId: string): Promise<LocationReport> {
    const location = await this.locationRepository.findById(locationId);

    if (!location) {
      throw new Error('Location not found');
    }

    const inspections = await this.inspectionRepository.findByLocation(locationId, 100);

    const statusBreakdown = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };

    let needsAttention = false;

    inspections.forEach((inspection) => {
      statusBreakdown[inspection.overallStatus]++;
      if (inspection.needsAttention()) {
        needsAttention = true;
      }
    });

    // Calculate average rating
    const ratingMap = { excellent: 4, good: 3, fair: 2, poor: 1 };
    const totalRating = inspections.reduce(
      (sum, inspection) => sum + ratingMap[inspection.overallStatus],
      0
    );
    const averageRating = inspections.length > 0 ? totalRating / inspections.length : 0;

    // Get last inspection date
    const lastInspectionDate = inspections.length > 0 ? inspections[0].inspectionDate : undefined;

    return {
      location,
      total_inspections: inspections.length,
      average_rating: Math.round(averageRating * 100) / 100,
      last_inspection_date: lastInspectionDate,
      status_breakdown: statusBreakdown,
      needs_attention: needsAttention,
    };
  }

  /**
   * Generate building report
   */
  async generateBuildingReport(buildingId: string): Promise<BuildingReport> {
    const building = await this.buildingRepository.findById(buildingId);

    if (!building) {
      throw new Error('Building not found');
    }

    const locations = await this.locationRepository.findByBuilding(buildingId, 100);

    let totalInspections = 0;
    let totalRating = 0;
    let locationsNeedAttention = 0;

    // Get inspections for each location
    for (const location of locations) {
      const inspections = await this.inspectionRepository.findByLocation(location.id, 50);
      totalInspections += inspections.length;

      if (inspections.length > 0) {
        const ratingMap = { excellent: 4, good: 3, fair: 2, poor: 1 };
        const locationRating = inspections.reduce(
          (sum, inspection) => sum + ratingMap[inspection.overallStatus],
          0
        );
        totalRating += locationRating / inspections.length;

        // Check if any inspection needs attention
        if (inspections.some((inspection) => inspection.needsAttention())) {
          locationsNeedAttention++;
        }
      }
    }

    const averageRating = locations.length > 0 ? totalRating / locations.length : 0;

    return {
      building_id: buildingId,
      building_name: building.name,
      total_locations: locations.length,
      total_inspections: totalInspections,
      average_rating: Math.round(averageRating * 100) / 100,
      locations_need_attention: locationsNeedAttention,
    };
  }

  /**
   * Generate organization report
   */
  async generateOrganizationReport(organizationId: string): Promise<OrganizationReport> {
    const organization = await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    const buildings = await this.buildingRepository.findByOrganization(organizationId, 100);
    const locations = await this.locationRepository.findByOrganization(organizationId, 500);

    // Get all inspections for this organization
    const allInspections = await this.inspectionRepository.findAll(
      { organization_id: organizationId },
      1000
    );

    // Calculate average rating
    const ratingMap = { excellent: 4, good: 3, fair: 2, poor: 1 };
    const totalRating = allInspections.reduce(
      (sum, inspection) => sum + ratingMap[inspection.overallStatus],
      0
    );
    const averageRating = allInspections.length > 0 ? totalRating / allInspections.length : 0;

    return {
      organization_id: organizationId,
      organization_name: organization.name,
      total_buildings: buildings.length,
      total_locations: locations.length,
      total_inspections: allInspections.length,
      average_rating: Math.round(averageRating * 100) / 100,
    };
  }

  /**
   * Get trending data (for charts)
   */
  async getTrendingData(filters: ReportFilters, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const inspectionFilters: InspectionFilters = {
      ...filters,
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
    };

    const inspections = await this.inspectionRepository.findAll(inspectionFilters, 500);

    // Group by date
    const dataByDate: Record<
      string,
      { excellent: number; good: number; fair: number; poor: number; total: number }
    > = {};

    inspections.forEach((inspection) => {
      const date = inspection.inspectionDate;

      if (!dataByDate[date]) {
        dataByDate[date] = { excellent: 0, good: 0, fair: 0, poor: 0, total: 0 };
      }

      dataByDate[date][inspection.overallStatus]++;
      dataByDate[date].total++;
    });

    return dataByDate;
  }

  /**
   * Export data for PDF/Excel
   */
  async exportInspections(filters: ReportFilters) {
    const inspectionFilters: InspectionFilters = {
      organization_id: filters.organization_id,
      building_id: filters.building_id,
      location_id: filters.location_id,
      date_from: filters.date_from,
      date_to: filters.date_to,
    };

    const inspections = await this.inspectionRepository.findAll(inspectionFilters, 500);

    // Format for export
    return inspections.map((inspection) => ({
      inspection_date: inspection.inspectionDate,
      inspection_time: inspection.inspectionTime,
      location_name: inspection.locationName,
      user_name: inspection.userName,
      overall_status: inspection.getStatusLabel(),
      notes: inspection.notes,
      verified: inspection.isVerified() ? 'Yes' : 'No',
      verified_by: inspection.verifierName,
    }));
  }
}
