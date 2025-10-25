// src/pages/ProfilePageWithAdmin.tsx - Profile Page WITH Admin Button
// Copy this to replace existing ProfilePage.tsx

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Camera, 
  Edit2, 
  LogOut, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Settings,
  User as UserIcon,
  Shield // for admin button
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BottomNav } from '../components/mobile/BottomNav';
import { Card } from '../components/ui/Card';

interface UserStats {
  totalInspections: number;
  avgScore: number;
  currentStreak: number;
  bestLocation: {
    name: string;
    score: number;
  } | null;
}

export const ProfilePageWithAdmin = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Check if user is admin
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            name,
            level,
            display_name
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) return null;
      return data?.roles;
    },
    enabled: !!user?.id
  });

  const isAdmin = userRole?.level === 'admin' || userRole?.level === 'super_admin';

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: inspections, error } = await supabase
        .from('inspection_records')
        .select(`
          id,
          inspection_date,
          responses,
          locations (name)
        `)
        .eq('user_id', user.id)
        .order('inspection_date', { ascending: false });

      if (error) throw error;

      const calculateScore = (responses: any): number => {
        const values = Object.values(responses || {});
        if (values.length === 0) return 0;
        const goodCount = values.filter(v => 
          v === true || v === 'good' || v === 'excellent' || 
          v === 'baik' || v === 'bersih' || v === 'ada'
        ).length;
        return Math.round((goodCount / values.length) * 100);
      };

      const totalInspections = inspections?.length || 0;
      const avgScore = totalInspections > 0
        ? Math.round(inspections!.reduce((sum, i) => sum + calculateScore(i.responses), 0) / totalInspections)
        : 0;

      let currentStreak = 0;
      if (inspections && inspections.length > 0) {
        const dates = [...new Set(inspections.map(i => i.inspection_date))].sort().reverse();
        
        for (let i = 0; i < dates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];
          
          if (dates[i] === expectedDateStr) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      const locationMap = new Map<string, { scores: number[]; name: string }>();
      inspections?.forEach(insp => {
        if (!insp.locations) return;
        const locName = insp.locations.name;
        const score = calculateScore(insp.responses);
        
        if (!locationMap.has(locName)) {
          locationMap.set(locName, { scores: [], name: locName });
        }
        locationMap.get(locName)!.scores.push(score);
      });

      let bestLocation = null;
      let bestScore = 0;
      locationMap.forEach((data) => {
        const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestLocation = { name: data.name, score: avgScore };
        }
      });

      return {
        totalInspections,
        avgScore,
        currentStreak,
        bestLocation
      };
    },
    enabled: !!user?.id
  });

  // Fetch occupation
  const { data: occupation } = useQuery({
    queryKey: ['user-occupation', profile?.occupation_id],
    queryFn: async () => {
      if (!profile?.occupation_id) return null;
      
      const { data, error } = await supabase
        .from('user_occupations')
        .select('*')
        .eq('id', profile.occupation_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.occupation_id
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append('folder', 'profile-photos');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const photoUrl = data.secure_url;

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo_url: photoUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return photoUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile photo updated!');
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    }
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG, or WebP)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadPhotoMutation.mutateAsync(file);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to logout?');
    if (confirm) {
      await signOut();
      navigate('/login');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 pt-12 pb-24 px-6">
        <div className="flex items-center justify-between text-white mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-16">
        <Card className="relative">
          {/* Profile Photo */}
          <div className="flex justify-center -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                {profile.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {profile.full_name}
            </h2>
            
            {occupation && (
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium mb-2"
                style={{ backgroundColor: occupation.color || '#6B7280' }}
              >
                <span className="text-lg">{occupation.icon}</span>
                <span>{occupation.display_name}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>{userRole?.display_name || 'Member'}</span>
              </div>
              {isAdmin && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full text-sm text-purple-600">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{profile.email}</div>
              </div>
            </div>

            {profile.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900">{profile.phone}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">Member Since</div>
                <div className="font-medium text-gray-900">
                  {format(new Date(profile.created_at!), 'dd MMM yyyy')}
                </div>
              </div>
            </div>

            {profile.last_login_at && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Last Login</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(profile.last_login_at), 'dd MMM yyyy, HH:mm')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Your Statistics</h3>
          
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats?.totalInspections || 0}</div>
                    <div className="text-xs text-gray-500">Inspections</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats?.avgScore || 0}</div>
                    <div className="text-xs text-gray-500">Avg Score</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats?.currentStreak || 0}</div>
                    <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {stats?.bestLocation ? (
                      <>
                        <div className="text-lg font-bold text-gray-900">{stats.bestLocation.score}</div>
                        <div className="text-xs text-gray-500 truncate">{stats.bestLocation.name}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">No data yet</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {/* Admin Panel Button - Only for Admins */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Shield className="w-5 h-5" />
              <span>Admin Dashboard</span>
            </button>
          )}

          <button
            onClick={() => navigate('/edit-profile')}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-2xl font-medium text-gray-900 hover:bg-gray-50 transition-colors active:scale-95"
          >
            <Edit2 className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-2xl font-medium text-red-600 hover:bg-red-100 transition-colors active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};