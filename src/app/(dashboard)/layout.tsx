/**
 * Dashboard Layout
 * Protected layout with sidebar (reuses existing Sidebar component)
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isLoading && error) {
      // Not authenticated - redirect to login
      toast.error('Please login to continue');
      router.push('/login');
    }
  }, [isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">WC Check</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn-ghost p-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-40
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold">WC Check</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.fullName}
          </p>
        </div>

        <nav className="p-4 space-y-2">
          <NavLink href="/dashboard">
            Dashboard
          </NavLink>
          <NavLink href="/scan">
            Scan QR
          </NavLink>
          <NavLink href="/inspection">
            Inspections
          </NavLink>
          <NavLink href="/locations">
            Locations
          </NavLink>
          <NavLink href="/reports">
            Reports
          </NavLink>
          <NavLink href="/analytics">
            Analytics
          </NavLink>
          <NavLink href="/profile">
            Profile
          </NavLink>
          {user.isAdmin && (
            <NavLink href="/admin">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <LogoutButton />
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
    >
      <span>{children}</span>
    </a>
  );
}

function LogoutButton() {
  const router = useRouter();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success('Logged out successfully');
      router.push('/login');
    },
  });

  return (
    <button
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
      className="btn-ghost w-full"
    >
      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
    </button>
  );
}
