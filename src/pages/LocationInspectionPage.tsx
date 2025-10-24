// src/pages/LocationInspectionPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { InspectionForm } from '../components/forms/InspectionForm';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, Building, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const LocationInspectionPage = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  // Fetch location details
  useEffect(() => {
    const fetchLocation = async () => {
      if (!locationId) {
        toast.error('Location ID not found');
        navigate('/scan');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('locations_with_details')
          .select('*')
          .eq('id', locationId)
          .single();

        if (error) {
          console.error('Error fetching location:', error);
          throw error;
        }
        
        setLocation(data);
      } catch (error: any) {
        console.error('Error fetching location:', error);
        toast.error(error.message || 'Location not found');
        navigate('/scan');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [locationId, navigate]);

  const handleInspectionComplete = () => {
    toast.success('Inspection completed successfully!');
    setShowInspectionForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Location Not Found</h2>
          <p className="text-gray-600 mb-4">The requested location does not exist or you don't have access.</p>
          <Button onClick={() => navigate('/scan')}>
            Back to Scanner
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Toilet Inspection</h1>
              <p className="text-gray-600">Complete inspection for this location</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Location Info Card */}
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
              🚽
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {location.name}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>
                      <strong>Building:</strong> {location.building_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      <strong>Organization:</strong> {location.organization_name || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {location.floor && (
                    <div>
                      <strong>Floor:</strong> {location.floor}
                    </div>
                  )}
                  {location.section && (
                    <div>
                      <strong>Section:</strong> {location.section}
                    </div>
                  )}
                  {location.area && (
                    <div>
                      <strong>Area Type:</strong> {location.area}
                    </div>
                  )}
                </div>
              </div>

              {location.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{location.description}</p>
                </div>
              )}

              {location.code && (
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Code: {location.code}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Action Section */}
        {!showInspectionForm ? (
          <Card className="p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Inspect?
              </h3>
              <p className="text-gray-600 mb-6">
                Start the inspection process for <strong>{location.name}</strong>. 
                You'll be rating various components and can add photos if needed.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => setShowInspectionForm(true)}
                  className="w-full"
                  size="lg"
                >
                  Start Inspection
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/scan')}
                  className="w-full"
                >
                  Scan Different QR Code
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Inspection Form */
          <InspectionForm
            locationId={locationId!}
            onComplete={handleInspectionComplete}
          />
        )}

        {/* Recent Inspections */}
        <RecentInspections locationId={locationId!} />
      </div>
    </div>
  );
};

// Component untuk menampilkan inspection history
const RecentInspections = ({ locationId }: { locationId: string }) => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspections = async () => {
      const { data, error } = await supabase
        .from('inspection_records')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setInspections(data);
      }
      setLoading(false);
    };

    fetchInspections();
  }, [locationId]);

  if (loading) return <div className="text-center py-4">Loading inspection history...</div>;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Inspections
      </h3>
      
      {inspections.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No inspections yet. Be the first to inspect this location!
        </p>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(inspection.inspection_date).toLocaleDateString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">
                  {inspection.inspection_time} • 
                  Status: <span className={`font-medium ${
                    inspection.overall_status === 'excellent' ? 'text-green-600' :
                    inspection.overall_status === 'good' ? 'text-blue-600' :
                    inspection.overall_status === 'fair' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {inspection.overall_status}
                  </span>
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => console.log('View inspection details:', inspection.id)}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};