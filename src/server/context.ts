/**
 * tRPC Context
 * Creates context for each request - includes user authentication
 */

import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getAuthCookie } from '@/infrastructure/auth/cookies';
import { verifyJWT, JWTPayload } from '@/infrastructure/auth/jwt';

// Repository imports
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { InspectionRepository } from '@/infrastructure/database/repositories/InspectionRepository';
import { LocationRepository } from '@/infrastructure/database/repositories/LocationRepository';
import { BuildingRepository } from '@/infrastructure/database/repositories/BuildingRepository';
import { OrganizationRepository } from '@/infrastructure/database/repositories/OrganizationRepository';
import { AuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';

// Service imports
import { AuthService } from '@/domain/services/AuthService';
import { InspectionService } from '@/domain/services/InspectionService';
import { QRCodeService } from '@/domain/services/QRCodeService';
import { ReportService } from '@/domain/services/ReportService';

// Auth utilities
import { hashPassword, comparePassword } from '@/infrastructure/auth/password';
import { signJWT } from '@/infrastructure/auth/jwt';

/**
 * Create context for each tRPC request
 * This runs on every request and provides:
 * - Authenticated user (if any)
 * - All repositories
 * - All services
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Extract JWT from cookie
  let user: JWTPayload | null = null;

  try {
    const token = await getAuthCookie();

    if (token) {
      user = await verifyJWT(token);
    }
  } catch (error) {
    // Token invalid - user stays null
    console.error('Context auth error:', error);
  }

  // Initialize repositories
  const userRepository = new UserRepository();
  const inspectionRepository = new InspectionRepository();
  const locationRepository = new LocationRepository();
  const buildingRepository = new BuildingRepository();
  const organizationRepository = new OrganizationRepository();
  const auditLogRepository = new AuditLogRepository();

  // Initialize services with dependencies
  const authService = new AuthService(
    userRepository,
    {
      hash: hashPassword,
      compare: comparePassword,
    },
    {
      sign: signJWT,
      verify: verifyJWT,
    }
  );

  const inspectionService = new InspectionService(
    inspectionRepository,
    locationRepository,
    userRepository
  );

  const qrCodeService = new QRCodeService(locationRepository);

  const reportService = new ReportService(
    inspectionRepository,
    locationRepository,
    buildingRepository,
    organizationRepository
  );

  return {
    // User (null if not authenticated)
    user,

    // Repositories
    repositories: {
      user: userRepository,
      inspection: inspectionRepository,
      location: locationRepository,
      building: buildingRepository,
      organization: organizationRepository,
      auditLog: auditLogRepository,
    },

    // Services
    services: {
      auth: authService,
      inspection: inspectionService,
      qrCode: qrCodeService,
      report: reportService,
    },

    // Request metadata (optional)
    req: opts?.req,
    resHeaders: opts?.resHeaders,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
