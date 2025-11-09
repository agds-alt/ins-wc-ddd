/**
 * Organizations Management Page
 * Super Admin page to manage all organizations
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
} from 'lucide-react';

export default function OrganizationsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();

  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);

  // Redirect if not super admin
  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      toast.error('Super Admin access required');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch organizations
  const { data: organizations, isLoading } = trpc.organization.list.useQuery({
    search: search || undefined,
    is_active: true,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user.isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all organizations (Super Admin Only)
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="container-elevated">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Organizations
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="input-field"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : organizations && organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onEdit={() => setEditingOrg(org.id)}
              onRefresh={() => utils.organization.list.invalidate()}
            />
          ))}
        </div>
      ) : (
        <div className="container-elevated text-center py-12">
          <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search
              ? 'No organizations found matching your search'
              : 'No organizations found. Create your first organization to get started.'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateOrganizationModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            utils.organization.list.invalidate();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingOrg && (
        <EditOrganizationModal
          organizationId={editingOrg}
          onClose={() => setEditingOrg(null)}
          onSuccess={() => {
            setEditingOrg(null);
            utils.organization.list.invalidate();
          }}
        />
      )}
    </div>
  );
}

// Organization Card Component
function OrganizationCard({
  organization,
  onEdit,
  onRefresh,
}: {
  organization: any;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const deleteOrg = trpc.organization.delete.useMutation({
    onSuccess: () => {
      toast.success('Organization deleted successfully');
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete organization');
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${organization.name}"? This will also delete all associated buildings and locations. This action cannot be undone.`
      )
    ) {
      deleteOrg.mutate(organization.id);
    }
  };

  return (
    <div className="container-elevated hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Building className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{organization.name}</h3>
            <code className="text-xs bg-secondary px-2 py-1 rounded">
              {organization.short_code}
            </code>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-1 mb-4">
        {organization.email && <p>📧 {organization.email}</p>}
        {organization.phone && <p>📞 {organization.phone}</p>}
        {organization.address && <p>📍 {organization.address}</p>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="btn-secondary flex items-center justify-center p-2 text-destructive hover:bg-destructive/10"
          disabled={deleteOrg.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Create Organization Modal
function CreateOrganizationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    short_code: '',
    email: '',
    phone: '',
    address: '',
  });

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: () => {
      toast.success('Organization created successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return;
    }
    if (!formData.short_code.trim()) {
      toast.error('Short code is required');
      return;
    }

    createOrg.mutate({
      name: formData.name.trim(),
      short_code: formData.short_code.trim().toUpperCase(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Organization</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            disabled={createOrg.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., ABC Company"
              className="input-field"
              required
              disabled={createOrg.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Short Code *</label>
            <input
              type="text"
              value={formData.short_code}
              onChange={(e) =>
                setFormData({ ...formData, short_code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., ABC"
              className="input-field"
              required
              disabled={createOrg.isPending}
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., contact@abc.com"
              className="input-field"
              disabled={createOrg.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., +1234567890"
              className="input-field"
              disabled={createOrg.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address..."
              className="input-field min-h-[80px]"
              disabled={createOrg.isPending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={createOrg.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={createOrg.isPending}
            >
              {createOrg.isPending ? (
                <>
                  <div className="spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Organization Modal
function EditOrganizationModal({
  organizationId,
  onClose,
  onSuccess,
}: {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: organization } = trpc.organization.getById.useQuery(organizationId);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
      });
    }
  }, [organization]);

  const updateOrg = trpc.organization.update.useMutation({
    onSuccess: () => {
      toast.success('Organization updated successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update organization');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateOrg.mutate({
      id: organizationId,
      name: formData.name.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
    });
  };

  if (!organization) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Organization</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            disabled={updateOrg.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              disabled={updateOrg.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              disabled={updateOrg.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              disabled={updateOrg.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field min-h-[80px]"
              disabled={updateOrg.isPending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={updateOrg.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={updateOrg.isPending}
            >
              {updateOrg.isPending ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
