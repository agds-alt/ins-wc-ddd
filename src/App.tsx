// src/App.tsx - UPDATED: Added shareable location route
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { ScanPage } from './pages/ScanPage';
import { InspectionPage } from './pages/InspectionPage';
import { LocationManager } from './components/admin/LocationManager';
import { TestPage } from './pages/TestPage';
import './App.css';
import { useEffect } from 'react';
import { ReportsPage } from './pages/ReportsPage';

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
      navigate(`/inspect/${locationId}`, { replace: true });
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
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/register" 
        element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Shareable Location Route (works for logged in & logged out) */}
      <Route 
        path="/locations/:locationId" 
        element={<ShareableLocationPage />} 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/scan" 
        element={user ? <ScanPage /> : <Navigate to="/login" replace />} 
      />

          
      <Route 
        path="/reports" 
        element={user ? <ReportsPage /> : <Navigate to="/reports" replace />} 
      />

      <Route 
        path="/inspect/:locationId" 
        element={user ? <InspectionPage /> : <Navigate to="/login" replace />} 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/locations" 
        element={user ? <LocationManager /> : <Navigate to="/login" replace />} 
      />

      {/* Development Routes */}
      {process.env.NODE_ENV === 'development' && (
        <Route path="/test-db" element={<TestPage />} />
      )}

      {/* Default Redirect */}
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
      />

      {/* 404 Not Found */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-gray-600 mb-4">Page not found</p>
              <a 
                href="/dashboard" 
                className="text-blue-600 hover:underline"
              >
                Back to Dashboard
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