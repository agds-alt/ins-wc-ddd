/**
 * User Profile Page
 */

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { data: user, refetch } = trpc.auth.me.useQuery();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleEdit = () => {
    if (user) {
      setFormData({
        full_name: user.fullName,
        phone: user.phone || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Info */}
      <div className="container-elevated">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          {!isEditing && (
            <button onClick={handleEdit} className="btn-ghost">
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="btn-primary"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-sm text-muted-foreground">Full Name</div>
                <div className="font-medium mt-1">{user.fullName}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium mt-1">{user.email}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium mt-1">
                  {user.phone || 'Not set'}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium mt-1">
                  {user.isAdmin ? (
                    <span className="badge badge-info">Admin</span>
                  ) : (
                    <span className="badge">User</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Last Login
                </div>
                <div className="font-medium mt-1">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : 'Never'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account Stats */}
      <div className="container-elevated">
        <h2 className="text-xl font-semibold mb-4">Your Activity</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-muted-foreground mt-1">
              Inspections
            </div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-2xl font-bold">
              {user.createdAt
                ? Math.floor(
                    (Date.now() - new Date(user.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Days Active
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="container-elevated">
        <h2 className="text-xl font-semibold mb-4">Security</h2>

        <button className="btn-ghost">Change Password</button>
      </div>
    </div>
  );
}
