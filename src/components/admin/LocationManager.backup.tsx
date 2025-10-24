// src/components/admin/LocationManager.tsx - MOBILE-FIRST FIXED
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Tables, TablesInsert } from '../../types/database.types';
import { Plus, Edit2, Trash2, MapPin, QrCode, Search, MoreVertical, Copy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Filter locations
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
      toast.success('Location deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteMutation.mutate(id);
      setOpenMenuId(null);
    }
  };

  const handleGenerateQR = (location: Location) => {
    setQrLocations([location]);
    setShowQRGenerator(true);
    setOpenMenuId(null);
  };

  const handleBulkQR = () => {
    if (!locations || locations.length === 0) {
      toast.error('No locations available');
      return;
    }
    setQrLocations(locations);
    setShowQRGenerator(true);
  };

  const getLocationURL = (id: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/locations/${id}`;
  };

  const copyLocationURL = (location: Location) => {
    const url = getLocationURL(location.id);
    navigator.clipboard.writeText(url);
    toast.success('URL copied!');
    setOpenMenuId(null);
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
                <span>Add</span>
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

        {/* Locations List - MOBILE OPTIMIZED */}
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
              <Card key={location.id} className="relative">
                {/* Main Content */}
                <div className="pr-10">
                  {/* Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      🚽
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {location.name}
                      </h3>
                      {location.code && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {location.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    {location.building && (
                      <p className="truncate">🏢 {location.building}</p>
                    )}
                    {location.floor && (
                      <p className="truncate">📍 {location.floor}</p>
                    )}
                    {location.area && (
                      <p className="truncate">📌 {location.area}</p>
                    )}
                  </div>

                  {/* URL Preview - Collapsible */}
                  <details className="text-xs">
                    <summary className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      View URL
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-600 break-all font-mono">
                        {getLocationURL(location.id)}
                      </p>
                    </div>
                  </details>
                </div>

                {/* Menu Button - FIXED POSITION */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === location.id ? null : location.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === location.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                        <button
                          onClick={() => handleGenerateQR(location)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                        >
                          <QrCode className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Generate QR</span>
                        </button>

                        <button
                          onClick={() => copyLocationURL(location)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors border-t border-gray-100"
                        >
                          <Copy className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Copy URL</span>
                        </button>

                        <button
                          onClick={() => handleEdit(location)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors border-t border-gray-100"
                        >
                          <Edit2 className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(location.id, location.name)}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-3 transition-colors border-t border-gray-100"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Delete</span>
                        </button>
                      </div>
                    </>
                  )}
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

// Location Form Modal Component (unchanged from original)
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
        const { error } = await supabase
          .from('locations')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', location.id);

        if (error) throw error;
      } else {
        const newLocation: TablesInsert<'locations'> = {
          ...data,
          qr_code: '',
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
            {location ? 'Edit Location' : 'Add Location'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Toilet Lantai 3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. WC-03"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building
              </label>
              <input
                type="text"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gedung A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Lantai 3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Area Utara"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pria/Wanita"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Additional information..."
            />
          </div>

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
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : location ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};