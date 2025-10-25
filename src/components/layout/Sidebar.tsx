// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  QrCode,
  MapPin,
  Calendar,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  FileCode,
  Bell,
  Droplets
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  badge?: number;
  adminOnly?: boolean;
}

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const mainNavItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'scan', label: 'Scan QR', icon: QrCode, path: '/scan' },
    { id: 'locations', label: 'Locations', icon: MapPin, path: '/locations' },
    { id: 'reports', label: 'Reports', icon: Calendar, path: '/reports' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin', label: 'Admin Panel', icon: Shield, path: '/admin', adminOnly: true },
    { id: 'qr-gen', label: 'QR Generator', icon: FileCode, path: '/admin/qr-generator', adminOnly: true },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavClick(item.path)}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'text-gray-700 hover:bg-gray-100',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className={clsx('flex-shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
        {!isCollapsed && (
          <>
            <span className="font-medium flex-1 text-left">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Backdrop Overlay (Mobile) */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-white shadow-xl z-50 flex flex-col transition-all duration-300',
          // Mobile: slide in from left
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: collapsible width
          isCollapsed ? 'lg:w-20' : 'lg:w-72',
          'w-72', // Mobile width
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">ToiletCheck</h1>
                  <p className="text-xs text-gray-500">Monitoring System</p>
                </div>
              </div>
            )}

            {/* Close/Collapse Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ChevronRight className={clsx(
                  'w-4 h-4 transition-transform',
                  isCollapsed && 'rotate-180'
                )} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className={clsx(
          'p-4 border-b border-gray-200',
          isCollapsed && 'p-2'
        )}>
          {isCollapsed ? (
            <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {profile?.full_name || 'User'}
                </h3>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main Menu
              </div>
            )}
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.id} item={item} />
            ))}
          </div>

          {/* Admin Section */}
          {adminNavItems.length > 0 && (
            <div className="mt-6 space-y-1">
              {!isCollapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin
                </div>
              )}
              {adminNavItems.map((item) => (
                <NavItemComponent key={item.id} item={item} />
              ))}
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className={clsx('p-4 border-t border-gray-200 space-y-2', isCollapsed && 'p-2')}>
          {/* Profile Button */}
          <button
            onClick={() => handleNavClick('/profile')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              'text-gray-700 hover:bg-gray-100',
              location.pathname === '/profile' && 'bg-gray-100',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Settings className={clsx('flex-shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              'text-red-600 hover:bg-red-50',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className={clsx('flex-shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for desktop layout */}
      <div className={clsx(
        'hidden lg:block flex-shrink-0 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-72'
      )} />
    </>
  );
};