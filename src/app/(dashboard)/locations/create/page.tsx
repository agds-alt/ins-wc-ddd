/**
 * Create Location Page
 * Add new toilet location (Admin only)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, MapPin } from 'lucide-react';

export default function CreateLocationPage() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();

  const [formData, setFormData] = useState({
    organization_id: '',
    building_id: '',
    name: '',
    code: '',
    floor: '',
    area: '',
    section: '',
    description: '',
  });

  // Fetch organizations
  const { data: organizations } = trpc.organization.list.useQuery({
    is_active: true,
  });

  // Fetch buildings filtered by organization
  const { data: buildings, isLoading: loadingBuildings } = trpc.building.list.useQuery(
    {
      organization_id: formData.organization_id || undefined,
      is_active: true,
    },
    {
      enabled: !!formData.organization_id,
    }
  );

  // Create location mutation
  const createLocation = trpc.location.create.useMutation({
    onSuccess: () => {
      toast.success('Location created successfully!');
      router.push('/locations');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create location');
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast.error('Admin access required');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      // Reset building when organization changes
      if (field === 'organization_id') {
        return { ...prev, [field]: value, building_id: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.organization_id) {
      toast.error('Please select an organization');
      return;
    }
    if (!formData.building_id) {
      toast.error('Please select a building');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    createLocation.mutate({
      name: formData.name.trim(),
      organization_id: formData.organization_id,
      building_id: formData.building_id,
      code: formData.code.trim() || undefined,
      floor: formData.floor.trim() || undefined,
      area: formData.area.trim() || undefined,
      section: formData.section.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
  };

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
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Add Location</h1>
          <p className="text-muted-foreground mt-1">
            Create new inspection point
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Selection */}
        <div className="container-elevated">
          <h2 className="text-lg font-semibold mb-4">Organization & Building</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Organization *
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) => handleChange('organization_id', e.target.value)}
                className="input-field"
                required
                disabled={createLocation.isPending}
              >
                <option value="">Select Organization</option>
                {organizations?.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.short_code})
                  </option>
                ))}
              </select>
              {organizations?.length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  No organizations found. Please contact admin.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Building *
              </label>
              <select
                value={formData.building_id}
                onChange={(e) => handleChange('building_id', e.target.value)}
                className="input-field"
                required
                disabled={!formData.organization_id || loadingBuildings || createLocation.isPending}
              >
                <option value="">
                  {!formData.organization_id
                    ? 'Select organization first'
                    : loadingBuildings
                    ? 'Loading buildings...'
                    : 'Select Building'}
                </option>
                {buildings?.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name} ({building.short_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="container-elevated">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Ground Floor Main Toilet"
                className="input-field"
                required
                disabled={createLocation.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Location Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="e.g., T01 (optional)"
                className="input-field"
                disabled={createLocation.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Floor</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => handleChange('floor', e.target.value)}
                  placeholder="e.g., Ground"
                  className="input-field"
                  disabled={createLocation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Area</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  placeholder="e.g., West Wing"
                  className="input-field"
                  disabled={createLocation.isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
                placeholder="e.g., Public Area"
                className="input-field"
                disabled={createLocation.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Additional notes about this location"
                className="input-field min-h-[100px]"
                disabled={createLocation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 btn-secondary"
            disabled={createLocation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary flex items-center justify-center gap-2"
            disabled={createLocation.isPending}
          >
            {createLocation.isPending ? (
              <>
                <div className="spinner" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Location
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Note */}
      <div className="container-elevated bg-blue-50 border-l-4 border-blue-500">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> A unique QR code will be automatically generated for
          this location when you create it.
        </p>
      </div>
    </div>
  );
}
