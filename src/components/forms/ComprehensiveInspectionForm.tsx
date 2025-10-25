// src/components/forms/ComprehensiveInspectionForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { RatingSelector } from './RatingSelector';
import { EnhancedPhotoUpload, PhotoWithMetadata } from './EnhancedPhotoUpload';
import { useInspection } from '../../hooks/useInspection';
import { useAuth } from '../../hooks/useAuth';
import {
  INSPECTION_COMPONENTS,
  InspectionComponent,
  RatingLevel,
  ComponentRating,
  calculateWeightedScore,
  getScoreStatus,
} from '../../types/inspection.types';
import { uploadToCloudinary } from '../../lib/cloudinary';

interface ComprehensiveInspectionFormProps {
  locationId: string;
  genZMode?: boolean;
  onToggleMode?: () => void;
}

interface LocationData {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  area: string | null;
  code: string | null;
  building_id: string;
  organization_id: string;
  qr_code: string;
  is_active: boolean | null;
}

export const ComprehensiveInspectionForm = ({
  locationId,
  genZMode = false,
  onToggleMode,
}: ComprehensiveInspectionFormProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { getLocation, submitInspection } = useInspection();
  
  // Form state
  const [ratings, setRatings] = useState<Map<InspectionComponent, ComponentRating>>(new Map());
  const [photos, setPhotos] = useState<Map<InspectionComponent, PhotoWithMetadata[]>>(new Map());
  const [generalNotes, setGeneralNotes] = useState('');
  const [issuesFound, setIssuesFound] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [requiresMaintenance, setRequiresMaintenance] = useState(false);
  const [maintenancePriority, setMaintenancePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('low');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [currentScore, setCurrentScore] = useState(0);
  const [expandedComponent, setExpandedComponent] = useState<InspectionComponent | null>(
    INSPECTION_COMPONENTS[0].id
  );

  const { data: location, isLoading: locationLoading, error: locationError } = getLocation(locationId);

  // Calculate score whenever ratings change
  useEffect(() => {
    const ratingsList = Array.from(ratings.values());
    if (ratingsList.length > 0) {
      const score = calculateWeightedScore(ratingsList);
      setCurrentScore(score);
    } else {
      setCurrentScore(0);
    }
  }, [ratings]);

  const handleRatingChange = (componentId: InspectionComponent, rating: RatingLevel) => {
    const existing = ratings.get(componentId) || { component: componentId, rating: 1 };
    setRatings(new Map(ratings.set(componentId, { ...existing, rating })));
  };

  const handleNotesChange = (componentId: InspectionComponent, notes: string) => {
    const existing = ratings.get(componentId);
    if (existing) {
      setRatings(new Map(ratings.set(componentId, { ...existing, notes })));
    }
  };

  const handlePhotosChange = (componentId: InspectionComponent, newPhotos: PhotoWithMetadata[]) => {
    setPhotos(new Map(photos.set(componentId, newPhotos)));
  };

  const validateForm = (): boolean => {
    const requiredComponents = INSPECTION_COMPONENTS.filter(c => c.required);
    const missingRatings = requiredComponents.filter(c => !ratings.has(c.id));
    
    if (missingRatings.length > 0) {
      const missing = missingRatings.map(c => genZMode ? c.labelGenZ : c.label).join(', ');
      toast.error(
        genZMode 
          ? `Masih ada yang belum diisi: ${missing}` 
          : `Please rate: ${missing}`
      );
      // Scroll to first missing
      setExpandedComponent(missingRatings[0].id);
      return false;
    }

    if (issuesFound && !issueDescription.trim()) {
      toast.error(
        genZMode 
          ? 'Tolong jelasin masalah yang ditemukan!' 
          : 'Please describe the issues found'
      );
      return false;
    }

    if (requiresMaintenance && !maintenancePriority) {
      toast.error(
        genZMode 
          ? 'Pilih prioritas maintenance!' 
          : 'Please select maintenance priority'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Upload all photos to Cloudinary and collect URLs
      const uploadedPhotoUrls: string[] = [];
      const updatedRatings = new Map(ratings);

      for (const [componentId, componentPhotos] of photos.entries()) {
        for (const photo of componentPhotos) {
          try {
            const url = await uploadToCloudinary(photo.file);
            if (url) {
              uploadedPhotoUrls.push(url);
              
              // Update rating with photo URL
              const rating = updatedRatings.get(componentId);
              if (rating) {
                rating.photo = url;
                updatedRatings.set(componentId, rating);
              }
            }
          } catch (error) {
            console.error(`Photo upload failed for ${componentId}:`, error);
            // Continue with other photos
          }
        }
      }

     // In ComprehensiveInspectionForm.tsx, update the handleSubmit function:

// Prepare responses object for database - synchronized with inspection.types
const responses: Record<string, any> = {
  ratings: Array.from(updatedRatings.values()),
  score: currentScore,
  issues_found: issuesFound,
  issue_description: issuesFound ? issueDescription.trim() : null,
  requires_maintenance: requiresMaintenance,
  maintenance_priority: requiresMaintenance ? maintenancePriority : null,
  inspection_mode: genZMode ? 'genz' : 'professional',
  submitted_at: new Date().toISOString(),
  inspector: {
    id: user.id,
    name: profile?.full_name || user.email?.split('@')[0] || 'Unknown Inspector',
    email: user.email,
    profile_id: profile?.id, // Include profile ID if needed
  },
};
      // Get all photo files for submission
      const allPhotoFiles = Array.from(photos.values()).flat().map(p => p.file);

      // Submit inspection - synchronized with useInspection hook
      await submitInspection.mutateAsync({
        location_id: locationId,
        user_id: user.id,
        responses,
        photos: allPhotoFiles,
        notes: generalNotes.trim() || undefined,
        duration_seconds: durationSeconds,
      });

      toast.success(
        genZMode 
          ? `🎉 Inspection selesai! Score: ${currentScore}` 
          : `Inspection submitted successfully! Score: ${currentScore}`
      );

      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/scan', { replace: true });
      }, 1500);

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(
        genZMode 
          ? 'Gagal submit inspection. Coba lagi ya!' 
          : error.message || 'Failed to submit inspection'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle location loading and error states
  if (locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (locationError || !location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-700">
            {genZMode ? 'Lokasi gak ketemu 😢' : 'Location not found'}
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            {genZMode ? 'Kembali ke Scan' : 'Back to Scan'}
          </button>
        </div>
      </div>
    );
  }

  const locationData = location as LocationData;
  const scoreStatus = getScoreStatus(currentScore);
  const completedCount = ratings.size;
  const totalRequired = INSPECTION_COMPONENTS.filter(c => c.required).length;
  const progress = (completedCount / INSPECTION_COMPONENTS.length) * 100;
  const allPhotosCount = Array.from(photos.values()).flat().length;

  return (
    <div className={`min-h-screen pb-32 ${genZMode ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`
        sticky top-0 z-20 
        ${genZMode 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
          : 'bg-white border-b border-gray-200'
        }
        shadow-sm
      `}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-xl ${genZMode ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Mode Toggle */}
            {onToggleMode && (
              <button
                onClick={onToggleMode}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${genZMode 
                    ? 'bg-white/20 text-white hover:bg-white/30' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {genZMode ? '💼 Pro Mode' : '🎨 Gen Z Mode'}
              </button>
            )}
          </div>

          {/* Location Info */}
          <div className="flex items-center space-x-3 mb-3">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl
              ${genZMode ? 'bg-white/20' : 'bg-blue-100'}
            `}>
              🚽
            </div>
            <div className={genZMode ? 'text-white' : 'text-gray-900'}>
              <h1 className="font-bold text-lg">{locationData.name}</h1>
              <p className={`text-sm ${genZMode ? 'text-white/80' : 'text-gray-600'}`}>
                {[locationData.building, locationData.floor, locationData.area]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={genZMode ? 'text-white/90' : 'text-gray-600'}>
                {genZMode 
                  ? `Progress ${completedCount}/${INSPECTION_COMPONENTS.length}` 
                  : `${completedCount} of ${INSPECTION_COMPONENTS.length} completed`
                }
              </span>
              {currentScore > 0 && (
                <span className={`font-bold ${genZMode ? 'text-white' : 'text-blue-600'}`}>
                  Score: {currentScore}
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${genZMode ? 'bg-white' : 'bg-blue-600'}`}
                style={{ width: `${Math.max(5, progress)}%` }} // Minimum 5% width for visibility
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">
        {INSPECTION_COMPONENTS.map((component) => {
          const rating = ratings.get(component.id);
          const componentPhotos = photos.get(component.id) || [];
          const isExpanded = expandedComponent === component.id;

          return (
            <div key={component.id}>
              {isExpanded ? (
                <RatingSelector
                  config={component}
                  value={rating?.rating || null}
                  onChange={(r) => handleRatingChange(component.id, r)}
                  onPhotoAdd={
                    component.allowPhoto
                      ? () => {
                          /* Photo handled by EnhancedPhotoUpload below */
                        }
                      : undefined
                  }
                  hasPhoto={componentPhotos.length > 0}
                  genZMode={genZMode}
                  notes={rating?.notes}
                  onNotesChange={(notes) => handleNotesChange(component.id, notes)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setExpandedComponent(component.id)}
                  className={`
                    w-full p-4 rounded-2xl flex items-center justify-between
                    transition-all border-2
                    ${rating
                      ? genZMode
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
                        : 'bg-green-50 border-green-500'
                      : genZMode
                        ? 'bg-white/80 border-purple-200 hover:border-purple-400'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{genZMode ? component.iconGenZ : component.icon}</span>
                    <span className="font-medium text-gray-900">
                      {genZMode ? component.labelGenZ : component.label}
                    </span>
                  </div>
                  {rating ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : component.required ? (
                    <span className="text-red-500">*</span>
                  ) : null}
                </button>
              )}

              {/* Photo Upload (shown when expanded and photos allowed) */}
              {isExpanded && component.allowPhoto && (
                <div className="mt-3">
                  <EnhancedPhotoUpload
                    componentId={component.id}
                    photos={componentPhotos}
                    onPhotosChange={(photos) => handlePhotosChange(component.id, photos)}
                    genZMode={genZMode}
                  />
                </div>
              )}

              {/* Collapse button */}
              {isExpanded && (
                <button
                  type="button"
                  onClick={() => setExpandedComponent(null)}
                  className={`
                    w-full mt-2 py-2 rounded-xl text-sm font-medium
                    ${genZMode 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {genZMode ? '↑ Minimize' : '↑ Collapse'}
                </button>
              )}
            </div>
          );
        })}

        {/* Issues Section */}
        <div className={`${genZMode ? 'bg-white/80' : 'bg-white'} rounded-2xl p-4 shadow-sm border border-gray-100`}>
          <label className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900">
              {genZMode ? '⚠️ Ada masalah yang ditemukan?' : 'Issues Found?'}
            </span>
            <input
              type="checkbox"
              checked={issuesFound}
              onChange={(e) => setIssuesFound(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          {issuesFound && (
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder={genZMode ? "Jelasin masalahnya..." : "Describe the issues found..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          )}
        </div>

        {/* Maintenance Required */}
        <div className={`${genZMode ? 'bg-white/80' : 'bg-white'} rounded-2xl p-4 shadow-sm border border-gray-100`}>
          <label className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900">
              {genZMode ? '🔧 Perlu maintenance?' : 'Requires Maintenance?'}
            </span>
            <input
              type="checkbox"
              checked={requiresMaintenance}
              onChange={(e) => setRequiresMaintenance(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          {requiresMaintenance && (
            <div className="grid grid-cols-2 gap-2">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setMaintenancePriority(priority as any)}
                  className={`
                    py-2 px-3 rounded-xl text-sm font-medium capitalize
                    ${maintenancePriority === priority
                      ? priority === 'urgent'
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : priority === 'high'
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                          : priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                            : 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                    }
                  `}
                >
                  {priority}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* General Notes */}
        <div className={`${genZMode ? 'bg-white/80' : 'bg-white'} rounded-2xl p-4 shadow-sm border border-gray-100`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {genZMode ? '📝 Catatan tambahan (opsional)' : 'General Notes (Optional)'}
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder={genZMode ? "Ada yang mau ditambahin?" : "Any additional observations..."}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* Photo Preview Section */}
        {allPhotosCount > 0 && (
          <div className={`${genZMode ? 'bg-white/80' : 'bg-white'} rounded-2xl p-4 shadow-sm border border-gray-100`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {genZMode ? '📸 Foto yang akan diupload' : '📸 Photos to Upload'}
              </h3>
              <span className={`text-sm px-3 py-1 rounded-full ${genZMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {allPhotosCount} {allPhotosCount === 1 ? 'photo' : 'photos'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from(photos.entries()).map(([componentId, componentPhotos]) => 
                componentPhotos.map((photo, index) => {
                  const component = INSPECTION_COMPONENTS.find(c => c.id === componentId);
                  return (
                    <div key={`${componentId}-${index}`} className="relative group">
                      <img
                        src={photo.preview}
                        alt={`${component?.label} photo`}
                        className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                      />
                      
                      {/* Component Label */}
                      <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                        {genZMode ? component?.iconGenZ : component?.icon}
                      </div>

                      {/* Metadata badges */}
                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                        {photo.location && (
                          <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                            <span>📍</span>
                          </div>
                        )}
                        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                          <span>⏰</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              {genZMode 
                ? '✨ Semua foto udah include GPS & timestamp' 
                : '✨ All photos include GPS location & timestamp'
              }
            </p>
          </div>
        )}

        {/* Score Preview */}
        {currentScore > 0 && (
          <div className={`
            rounded-2xl p-6 text-center shadow-lg
            ${genZMode 
              ? 'bg-gradient-to-br from-purple-100 to-pink-100' 
              : 'bg-gradient-to-br from-blue-50 to-indigo-50'
            }
          `}>
            <div className="text-6xl mb-2">{scoreStatus.emoji}</div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{currentScore}</div>
            <div className={`text-lg font-semibold ${
              scoreStatus.color === 'green' ? 'text-green-700' :
              scoreStatus.color === 'blue' ? 'text-blue-700' :
              scoreStatus.color === 'yellow' ? 'text-yellow-700' :
              scoreStatus.color === 'orange' ? 'text-orange-700' :
              'text-red-700'
            }`}>
              {genZMode ? scoreStatus.labelGenZ : scoreStatus.label}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || completedCount < totalRequired}
          className={`
            w-full py-4 rounded-2xl font-semibold shadow-lg
            flex items-center justify-center space-x-2
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-95
            ${genZMode 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
              : 'bg-blue-600 text-white'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>{genZMode ? 'Submitting...' : 'Submitting...'}</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>
                {genZMode 
                  ? `Submit Inspection ${completedCount < totalRequired ? `(${totalRequired - completedCount} lagi!)` : '🎉'}` 
                  : `Submit Inspection ${completedCount < totalRequired ? `(${totalRequired - completedCount} remaining)` : ''}`
                }
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};