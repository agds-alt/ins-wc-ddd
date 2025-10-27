// src/pages/ProfilePage.tsx - SIMPLIFIED
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LogOut,
  Mail,
  Calendar,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { BottomNav } from '../components/mobile/BottomNav';

export const ProfilePage = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to logout?');
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
          <p className="text-gray-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Simple Header - White */}
      <div className="bg-white pt-12 pb-8 px-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
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
              {profile.full_name}
            </h2>

            {/* Role Badge */}
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span>Member</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{profile.email}</div>
              </div>
            </div>

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
        </div>

        {/* Action Button - Simple */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 rounded-2xl font-medium text-red-600 active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
