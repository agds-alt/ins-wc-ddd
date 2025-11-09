// src/components/mobile/Navbar.tsx
import { QrCode, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onScanClick?: () => void;
  showScanButton?: boolean;
}

export const Navbar = ({ onScanClick, showScanButton = true }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleProfileClick = () => {
    // TODO: Navigate to profile page when ready
    console.log('Profile clicked');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 safe-area-top">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">🚽</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ToiletCheck</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {showScanButton && onScanClick && (
            <button 
              onClick={onScanClick}
              className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
          
          {user && (
            <div className="relative group">
              <button 
                onClick={handleProfileClick}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Dropdown menu (hover) */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};