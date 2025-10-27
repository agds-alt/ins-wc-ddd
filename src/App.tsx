// src/App.tsx - FIXED: Handle named exports for lazy loading
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import { useAuth } from './hooks/useAuth';
import { logger } from './lib/logger';
import './App.css';

// EAGER LOAD: Critical pages (login flow)
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// LAZY LOAD: Heavy pages loaded on-demand
// FIX: Handle named exports by mapping to default
const Dashboard = lazy(() => 
  import('./pages/Dashboard').then(module => ({ default: module.Dashboard }))
);
const ScanPage = lazy(() => 
  import('./pages/ScanPage').then(module => ({ default: module.ScanPage }))
);
const InspectionPage = lazy(() => 
  import('./pages/InspectionPage').then(module => ({ default: module.InspectionPage }))
);
const ReportsPage = lazy(() => 
  import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage }))
);
const AnalyticsPage = lazy(() => 
  import('./pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage }))
);
const ProfilePage = lazy(() => 
  import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage }))
);
const LocationsListPage = lazy(() =>
  import('./pages/LocationsListPage').then(module => ({ default: module.LocationsListPage }))
);
const LocationsManager = lazy(() =>
  import('./pages/admin/LocationsManager').then(module => ({ default: module.LocationsManager }))
);
const AdminDashboard = lazy(() => 
  import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);
const QRCodeGenerator = lazy(() => 
  import('./pages/admin/QRCodeGenerator').then(module => ({ default: module.QRCodeGenerator }))
);

// QueryClient with logging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error: any) => {
        logger.error('React Query error', error);
      },
    },
    mutations: {
      retry: 0,
      onError: (error: any) => {
        logger.error('React Query mutation error', error);
      },
    },
  },
});

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Auth loading component
const AuthLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Checking authentication...</p>
    </div>
  </div>
);

// 404 Page
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-600 mb-4">Page not found</p>
      <a 
        href="/" 
        className="text-blue-600 hover:underline font-medium"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
);

function AppContent() {
  const { user } = useAuth();

  // ✅ DON'T block - show pages immediately
  // Auth check happens in background

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <RegisterPage /> : <Navigate to="/" replace />} 
        />

        {/* Protected Routes - Main */}
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/scan" 
          element={user ? <ScanPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/inspect/:locationId" 
          element={user ? <InspectionPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/reports" 
          element={user ? <ReportsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/history" 
          element={user ? <ReportsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/analytics" 
          element={user ? <AnalyticsPage /> : <Navigate to="/login" replace />} 
        />
        <Route
          path="/locations"
          element={user ? <LocationsListPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/locations"
          element={user ? <LocationsManager /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/profile" 
          element={user ? <ProfilePage /> : <Navigate to="/login" replace />} 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={user ? <AdminDashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin/QRCodeGenerator" 
          element={user ? <QRCodeGenerator /> : <Navigate to="/login" replace />} 
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  // Log app initialization
  logger.info('App initialized', {
    env: import.meta.env.MODE,
    version: '1.0.0',
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <AppContent />
          <DebugPanel />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}