/**
 * Locations List Page
 */

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';

export default function LocationsPage() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();
  const [search, setSearch] = useState('');

  const { data: locations, isLoading } = trpc.location.list.useQuery({
    search,
    is_active: true,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Manage toilet locations
          </p>
        </div>
        {user?.isAdmin && (
          <button
            onClick={() => router.push('/locations/create')}
            className="btn-primary"
          >
            Add Location
          </button>
        )}
      </div>

      {/* Search */}
      <div className="container-elevated">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search locations..."
          className="input-field"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : locations && locations.length > 0 ? (
          locations.map((location) => (
            <div
              key={location.id}
              className="card-interactive cursor-pointer"
              onClick={() => router.push(`/locations/${location.id}`)}
            >
              {location.photo_url && (
                <img
                  src={location.photo_url}
                  alt={location.name}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}

              <h3 className="font-semibold">{location.name}</h3>

              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                {location.building_name && (
                  <p>Building: {location.building_name}</p>
                )}
                {location.floor && <p>Floor: {location.floor}</p>}
                {location.area && <p>Area: {location.area}</p>}
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <code className="text-xs bg-secondary px-2 py-1 rounded">
                  {location.qr_code}
                </code>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No locations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
