/**
 * User Management Page
 * Admin page to manage all users and their roles
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  User,
  Edit,
  X,
  Save,
} from 'lucide-react';

export default function UsersManagementPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: currentUser } = trpc.auth.me.useQuery();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      toast.error('Admin access required');
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // Fetch users
  const { data: users, isLoading } = trpc.user.list.useQuery({
    search: search || undefined,
    is_active: true,
    limit: 100,
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return null;
  }

  // Filter users by role on the client side
  const filteredUsers = users?.filter((user) => {
    if (!roleFilter) return true;
    if (roleFilter === 'superadmin') return user.role === 'super_admin';
    if (roleFilter === 'admin') return user.role === 'admin';
    if (roleFilter === 'user') return user.role === 'user' || !user.role;
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage users and assign roles</p>
      </div>

      {/* Filters */}
      <div className="container-elevated">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Users
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              onEdit={() => setEditingUser(user.id)}
            />
          ))}
        </div>
      ) : (
        <div className="container-elevated text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search || roleFilter
              ? 'No users found matching your filters'
              : 'No users found'}
          </p>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <EditUserRoleModal
          userId={editingUser}
          currentUser={currentUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            utils.user.list.invalidate();
          }}
        />
      )}
    </div>
  );
}

// User Card Component
function UserCard({
  user,
  currentUser,
  onEdit,
}: {
  user: any;
  currentUser: any;
  onEdit: () => void;
}) {
  const getRoleIcon = () => {
    if (user.role === 'super_admin') return <ShieldCheck className="w-5 h-5 text-purple-600" />;
    if (user.role === 'admin') return <Shield className="w-5 h-5 text-blue-600" />;
    return <User className="w-5 h-5 text-gray-600" />;
  };

  const getRoleName = () => {
    if (user.role === 'super_admin') return 'Super Admin';
    if (user.role === 'admin') return 'Admin';
    return 'User';
  };

  const getRoleBadgeColor = () => {
    if (user.role === 'super_admin') return 'bg-purple-100 text-purple-800';
    if (user.role === 'admin') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Super admins can edit any user
  // Regular admins can only edit non-admin users
  const canEdit = currentUser.isSuperAdmin || (user.role !== 'admin' && user.role !== 'super_admin');

  return (
    <div className="container-elevated hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{user.full_name || user.email}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
                {getRoleName()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Role Icon */}
          <div className="flex items-center gap-2">{getRoleIcon()}</div>
        </div>

        {/* Edit Button */}
        {canEdit && (
          <button
            onClick={onEdit}
            className="btn-secondary flex items-center gap-2 ml-4"
          >
            <Edit className="w-4 h-4" />
            Change Role
          </button>
        )}
      </div>
    </div>
  );
}

// Edit User Role Modal
function EditUserRoleModal({
  userId,
  currentUser,
  onClose,
  onSuccess,
}: {
  userId: string;
  currentUser: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: user } = trpc.user.getById.useQuery(userId);
  const [selectedRole, setSelectedRole] = useState<'superadmin' | 'admin' | 'user'>('user');

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') setSelectedRole('superadmin');
      else if (user.role === 'admin') setSelectedRole('admin');
      else setSelectedRole('user');
    }
  }, [user]);

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine role levels
    let isAdmin = false;
    let isSuperAdmin = false;

    if (selectedRole === 'superadmin') {
      isAdmin = true;
      isSuperAdmin = true;
    } else if (selectedRole === 'admin') {
      isAdmin = true;
      isSuperAdmin = false;
    }

    updateRole.mutate({
      userId,
      isAdmin,
      isSuperAdmin,
    });
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // Check permissions
  const canEditToSuperAdmin = currentUser.isSuperAdmin;
  const canEditToAdmin = currentUser.isSuperAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Change User Role</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            disabled={updateRole.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Info */}
          <div className="bg-secondary p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold">{user.full_name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Select Role</label>

            <div className="space-y-2">
              {/* User Role */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'user'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-border hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={selectedRole === 'user'}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="mt-1"
                  disabled={updateRole.isPending}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">User</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Can perform inspections and view reports
                  </p>
                </div>
              </label>

              {/* Admin Role */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'admin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-border hover:border-gray-300'
                } ${!canEditToAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="mt-1"
                  disabled={updateRole.isPending || !canEditToAdmin}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Can manage locations, buildings, and users
                  </p>
                </div>
              </label>

              {/* Super Admin Role */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'superadmin'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-border hover:border-gray-300'
                } ${!canEditToSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="superadmin"
                  checked={selectedRole === 'superadmin'}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="mt-1"
                  disabled={updateRole.isPending || !canEditToSuperAdmin}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-medium">Super Admin</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full system access including organization management
                  </p>
                </div>
              </label>
            </div>
          </div>

          {!canEditToSuperAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
              <p className="text-sm text-yellow-800">
                ⚠️ Only Super Admins can assign Super Admin or Admin roles
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={updateRole.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={updateRole.isPending}
            >
              {updateRole.isPending ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
