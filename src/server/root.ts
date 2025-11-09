/**
 * Root tRPC Router
 * Combines all routers into single API
 */

import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { inspectionRouter } from './routers/inspection';
import { locationRouter } from './routers/location';
import { buildingRouter } from './routers/building';
import { organizationRouter } from './routers/organization';
import { qrcodeRouter } from './routers/qrcode';
import { reportRouter } from './routers/report';
import { adminRouter } from './routers/admin';
import { auditRouter } from './routers/audit';
import { templateRouter } from './routers/template';

/**
 * App Router
 * Main tRPC router with all sub-routers
 */
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  inspection: inspectionRouter,
  location: locationRouter,
  building: buildingRouter,
  organization: organizationRouter,
  qrcode: qrcodeRouter,
  report: reportRouter,
  admin: adminRouter,
  audit: auditRouter,
  template: templateRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
