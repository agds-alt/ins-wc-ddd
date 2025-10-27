// src/pages/admin/LocationsManager.tsx - Admin-only CRUD for locations
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Tables, TablesInsert } from '../../types/database.types';
import { Plus, Edit2, Trash2, MapPin, QrCode, Search, MoreVertical, Copy, User, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { QRCodeGenerator } from './QRCodeGenerator';

type Location = Tables<'locations'>;
type LocationInsert = TablesInsert<'locations'>;

export const LocationsManager = () => {
  console.log('🟢 LocationsManager: Component starting');

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  console.log('🟢 LocationsManager: Auth state', {
    hasUser: !!user,
    authLoading,
    isAdmin,
    adminLoading
  });
  
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

  // Loading states
  if (authLoading || adminLoading) {
    console.log('🟡 Showing loading spinner');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    console.log('🔴 No user - redirecting to login');
    navigate('/login', { replace: true });
    return null;
  }

  // Admin check
  if (!isAdmin) {
    console.log('🔴 ACCESS DENIED - User is not admin');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Admin Access Required
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            This page is only accessible to administrators.
          </p>
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs text-gray-600 mb-1">Debug Info:</p>
            <p className="text-xs text-gray-800">User: {user.email}</p>
            <p className="text-xs text-gray-800">Admin Status: {isAdmin ? 'Yes' : 'No'}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Admin access granted - rendering location manager');

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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Location Management</h1>
            <p className="text-blue-100">Manage toilet locations & QR codes</p>
          </div>
          {/* User Info */}
          {user && (
            <div className="hidden sm:flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
              <User className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">
                {user.user_metadata?.name || user.email}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* User Info for Mobile */}
        {user && (
          <Card className="sm:hidden p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900 text-sm font-medium">
                {user.user_metadata?.name || user.email}
              </span>
            </div>
          </Card>
        )}

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
                      <p className="truncate">🗺️ {location.area}</p>
                    )}
                  </div>

                  {/* Created By Info */}
                  {location.created_by && (
                    <div className="text-xs text-gray-500 mb-2">
                      Created by: {location.created_by === user?.id ? 'You' : location.created_by}
                    </div>
                  )}

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

// Location Form Modal Component - FIXED VERSION
interface LocationFormModalProps {
  location: Location | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationFormModal = ({ location, onClose, onSuccess }: LocationFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<LocationInsert>>({
    name: location?.name || '',
    code: location?.code || '',
    organization_id: location?.organization_id || '',
    building_id: location?.building_id || '',
    floor: location?.floor || '',
    area: location?.area || '',
    section: location?.section || '',
    description: location?.description || '',
  });

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching organizations:', error);
        return;
      }
      
      setOrganizations(data || []);
    };
    fetchOrganizations();
  }, []);

  // Fetch buildings when organization selected
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!formData.organization_id) {
        setBuildings([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('organization_id', formData.organization_id)
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching buildings:', error);
      } else {
        setBuildings(data || []);
      }
      setLoading(false);
    };
    fetchBuildings();
  }, [formData.organization_id]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<LocationInsert>) => {
      // Validasi UUID
      if (!data.organization_id || !data.building_id) {
        throw new Error('Organization and Building are required');
      }

      if (location) {
        // UPDATE existing location
        const updateData: Partial<LocationInsert> = {
          name: data.name,
          code: data.code,
          organization_id: data.organization_id,
          building_id: data.building_id,
          floor: data.floor,
          area: data.area,
          section: data.section,
          description: data.description,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('locations')
          .update(updateData)
          .eq('id', location.id);

        if (error) throw error;
      } else {
        // INSERT new location using TablesInsert type
        const { data: building, error: buildingError } = await supabase
          .from('buildings')
          .select('short_code, organizations(short_code)')
          .eq('id', data.building_id)
          .single();

        if (buildingError || !building) {
          throw new Error('Building not found');
        }

        // Generate QR code
        const orgCode = (building.organizations as any).short_code;
        const buildingCode = building.short_code;
        const locationCode = data.code || 'LOC';
        const uniqueId = Date.now().toString(36).slice(-4);
        
        const qrCode = orgCode + '-' + buildingCode + '-' + locationCode + '-' + uniqueId;

        const newLocation: LocationInsert = {
          name: data.name!,
          code: data.code,
          organization_id: data.organization_id!,
          building_id: data.building_id!,
          floor: data.floor,
          area: data.area,
          section: data.section,
          description: data.description,
          qr_code: qrCode.toUpperCase(),
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
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save location');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Location name is required');
      return;
    }

    if (!formData.organization_id) {
      toast.error('Organization is required');
      return;
    }

    if (!formData.building_id) {
      toast.error('Building is required');
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
          {user && (
            <p className="text-sm text-gray-600 mt-1">
              Created by: {user.user_metadata?.name || user.email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Organization Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization *
            </label>
            <select
              value={formData.organization_id || ''}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value, building_id: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={saveMutation.isPending}
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.short_code})
                </option>
              ))}
            </select>
          </div>

          {/* Building Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Building *
            </label>
            <select
              value={formData.building_id || ''}
              onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!formData.organization_id || loading || saveMutation.isPending}
            >
              <option value="">
                {loading ? 'Loading buildings...' : 
                 !formData.organization_id ? 'Select organization first' : 
                 'Select Building'}
              </option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name} ({building.short_code})
                </option>
              ))}
            </select>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Toilet Lantai 3"
              required
              disabled={saveMutation.isPending}
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Code
            </label>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. WC-03, T-MEN-1"
              disabled={saveMutation.isPending}
            />
          </div>

          {/* Floor & Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <input
                type="text"
                value={formData.floor || ''}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Lantai 3"
                disabled={saveMutation.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pria/Wanita"
                disabled={saveMutation.isPending}
              />
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area Type
            </label>
            <select
              value={formData.area || ''}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saveMutation.isPending}
            >
              <option value="">Select Area Type</option>
              <option value="Public Area">Public Area</option>
              <option value="Staff Area">Staff Area</option>
              <option value="VIP Area">VIP Area</option>
              <option value="Service Area">Service Area</option>
              <option value="Emergency Area">Emergency Area</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Additional information..."
              disabled={saveMutation.isPending}
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
              disabled={saveMutation.isPending || !formData.name || !formData.organization_id || !formData.building_id}
            >
              {saveMutation.isPending ? 'Saving...' : location ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};