/**
 * Bottom Navigation Component
 * Modern floating QR button design inspired by Livin/Gojek
 * Optimized with memo and lazy loading
 */

'use client';

import { memo, useState, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, QrCode, BarChart3, User } from 'lucide-react';

// Lazy load Scanner for performance
const ScannerModal = lazy(() => import('./ScannerModal'));

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  isFloating?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Beranda', path: '/dashboard' },
  { icon: Calendar, label: 'Laporan', path: '/reports' },
  { icon: QrCode, label: 'Scan', path: '/scan', isFloating: true },
  { icon: BarChart3, label: 'Analitik', path: '/analytics' },
  { icon: User, label: 'Profil', path: '/profile' },
] as const;

function BottomNavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScanSuccess = (locationId: string) => {
    setScannerOpen(false);
    router.push(`/inspection/${locationId}`);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
        <div className="flex items-center justify-around relative px-2 pt-2 pb-2 max-w-2xl mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path ||
                            (item.path !== '/dashboard' && pathname.startsWith(item.path));

            // Floating Action Button
            if (item.isFloating) {
              return (
                <div key={item.path} className="flex-1 flex justify-center">
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="
                      w-14 h-14
                      bg-gradient-to-br from-blue-600 to-blue-500
                      rounded-full
                      flex items-center justify-center
                      text-white
                      shadow-lg shadow-blue-500/30
                      -mt-6
                      transition-transform duration-200
                      active:scale-90
                      hover:shadow-xl hover:from-blue-700 hover:to-blue-600
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    "
                    aria-label={item.label}
                    type="button"
                  >
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                  </button>
                </div>
              );
            }

            // Regular Nav Items
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 active:scale-95"
                type="button"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`relative transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <Icon
                    className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Scanner Modal - Lazy loaded */}
      {scannerOpen && (
        <Suspense fallback={null}>
          <ScannerModal
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onSuccess={handleScanSuccess}
          />
        </Suspense>
      )}
    </>
  );
}

// Memoized for performance
export const BottomNav = memo(BottomNavContent);
BottomNav.displayName = 'BottomNav';
