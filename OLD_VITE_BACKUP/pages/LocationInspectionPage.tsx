// src/pages/LocationInspectionPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ComprehensiveInspectionForm } from '../components/forms/ComprehensiveInspectionForm';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, Building, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePerformance } from '../hooks/usePerformance';

export const LocationInspectionPage = () => {
  usePerformance('Dashboard');
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComprehensiveInspectionForm, setShowComprehensiveInspectionForm] = useState(false);

  // Check authentication - redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Harap login untuk melanjutkan');
      navigate('/login', {
        state: { from: `/location-inspection/${locationId}` }
      });
    }
  }, [user, navigate, locationId]);

  // Fetch location details
  useEffect(() => {
    const fetchLocation = async () => {
      if (!locationId) {
        toast.error('ID lokasi tidak ditemukan');
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
        toast.error(error.message || 'Lokasi tidak ditemukan');
        navigate('/scan');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [locationId, navigate]);

  const handleStartInspection = () => {
    if (!user) {
      toast.error('Harap login untuk memulai inspeksi');
      navigate('/login');
      return;
    }
    
    console.log('Starting inspection:', {
      user: user.email,
      locationId: locationId,
      timestamp: new Date().toISOString()
    });
    
    setShowComprehensiveInspectionForm(true);
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lokasi Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Lokasi yang diminta tidak ada atau Anda tidak memiliki akses.</p>
          <Button onClick={() => navigate('/scan')}>
            Kembali ke Pemindai
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}>Kembali</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inspeksi Toilet</h1>
                <p className="text-gray-600">Lengkapi inspeksi untuk lokasi ini</p>
              </div>
            </div>
            
            {/* User Info Badge */}
            {user && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{user.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Location Info Card */}
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
              ðŸš½
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
                      <strong>Gedung:</strong> {location.building_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      <strong>Organisasi:</strong> {location.organization_name || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {location.floor && (
                    <div>
                      <strong>Lantai:</strong> {location.floor}
                    </div>
                  )}
                  {location.section && (
                    <div>
                      <strong>Seksi:</strong> {location.section}
                    </div>
                  )}
                  {location.area && (
                    <div>
                      <strong>Jenis Area:</strong> {location.area}
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
                    Kode: {location.code}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Action Section */}
        {!showComprehensiveInspectionForm ? (
          <Card className="p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">ðŸ“</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Siap Melakukan Inspeksi?
              </h3>
              <p className="text-gray-600 mb-6">
                Mulai proses inspeksi untuk <strong>{location.name}</strong>.
                Anda akan menilai berbagai komponen dan dapat menambahkan foto jika diperlukan.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleStartInspection}
                  className="w-full"
                  size="lg"
                  disabled={!user}
                >
                  Mulai Inspeksi
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/scan')}
                  className="w-full"
                >
                  Pindai Kode QR Lain
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Inspection Form */
          <ComprehensiveInspectionForm
            locationId={locationId!}
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

  if (loading) return <div className="text-center py-4">Memuat riwayat inspeksi...</div>;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Inspeksi Terbaru
      </h3>

      {inspections.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Belum ada inspeksi. Jadilah yang pertama memeriksa lokasi ini!
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
                Lihat Detail
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};