/**
 * Location Details Page
 * View and edit location information
 */

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  MapPin,
  Building2,
  QrCode,
  Edit,
  Trash2,
  Save,
  X,
  Download,
  RefreshCw,
} from 'lucide-react';

interface LocationPageProps {
  params: Promise<{
    locationId: string;
  }>;
}

export default function LocationPage({ params }: LocationPageProps) {
  const { locationId } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    floor: '',
    area: '',
    section: '',
    description: '',
  });

  // Fetch location
  const { data: location, isLoading } = trpc.location.getById.useQuery(locationId);
  const { data: user } = trpc.auth.me.useQuery();

  // Initialize form data when location loads
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        code: location.code || '',
        floor: location.floor || '',
        area: location.area || '',
        section: location.section || '',
        description: location.description || '',
      });
    }
  }, [location]);

  // Update mutation
  const updateLocation = trpc.location.update.useMutation({
    onSuccess: () => {
      toast.success('Location updated successfully!');
      setIsEditing(false);
      utils.location.getById.invalidate(locationId);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update location');
    },
  });

  // Regenerate QR mutation
  const regenerateQR = trpc.location.regenerateQR.useMutation({
    onSuccess: () => {
      toast.success('QR code regenerated successfully!');
      utils.location.getById.invalidate(locationId);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to regenerate QR code');
    },
  });

  // Delete mutation
  const deleteLocation = trpc.location.delete.useMutation({
    onSuccess: () => {
      toast.success('Location deleted successfully!');
      router.push('/locations');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete location');
    },
  });

  const handleSave = () => {
    updateLocation.mutate({
      id: locationId,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      floor: formData.floor.trim() || undefined,
      area: formData.area.trim() || undefined,
      section: formData.section.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${location?.name}"? This action cannot be undone.`
      )
    ) {
      deleteLocation.mutate(locationId);
    }
  };

  const handleRegenerateQR = () => {
    if (
      confirm(
        'Are you sure you want to regenerate the QR code? The old QR code will no longer work.'
      )
    ) {
      regenerateQR.mutate(locationId);
    }
  };

  const downloadQR = () => {
    if (!location) return;
    // TODO: Generate actual QR code image using qrcode library
    toast.success('QR code download functionality will be implemented');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12 text-center">
        <h2 className="text-2xl font-bold">Location Not Found</h2>
        <button onClick={() => router.push('/locations')} className="btn-primary">
          Back to Locations
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <p className="text-muted-foreground mt-1">Location Details</p>
          </div>
        </div>

        {user?.isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* QR Code Section */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code
        </h2>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
          <div>
            <code className="text-lg font-mono font-semibold">{location.qr_code}</code>
            <p className="text-sm text-muted-foreground mt-1">Unique identifier</p>
          </div>

          {user?.isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={downloadQR}
                className="btn-secondary flex items-center gap-2"
                title="Download QR Code"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleRegenerateQR}
                className="btn-secondary flex items-center gap-2"
                disabled={regenerateQR.isPending}
                title="Regenerate QR Code"
              >
                <RefreshCw
                  className={`w-4 h-4 ${regenerateQR.isPending ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location Details */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Information
        </h2>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Location Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Floor</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Area</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[100px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
                disabled={updateLocation.isPending}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                disabled={updateLocation.isPending}
              >
                {updateLocation.isPending ? (
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
          </div>
        ) : (
          <div className="space-y-3">
            <InfoRow label="Building" value={location.building_name || '-'} />
            <InfoRow label="Code" value={location.code || '-'} />
            <InfoRow label="Floor" value={location.floor || '-'} />
            <InfoRow label="Area" value={location.area || '-'} />
            <InfoRow label="Section" value={location.section || '-'} />
            <InfoRow label="Description" value={location.description || '-'} />
          </div>
        )}
      </div>

      {/* Building Details */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Building Details
        </h2>

        <div className="space-y-3">
          <InfoRow label="Building" value={location.building_name || '-'} />
          <InfoRow label="Organization" value={location.organization_name || '-'} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container-elevated">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/inspection/${locationId}`)}
            className="w-full btn-primary"
          >
            Start Inspection
          </button>

          {user?.isAdmin && (
            <button
              onClick={handleDelete}
              className="w-full btn-secondary text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
              disabled={deleteLocation.isPending}
            >
              {deleteLocation.isPending ? (
                <>
                  <div className="spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Location
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
