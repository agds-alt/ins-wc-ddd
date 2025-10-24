// src/components/mobile/BottomNav.tsx - UPDATED WITH REPORTS
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, QrCode, MapPin, User } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  id: string;
  icon: typeof Home;
  label: string;
  path: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },              // ← Changed to '/'
  { id: 'reports', icon: Calendar, label: 'Reports', path: '/reports' }, // ← NEW!
  { id: 'scan', icon: QrCode, label: 'Scan', path: '/scan', isCenter: true },
  { id: 'locations', icon: MapPin, label: 'Locations', path: '/locations' },
  { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          // Center Floating Action Button (FAB)
          if (item.isCenter) {
            return (
              <div key={item.id} className="flex-1 flex justify-center">
                <button
                  onClick={() => navigate(item.path)}
                  className="bottom-nav-fab"
                  aria-label={item.label}
                >
                  <Icon className="w-7 h-7" />
                </button>
              </div>
            );
          }

          // Regular Nav Items
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={clsx(
                'bottom-nav-item flex-1',
                isActive && 'active'
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Alternative: Compact Bottom Nav (without FAB)
export const CompactBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const compactItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Reports', path: '/reports' },
    { icon: QrCode, label: 'Scan', path: '/scan' },
    { icon: MapPin, label: 'Locations', path: '/locations' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex items-center justify-around py-2">
        {compactItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px]',
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};