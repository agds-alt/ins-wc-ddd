// src/pages/AddLocationPage.tsx - Add New Location (ADMIN ONLY)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import {
  MapPin,
  Menu,
  Building2,
  Layers,
  Hash,
  Save,
  ArrowLeft,
  Home as HomeIcon,
  Map,
  Grid,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TablesInsert } from '../types/database.types';

type LocationInsert = TablesInsert<'locations'>;

interface Organization {
  id: string;
  name: string;
  short_code: string;
  is_active: boolean;
}

interface Building {
  id: string;
  name: string;
  short_code: string;
  organization_id: string;
  is_active: boolean;
}

export const AddLocationPage = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

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

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
        return;
      }

      setOrganizations(data || []);
    };

    fetchOrganizations();
  }, []);

  // Fetch buildings when organization changes
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!formData.organization_id) {
        setBuildings([]);
        return;
      }

      setLoadingBuildings(true);
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('organization_id', formData.organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching buildings:', error);
        toast.error('Failed to load buildings');
      } else {
        setBuildings(data || []);
      }
      setLoadingBuildings(false);
    };

    fetchBuildings();
  }, [formData.organization_id]);

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!data.organization_id || !data.building_id) {
        throw new Error('Organization and Building are required');
      }

      // Fetch building to generate QR code
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

      const qrCode = `${orgCode}-${buildingCode}-${locationCode}-${uniqueId}`.toUpperCase();

      // Create location object
      const newLocation: LocationInsert = {
        name: data.name.trim(),
        code: data.code.trim() || null,
        organization_id: data.organization_id,
        building_id: data.building_id,
        floor: data.floor.trim() || null,
        area: data.area || null,
        section: data.section.trim() || null,
        description: data.description.trim() || null,
        qr_code: qrCode,
        is_active: true,
        created_by: user.id,
      };

      const { data: newLocationData, error } = await supabase
        .from('locations')
        .insert(newLocation)
        .select()
        .single();

      if (error) throw error;
      return newLocationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations-list'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location added successfully!');
      navigate('/locations');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add location');
    },
  });

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

    createLocationMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      // Reset building when organization changes
      if (field === 'organization_id') {
        return { ...prev, [field]: value, building_id: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  // Admin check - redirect to dashboard if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Admin Access Required
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            You need administrator privileges to add new locations. Please contact your system administrator if you believe this is an error.
          </p>
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

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Location</h1>
              <p className="text-sm text-gray-500">Create new inspection point</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organization Dropdown */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <HomeIcon className="w-4 h-4 text-blue-600" />
              Organization *
            </label>
            <select
              value={formData.organization_id}
              onChange={(e) => handleChange('organization_id', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={createLocationMutation.isPending}
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.short_code})
                </option>
              ))}
            </select>
            {organizations.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No organizations found. Please contact admin.
              </p>
            )}
          </div>

          {/* Building Dropdown */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Building *
            </label>
            <select
              value={formData.building_id}
              onChange={(e) => handleChange('building_id', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={
                !formData.organization_id ||
                loadingBuildings ||
                createLocationMutation.isPending
              }
            >
              <option value="">
                {loadingBuildings
                  ? 'Loading buildings...'
                  : !formData.organization_id
                  ? 'Select organization first'
                  : 'Select Building'}
              </option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name} ({building.short_code})
                </option>
              ))}
            </select>
            {formData.organization_id && buildings.length === 0 && !loadingBuildings && (
              <p className="text-xs text-orange-500 mt-1">
                No buildings found for this organization.
              </p>
            )}
          </div>

          {/* Location Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Location Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Men's Toilet, Women's Restroom"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={createLocationMutation.isPending}
            />
          </div>

          {/* Code (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 text-gray-400" />
              Location Code (Optional)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g., WC-01, TL-A1"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={createLocationMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Will be used for QR code generation
            </p>
          </div>

          {/* Floor & Section - Two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Layers className="w-4 h-4 text-gray-400" />
                Floor
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => handleChange('floor', e.target.value)}
                placeholder="e.g., 1F, Ground"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={createLocationMutation.isPending}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Grid className="w-4 h-4 text-gray-400" />
                Section
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
                placeholder="e.g., Men, Women"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={createLocationMutation.isPending}
              />
            </div>
          </div>

          {/* Area Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Map className="w-4 h-4 text-gray-400" />
              Area Type
            </label>
            <select
              value={formData.area}
              onChange={(e) => handleChange('area', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={createLocationMutation.isPending}
            >
              <option value="">Select Area Type (Optional)</option>
              <option value="Public Area">Public Area</option>
              <option value="Staff Area">Staff Area</option>
              <option value="VIP Area">VIP Area</option>
              <option value="Service Area">Service Area</option>
              <option value="Emergency Area">Emergency Area</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional notes or special instructions..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={createLocationMutation.isPending}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={createLocationMutation.isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createLocationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Location</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={createLocationMutation.isPending}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">💡 Tips:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select organization first, then building</li>
            <li>• QR code will be auto-generated from codes</li>
            <li>• Use clear, descriptive location names</li>
            <li>• Location will be active by default</li>
          </ul>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
