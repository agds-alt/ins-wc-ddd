// src/App.tsx - FULL CODE
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import { ScanPage } from './pages/ScanPage';
import { InspectionPage } from './pages/InspectionPage';
import { LocationManager } from './components/admin/LocationManager';
import { ReportsPage } from './pages/ReportsPage';
import { TestPage } from './pages/TestPage';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { LocationInspectionPage } from './pages/LocationInspectionPage';
import './App.css';
import { useEffect } from 'react';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminRoute } from './components/auth/AdminRoute';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OccupationManagerPage } from './pages/admin/OccupationManagerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Shareable Location Page - Redirects to inspection
function ShareableLocationPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!locationId) {
      navigate('/scan');
      return;
    }

    if (user) {
      // User logged in → Go to inspection
      navigate(`/locations/${locationId}`, { replace: true });
    } else {
      // Not logged in → Go to login with redirect
      navigate(`/login?redirect=/locations/${locationId}`, { replace: true });
    }
  }, [user, locationId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading location...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes (No BottomNav) */}
      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/register" 
        element={!user ? <RegisterPage /> : <Navigate to="/" replace />} 
      />

      {/* Shareable Location Route (works for logged in & logged out) */}
      <Route 
        path="/locations/:locationId/share" 
        element={<ShareableLocationPage />} 
      />

      {/* Protected Routes (WITH BottomNav via ProtectedLayout) */}
      
      {/* ROOT PATH */}
      <Route 
        path="/" 
        element={
          user ? (
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Dashboard route */}
      <Route 
        path="/dashboard" 
        element={
          user ? (
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Scan Route */}
      <Route 
        path="/scan" 
        element={
          user ? (
            <ProtectedLayout>
              <ScanPage />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Location Inspection Route - NEW */}
      <Route 
        path="/locations/:locationId" 
        element={
          user ? (
            <ProtectedLayout>
              <LocationInspectionPage />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

       {/* Admin routes - Protected */}
  <Route 
    path="/admin" 
    element={
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    } 
  />
  <Route 
    path="/admin/occupations" 
    element={
      <AdminRoute>
        <OccupationManagerPage />
      </AdminRoute>
    } 
  />
  <Route 
    path="/admin/users" 
    element={
      <AdminRoute>
        <UserManagementPage />  {/* You'll create this */}
      </AdminRoute>
    } 
  />
  <Route 
    path="/admin/locations" 
    element={
      <AdminRoute>
        <LocationManagementPage />  {/* Existing or new */}
      </AdminRoute>
    } 
  />
</Routes>

      {/* Old Inspection Route (keep for compatibility) */}
      <Route 
        path="/inspect/:locationId" 
        element={
          user ? (
            <ProtectedLayout>
              <InspectionPage />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />



      {/* Reports Route */}
      <Route 
        path="/history" 
        element={
          user ? (
            <ProtectedLayout>
              <ReportsPage />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/analytics" 
        element={
          user ? (
            <ProtectedLayout>
              <AnalyticsPage />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Profile Route */}
      <Route 
        path="/profile" 
        element={
          user ? (
            <ProtectedLayout>
              <ProfilePage/>
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />


      {/* Analytics Route */}
      <Route 
        path="/analytics" 
        element={
          user ? (
            <ProtectedLayout>
              <div className="min-h-screen bg-gray-50 p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                <p className="text-gray-600">Analytics page coming soon...</p>
              </div>
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Development Routes */}
      {process.env.NODE_ENV === 'development' && (
        <Route path="/test-db" element={<TestPage />} />
      )}

      {/* 404 Not Found */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-gray-600 mb-4">Page not found</p>
              <a 
                href="/" 
                className="text-blue-600 hover:underline"
              >
                Back to Home
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
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
      </Router>
    </QueryClientProvider>
  );
}