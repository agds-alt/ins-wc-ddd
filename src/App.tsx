// src/App.tsx - COMPLETE ROUTER CONFIGURATION WITH AUTH GUARDS
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Auth Components
import { AdminRoute } from './components/admin/auth/AdminRoute';
import { ProtectedRoute } from './components/admin/auth/ProtectedRoute';

// Public Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPageUpdated } from './pages/RegisterPage';

// Main App Pages
import { DashboardEnhanced } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage'; // History page
import { ScanPage } from './pages/ScanPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LocationsManager } from './pages/admin/LocationsManager';
import { InspectionPage } from './pages/InspectionPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OccupationManagerPage } from './pages/admin/OccupationManagerPage';
// Add more admin pages as needed:
// import { UserManagementPage } from './pages/admin/UserManagementPage';
// import { LocationManagerPage } from './pages/admin/LocationManagerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPageUpdated />} />

          {/* ==================== PROTECTED USER ROUTES ==================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute>
                <LocationsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspect/:locationId"
            element={
              <ProtectedRoute>
                <InspectionPage />
              </ProtectedRoute>
            }
          />

          {/* ==================== ADMIN ROUTES ==================== */}
          {/* Main Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Occupation Management */}
          <Route
            path="/admin/occupations"
            element={
              <AdminRoute>
                <OccupationManagerPage />
              </AdminRoute>
            }
          />

          {/* User Management - Uncomment when created */}
          {/* <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          /> */}

          {/* Location Management - Uncomment when created */}
          {/* <Route
            path="/admin/locations"
            element={
              <AdminRoute>
                <LocationManagerPage />
              </AdminRoute>
            }
          /> */}

          {/* Organizations - Uncomment when created */}
          {/* <Route
            path="/admin/organizations"
            element={
              <AdminRoute>
                <OrganizationManagerPage />
              </AdminRoute>
            }
          /> */}

          {/* Templates - Uncomment when created */}
          {/* <Route
            path="/admin/templates"
            element={
              <AdminRoute>
                <TemplateManagerPage />
              </AdminRoute>
            }
          /> */}

          {/* Admin Reports - Uncomment when created */}
          {/* <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          /> */}

          {/* ==================== CATCH ALL / 404 ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster 
          position="top-center" 
          richColors 
          closeButton 
          duration={3000}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

/* ==================== ROUTE STRUCTURE OVERVIEW ====================

PUBLIC ROUTES (No auth required):
├─ /login                    → LoginPage
└─ /register                 → RegisterPage

PROTECTED USER ROUTES (Auth required):
├─ /                         → DashboardEnhanced (Home)
├─ /history                  → ReportsPage (Calendar view)
├─ /scan                     → ScanPage (QR Scanner)
├─ /analytics                → AnalyticsPage (Charts & metrics)
├─ /profile                  → ProfilePage (User profile + Admin button)
├─ /locations                → LocationsManager
└─ /inspect/:locationId      → InspectionPage

ADMIN ROUTES (Admin/Super Admin only):
├─ /admin                    → AdminDashboard (Main admin page)
├─ /admin/occupations        → OccupationManagerPage (CRUD occupations)
├─ /admin/users              → UserManagementPage (To be created)
├─ /admin/locations          → LocationManagerPage (To be created)
├─ /admin/organizations      → OrganizationManagerPage (To be created)
├─ /admin/templates          → TemplateManagerPage (To be created)
└─ /admin/reports            → AdminReportsPage (To be created)

BOTTOM NAVIGATION MAPPING:
[Home]      → /              (DashboardEnhanced)
[History]   → /history       (ReportsPage)
[Scan]      → /scan          (ScanPage) - Center FAB
[Analytics] → /analytics     (AnalyticsPage)
[Profile]   → /profile       (ProfilePage)

ADMIN ACCESS:
Profile → [Admin Dashboard] button → /admin → Choose admin function

================================================================== */