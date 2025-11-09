/**
 * Buildings Management Page
 * Admin page to manage all buildings
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
} from 'lucide-react';

export default function BuildingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();

  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast.error('Admin access required');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch buildings
  const { data: buildings, isLoading } = trpc.building.list.useQuery({
    search: search || undefined,
    organization_id: selectedOrg || undefined,
    is_active: true,
  });

  // Fetch organizations for filter/create
  const { data: organizations } = trpc.organization.list.useQuery({
    is_active: true,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user.isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buildings Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all buildings in the system
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Building
        </button>
      </div>

      {/* Filters */}
      <div className="container-elevated">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Buildings
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Filter by Organization
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="input-field"
            >
              <option value="">All Organizations</option>
              {organizations?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : buildings && buildings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              onEdit={() => setEditingBuilding(building.id)}
              onRefresh={() => utils.building.list.invalidate()}
            />
          ))}
        </div>
      ) : (
        <div className="container-elevated text-center py-12">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search || selectedOrg
              ? 'No buildings found matching your filters'
              : 'No buildings found. Create your first building to get started.'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateBuildingModal
          organizations={organizations || []}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            utils.building.list.invalidate();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingBuilding && (
        <EditBuildingModal
          buildingId={editingBuilding}
          onClose={() => setEditingBuilding(null)}
          onSuccess={() => {
            setEditingBuilding(null);
            utils.building.list.invalidate();
          }}
        />
      )}
    </div>
  );
}

// Building Card Component
function BuildingCard({
  building,
  onEdit,
  onRefresh,
}: {
  building: any;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const deleteBuilding = trpc.building.delete.useMutation({
    onSuccess: () => {
      toast.success('Building deleted successfully');
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete building');
    },
  });

  const handleDelete = () => {
    if (
      confirm(`Are you sure you want to delete "${building.name}"? This action cannot be undone.`)
    ) {
      deleteBuilding.mutate(building.id);
    }
  };

  return (
    <div className="container-elevated hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{building.name}</h3>
            <code className="text-xs bg-secondary px-2 py-1 rounded">{building.short_code}</code>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-1 mb-4">
        {building.organization_name && <p>Org: {building.organization_name}</p>}
        {building.address && <p>📍 {building.address}</p>}
        {building.type && <p>Type: {building.type}</p>}
        {building.total_floors && <p>Floors: {building.total_floors}</p>}
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
          disabled={deleteBuilding.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Create Building Modal
function CreateBuildingModal({
  organizations,
  onClose,
  onSuccess,
}: {
  organizations: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    short_code: '',
    organization_id: '',
    address: '',
    type: '',
    total_floors: '',
  });

  const createBuilding = trpc.building.create.useMutation({
    onSuccess: () => {
      toast.success('Building created successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create building');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Building name is required');
      return;
    }
    if (!formData.short_code.trim()) {
      toast.error('Short code is required');
      return;
    }
    if (!formData.organization_id) {
      toast.error('Organization is required');
      return;
    }

    createBuilding.mutate({
      name: formData.name.trim(),
      short_code: formData.short_code.trim().toUpperCase(),
      organization_id: formData.organization_id,
      address: formData.address.trim() || undefined,
      type: formData.type.trim() || undefined,
      total_floors: formData.total_floors ? parseInt(formData.total_floors) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Building</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            disabled={createBuilding.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Building Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Office Building"
              className="input-field"
              required
              disabled={createBuilding.isPending}
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
              placeholder="e.g., BLDG01"
              className="input-field"
              required
              disabled={createBuilding.isPending}
              maxLength={10}
              pattern="[A-Z0-9]{2,10}"
              title="Use 2-10 uppercase letters and numbers only"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use uppercase letters and numbers only (e.g., BLDG01, MAIN, HQ)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Organization *</label>
            <select
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              className="input-field"
              required
              disabled={createBuilding.isPending}
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Main St"
              className="input-field"
              disabled={createBuilding.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="e.g., Office, Residential"
              className="input-field"
              disabled={createBuilding.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Total Floors</label>
            <input
              type="number"
              value={formData.total_floors}
              onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
              placeholder="e.g., 10"
              className="input-field"
              min="1"
              disabled={createBuilding.isPending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={createBuilding.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={createBuilding.isPending}
            >
              {createBuilding.isPending ? (
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

// Edit Building Modal (similar to Create, but with pre-filled data)
function EditBuildingModal({
  buildingId,
  onClose,
  onSuccess,
}: {
  buildingId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: building } = trpc.building.getById.useQuery(buildingId);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: '',
    total_floors: '',
  });

  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name || '',
        address: building.address || '',
        type: building.type || '',
        total_floors: building.total_floors?.toString() || '',
      });
    }
  }, [building]);

  const updateBuilding = trpc.building.update.useMutation({
    onSuccess: () => {
      toast.success('Building updated successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update building');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateBuilding.mutate({
      id: buildingId,
      name: formData.name.trim() || undefined,
      address: formData.address.trim() || undefined,
      type: formData.type.trim() || undefined,
      total_floors: formData.total_floors ? parseInt(formData.total_floors) : undefined,
    });
  };

  if (!building) {
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
          <h2 className="text-xl font-bold">Edit Building</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            disabled={updateBuilding.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Building Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              disabled={updateBuilding.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              disabled={updateBuilding.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-field"
              disabled={updateBuilding.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Total Floors</label>
            <input
              type="number"
              value={formData.total_floors}
              onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
              className="input-field"
              min="1"
              disabled={updateBuilding.isPending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={updateBuilding.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={updateBuilding.isPending}
            >
              {updateBuilding.isPending ? (
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
