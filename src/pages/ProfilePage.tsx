// src/pages/ProfilePage.tsx - WITH COMPLETE USER INFO & EDIT FUNCTIONALITY
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
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
  Edit2,
  Save,
  X as XIcon,
} from 'lucide-react';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';

export const ProfilePage = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    occupation_id: profile?.occupation_id || '',
  });

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

  // Fetch all occupations for dropdown
  const { data: allOccupations } = useQuery({
    queryKey: ['all-occupations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_occupations')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Error fetching occupations:', error);
        return [];
      }

      return data;
    },
    staleTime: 10 * 60 * 1000, // Cache 10 minutes
  });

  // Sync form with profile data when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        occupation_id: profile.occupation_id || '',
      });
    }
  }, [profile]);

  // Handle edit mode
  const handleEditClick = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      occupation_id: profile?.occupation_id || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      occupation_id: profile?.occupation_id || '',
    });
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validation
    if (!editForm.full_name.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }

    setIsSaving(true);
    toast.loading('Menyimpan perubahan...');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim() || null,
          occupation_id: editForm.occupation_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate queries to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['occupation'] });

      toast.dismiss();
      toast.success('✅ Profil berhasil diperbarui!');
      setIsEditing(false);

      // Force page reload to get fresh data from useAuth
      window.location.reload();
    } catch (error: any) {
      toast.dismiss();
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
            {!isEditing ? (
              <>
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
              </>
            ) : (
              <div className="text-sm text-gray-600">
                Edit informasi profil Anda
              </div>
            )}
          </div>

          {/* Contact Info / Edit Form */}
          {!isEditing ? (
            <>
              {/* Read-only view */}
              <div className="space-y-3 mb-6">
                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{profile.email || 'N/A'}</div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Nomor Telepon</div>
                    <div className="font-medium text-gray-900">{profile.phone || 'Belum diisi'}</div>
                  </div>
                </div>

                {/* Occupation/Jabatan */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Briefcase
                    className="w-5 h-5"
                    style={{ color: occupation?.color || '#6b7280' }}
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Jabatan</div>
                    <div className="font-medium text-gray-900">
                      {occupation?.display_name || 'Belum diisi'}
                    </div>
                    {occupation?.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {occupation.description}
                      </div>
                    )}
                  </div>
                </div>

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

              {/* Edit Button */}
              <button
                onClick={handleEditClick}
                className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 active:translate-y-1 transition-all shadow-lg"
              >
                <Edit2 className="w-5 h-5" />
                <span>Edit Profil</span>
              </button>
            </>
          ) : (
            <>
              {/* Edit Form */}
              <div className="space-y-4 mb-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Masukkan nama lengkap"
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Contoh: 081234567890"
                    disabled={isSaving}
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jabatan
                  </label>
                  <select
                    value={editForm.occupation_id}
                    onChange={(e) => setEditForm({ ...editForm, occupation_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSaving}
                  >
                    <option value="">Pilih Jabatan</option>
                    {allOccupations?.map((occ) => (
                      <option key={occ.id} value={occ.id}>
                        {occ.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:translate-y-1 transition-all disabled:opacity-50"
                >
                  <XIcon className="w-5 h-5" />
                  <span>Batal</span>
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 active:translate-y-1 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        {!isEditing && (
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 rounded-2xl font-medium text-red-600 active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
