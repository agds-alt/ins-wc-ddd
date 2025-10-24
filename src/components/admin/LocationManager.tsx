// src/components/admin/LocationManager.tsx - UPDATED: Use location ID for QR
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Tables, TablesInsert } from '../../types/database.types';
import { Plus, Edit2, Trash2, MapPin, QrCode, Search, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { QRCodeGenerator } from './QRCodeGenerator';

type Location = Tables<'locations'>;

export const LocationManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [qrLocations, setQrLocations] = useState<Location[]>([]);

  // Fetch locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Location[];
    },
  });

  // Filter locations by search
  const filteredLocations = locations?.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete location');
    },
  });

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete location "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateQR = (location: Location) => {
    setQrLocations([location]);
    setShowQRGenerator(true);
  };

  const handleBulkQR = () => {
    if (!locations || locations.length === 0) {
      toast.error('No locations available');
      return;
    }
    setQrLocations(locations);
    setShowQRGenerator(true);
  };

  // Generate URL for location
  const getLocationURL = (id: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/locations/${id}`;
  };

  const copyLocationURL = (location: Location) => {
    const url = getLocationURL(location.id);
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-6 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">Location Management</h1>
        <p className="text-blue-100">Manage toilet locations & QR codes</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Search & Actions */}
        <Card>
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  setSelectedLocation(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Location</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleBulkQR}
                className="flex items-center justify-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>Bulk QR</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Locations List */}
        <div className="space-y-3">
          {filteredLocations?.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No locations found</p>
              </div>
            </Card>
          ) : (
            filteredLocations?.map((location) => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      {location.code && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {location.code}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {location.building && (
                        <p>🏢 {location.building}</p>
                      )}
                      {location.floor && (
                        <p>📍 Floor {location.floor}</p>
                      )}
                      {location.area && (
                        <p>📌 {location.area}</p>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-500 mt-2">{location.description}</p>
                    )}
                    
                    {/* Location URL Preview */}
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate flex-1">
                          {getLocationURL(location.id)}
                        </p>
                        <button
                          onClick={() => copyLocationURL(location)}
                          className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Copy URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleGenerateQR(location)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Generate QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit Location"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id, location.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Location"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Location Form Modal */}
      {isFormOpen && (
        <LocationFormModal
          location={selectedLocation}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedLocation(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            setIsFormOpen(false);
            setSelectedLocation(null);
          }}
        />
      )}

      {/* QR Generator Modal */}
      {showQRGenerator && (
        <QRCodeGenerator
          locations={qrLocations}
          onClose={() => {
            setShowQRGenerator(false);
            setQrLocations([]);
          }}
        />
      )}
    </div>
  );
};

// Location Form Modal Component
interface LocationFormModalProps {
  location: Location | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationFormModal = ({ location, onClose, onSuccess }: LocationFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: location?.name || '',
    code: location?.code || '',
    building: location?.building || '',
    floor: location?.floor || '',
    area: location?.area || '',
    section: location?.section || '',
    description: location?.description || '',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (location) {
        // Update existing - ID tetap sama
        const { error } = await supabase
          .from('locations')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', location.id);

        if (error) throw error;
      } else {
        // Create new - ID auto-generated by database
        const newLocation: TablesInsert<'locations'> = {
          ...data,
          qr_code: '', // Keep empty or remove field if not needed
          is_active: true,
          created_by: user?.id || null,
        };

        const { error } = await supabase
          .from('locations')
          .insert(newLocation);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(location ? 'Location updated' : 'Location created');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save location');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {location ? 'Edit Location' : 'Add New Location'}
          </h2>
          {location && (
            <p className="text-xs text-gray-500 mt-1 font-mono truncate">
              ID: {location.id}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Location Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Toilet Lantai 1"
            required
          />

          <Input
            label="Location Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., WC-L1-A"
          />

          <Input
            label="Building"
            value={formData.building}
            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
            placeholder="e.g., Tower A"
          />

          <Input
            label="Floor"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            placeholder="e.g., 1st Floor"
          />

          <Input
            label="Area"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="e.g., Lobby Area"
          />

          <Input
            label="Section"
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            placeholder="e.g., Near Elevator"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Info Notice */}
          {!location && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Auto-generated ID
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    A unique ID will be automatically generated and used for QR code URL
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={saveMutation.isPending}
            >
              {location ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};