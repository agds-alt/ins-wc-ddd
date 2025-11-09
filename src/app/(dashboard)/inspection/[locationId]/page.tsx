/**
 * Inspection Page
 * Dynamic route for location-specific inspection
 */

'use client';

import { use } from 'react';
import { ComprehensiveInspectionForm } from '@/components/ComprehensiveInspectionForm';
import { trpc } from '@/lib/trpc/client';
import { AlertCircle } from 'lucide-react';

interface InspectionPageProps {
  params: Promise<{
    locationId: string;
  }>;
}

export default function InspectionPage({ params }: InspectionPageProps) {
  const { locationId } = use(params);

  // Fetch location details
  const { data: location, isLoading, error } = trpc.location.getById.useQuery(locationId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location...</p>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-700 font-medium">Location not found</p>
          <p className="text-gray-500 text-sm mt-1">
            {error?.message || 'The requested location does not exist'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ComprehensiveInspectionForm
      locationId={location.id}
      locationName={location.name}
      buildingName={location.building || 'Unknown Building'}
      floor={location.floor || '-'}
      area={location.area || '-'}
    />
  );
}
