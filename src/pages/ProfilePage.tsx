// src/pages/ProfilePage.tsx - WITH COMPLETE USER INFO
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  Mail,
  Calendar,
  Clock,
  User as UserIcon,
  Menu,
  Phone,
  Briefcase,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';

export const ProfilePage = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch occupation details
  const { data: occupation } = useQuery({
    queryKey: ['occupation', profile?.occupation_id],
    queryFn: async () => {
      if (!profile?.occupation_id) return null;

      const { data, error } = await supabase
        .from('user_occupations')
        .select('*')
        .eq('id', profile.occupation_id)
        .single();

      if (error) {
        console.error('Error fetching occupation:', error);
        return null;
      }

      return data;
    },
    enabled: !!profile?.occupation_id,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  const handleLogout = async () => {
    const confirm = window.confirm('Apakah Anda yakin ingin keluar?');
    if (confirm) {
      await signOut();
      navigate('/login');
    }
  };

  // Show loading while auth or profile loads
  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  // Safe date formatting
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Simple Header - White */}
      <div className="bg-white pt-12 pb-8 px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Profil</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-6">
          {/* Profile Photo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {profile.full_name || 'User'}
            </h2>

            {/* Role Badge */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {isAdmin ? (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-full text-sm text-purple-700 font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Administrator</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium">
                  <UserIcon className="w-4 h-4" />
                  <span>Pengguna</span>
                </div>
              )}

              {/* Account Status */}
              {profile.is_active ? (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Aktif</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 font-medium">
                  <XCircle className="w-3 h-3" />
                  <span>Tidak Aktif</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{profile.email || 'N/A'}</div>
              </div>
            </div>

            {/* Phone */}
            {profile.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Nomor Telepon</div>
                  <div className="font-medium text-gray-900">{profile.phone}</div>
                </div>
              </div>
            )}

            {/* Occupation/Jabatan */}
            {occupation && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Briefcase
                  className="w-5 h-5"
                  style={{ color: occupation.color || '#6b7280' }}
                />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Jabatan</div>
                  <div className="font-medium text-gray-900">
                    {occupation.display_name}
                  </div>
                  {occupation.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {occupation.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">Bergabung Sejak</div>
                <div className="font-medium text-gray-900">
                  {formatDate(profile.created_at)}
                </div>
              </div>
            </div>

            {/* Last Login */}
            {profile.last_login_at && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Login Terakhir</div>
                  <div className="font-medium text-gray-900">
                    {formatDateTime(profile.last_login_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button - Simple */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 rounded-2xl font-medium text-red-600 active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
