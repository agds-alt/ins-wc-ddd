// src/pages/InspectionPage.tsx
import { useParams } from 'react-router-dom';
import { ComprehensiveInspectionForm } from '../components/forms/ComprehensiveInspectionForm';
import { AlertCircle } from 'lucide-react';

export const InspectionPage = () => {
  const { locationId } = useParams<{ locationId: string }>();

  if (!locationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Location</h2>
          <p className="text-gray-600">No location ID provided in URL</p>
        </div>
      </div>
    );
  }

  return <ComprehensiveInspectionForm locationId={locationId} />;
};