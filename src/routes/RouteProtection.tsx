// src/routes/ProtectedRoute.tsx
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export const AdminRoute = ({ children }) => {
  const { profile, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  // Check if user is admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};