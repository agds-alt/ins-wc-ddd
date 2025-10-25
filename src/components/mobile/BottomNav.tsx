// src/components/mobile/BottomNavFixed.tsx - Fixed Bottom Navigation
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, QrCode, BarChart3, User } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  id: string;
  icon: typeof Home;
  label: string;
  path: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { 
    id: 'home', 
    icon: Home, 
    label: 'Home', 
    path: '/' 
  },
  { 
    id: 'history', 
    icon: Calendar, 
    label: 'History', 
    path: '/history' 
  },
  { 
    id: 'scan', 
    icon: QrCode, 
    label: 'Scan', 
    path: '/scan', 
    isCenter: true 
  },
  { 
    id: 'analytics', 
    icon: BarChart3, 
    label: 'Analytics', 
    path: '/analytics' 
  },
  { 
    id: 'profile', 
    icon: User, 
    label: 'Profile', 
    path: '/profile' 
  },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around relative px-2 pt-2 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));

          // Center Floating Action Button (FAB)
          if (item.isCenter) {
            return (
              <div key={item.id} className="flex-1 flex justify-center">
                <button
                  onClick={() => navigate(item.path)}
                  className="
                    w-14 h-14 
                    bg-gradient-to-br from-blue-600 to-blue-400
                    rounded-full 
                    flex items-center justify-center 
                    text-white 
                    shadow-lg shadow-blue-600/30
                    -mt-6
                    transition-all duration-200
                    active:scale-90
                    hover:shadow-xl hover:shadow-blue-600/40
                  "
                  aria-label={item.label}
                >
                  <Icon className="w-7 h-7" strokeWidth={2.5} />
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
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              )}
              aria-label={item.label}
            >
              <div className={clsx(
                'relative',
                isActive && 'scale-110'
              )}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Active Dot Indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
              
              <span className={clsx(
                'text-[11px] font-medium',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Alternative: Minimal Bottom Nav (tanpa FAB, semua flat)
export const BottomNavMinimal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const minimalItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'History', path: '/history' },
    { icon: QrCode, label: 'Scan', path: '/scan' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-1">
        {minimalItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-w-[60px]',
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Livin-style Bottom Nav (dengan background gradient pada active item)
export const BottomNavLivin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const livinItems = [
    { icon: Home, label: 'Beranda', path: '/' },
    { icon: Calendar, label: 'Riwayat', path: '/history' },
    { icon: QrCode, label: 'Scan', path: '/scan', isCenter: true },
    { icon: BarChart3, label: 'Laporan', path: '/analytics' },
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 safe-area-bottom">
      <div className="flex items-center justify-around relative h-16 px-2">
        {livinItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          // Center FAB ala Livin
          if (item.isCenter) {
            return (
              <div key={index} className="flex-1 flex justify-center">
                <button
                  onClick={() => navigate(item.path)}
                  className="
                    w-16 h-16 
                    bg-gradient-to-br from-cyan-500 to-blue-600
                    rounded-full 
                    flex items-center justify-center 
                    text-white 
                    shadow-2xl shadow-blue-500/40
                    -mt-8
                    border-4 border-white
                    transition-transform duration-200
                    active:scale-90
                  "
                >
                  <Icon className="w-8 h-8" strokeWidth={2.5} />
                </button>
                <span className="absolute bottom-1 text-[10px] font-medium text-gray-600">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
            >
              <div className={clsx(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all',
                isActive && 'bg-gradient-to-br from-blue-50 to-cyan-50'
              )}>
                <Icon 
                  className={clsx(
                    'w-6 h-6 transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  )} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={clsx(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;