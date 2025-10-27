// src/pages/LocationsListPage.tsx - Manual Inspection Selection
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import {
  MapPin,
  Menu,
  Search,
  ChevronRight,
  Building2,
  Layers,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  building: string;
  floor: string;
  code: string;
  is_active: boolean;
}

export const LocationsListPage = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isReady = !authLoading && !!user?.id;

  // Fetch all active locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations-list'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, building, floor, code, is_active')
        .eq('is_active', true)
        .order('building', { ascending: true })
        .order('floor', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
  });

  // Filter locations by search query
  const filteredLocations = locations?.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.floor.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group by building
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.building]) {
      acc[loc.building] = [];
    }
    acc[loc.building].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  const handleSelectLocation = (locationId: string) => {
    navigate(`/inspect/${locationId}`);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Locations</h1>
              <p className="text-sm text-gray-500">Select location to inspect</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading locations...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-8">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery ? 'No Results' : 'No Locations Available'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? 'Try a different search term'
                : 'No locations found. Contact admin.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Locations</p>
                  <p className="text-2xl font-bold text-blue-900">{filteredLocations.length}</p>
                </div>
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            {/* Grouped Locations */}
            {Object.entries(groupedLocations).map(([building, locs]) => (
              <div key={building}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <h2 className="font-bold text-gray-900">{building}</h2>
                  <span className="text-sm text-gray-500">({locs.length})</span>
                </div>

                <div className="space-y-2">
                  {locs.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleSelectLocation(location.id)}
                      className="w-full bg-white rounded-xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-gray-50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:translate-y-1 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">
                              {location.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Layers className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {location.floor}
                              </span>
                              {location.code && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-400 font-mono">
                                    {location.code}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
