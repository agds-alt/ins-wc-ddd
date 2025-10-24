// src/components/layout/ProtectedLayout.tsx
import { ReactNode } from 'react';
import { BottomNav } from '../mobile/BottomNav';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};