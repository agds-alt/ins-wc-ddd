// src/pages/AddLocationPage.tsx - Add New Location
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationFormData {
  name: string;
  building: string;
  floor: string;
  code: string;
  is_active: boolean;
}

export const AddLocationPage = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    building: '',
    floor: '',
    code: '',
    is_active: true,
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: newLocation, error } = await supabase
        .from('locations')
        .insert([
          {
            name: data.name.trim(),
            building: data.building.trim(),
            floor: data.floor.trim(),
            code: data.code.trim() || null,
            is_active: data.is_active,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return newLocation;
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations-list'] });
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
    if (!formData.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    if (!formData.building.trim()) {
      toast.error('Building name is required');
      return;
    }
    if (!formData.floor.trim()) {
      toast.error('Floor is required');
      return;
    }

    createLocationMutation.mutate(formData);
  };

  const handleChange = (field: keyof LocationFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
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
            />
          </div>

          {/* Building */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Building *
            </label>
            <input
              type="text"
              value={formData.building}
              onChange={(e) => handleChange('building', e.target.value)}
              placeholder="e.g., Building A, Main Tower"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Floor */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Floor *
            </label>
            <input
              type="text"
              value={formData.floor}
              onChange={(e) => handleChange('floor', e.target.value)}
              placeholder="e.g., Floor 1, Ground Floor, 2F"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., WC-A1, TL-B2"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier for this location</p>
          </div>

          {/* Active Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">Active Status</div>
                <div className="text-sm text-gray-500">Location is ready for inspections</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
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
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">💡 Tips:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use clear, descriptive names</li>
            <li>• Include gender-specific identifiers if needed</li>
            <li>• Location code helps with QR generation</li>
            <li>• Inactive locations won't appear in inspection lists</li>
          </ul>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
