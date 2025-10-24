// src/components/layout/ProtectedLayout.tsx
import { useLocation } from 'react-router-dom';
import { BottomNav } from '../mobile/BottomNav';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const location = useLocation();
  
  // Hide bottom nav di semua halaman inspection
  const showBottomNav = !(
    location.pathname.includes('/inspect/') || 
    location.pathname.includes('/locations/') && 
    !location.pathname.includes('/admin/')
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-auto safe-area-top">
        {children}
      </main>
      
      {/* Bottom Navigation - Conditional Render */}
      {showBottomNav && <BottomNav />}
    </div>
  );
};