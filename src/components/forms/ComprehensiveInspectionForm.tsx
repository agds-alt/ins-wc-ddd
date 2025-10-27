// src/components/forms/ComprehensiveInspectionForm.tsx - FINAL: Both photo types
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import {
  InspectionComponent,
  ComponentRating,
  RatingChoice,
  INSPECTION_COMPONENTS,
  calculateWeightedScore,
  getScoreStatus,
  PhotoWithMetadata,
} from '../../types/inspection.types';
import { RatingSelector } from './RatingSelector';
import { EnhancedPhotoUpload } from './EnhancedPhotoUpload'; // Per-component photos
import { GeneralPhotoUpload } from './GeneralPhotoUpload'; // General photos
import { useAuth } from '../../hooks/useAuth';
import { useInspection } from '../../hooks/useInspection';
import { batchUploadToCloudinary, compressImage } from '../../lib/cloudinary';

interface ComprehensiveInspectionFormProps {
  locationId: string;
}

export const ComprehensiveInspectionForm = ({
  locationId,
}: ComprehensiveInspectionFormProps) => {
  // Use professional mode for enterprise-friendly language
  const genZMode = false;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { getLocation, submitInspection } = useInspection();

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [ratings, setRatings] = useState<Map<InspectionComponent, ComponentRating>>(new Map());
  const [photos, setPhotos] = useState<Map<InspectionComponent, PhotoWithMetadata[]>>(new Map()); // Per-component
  const [generalPhotos, setGeneralPhotos] = useState<PhotoWithMetadata[]>([]); // General (mandatory)
  const [generalNotes, setGeneralNotes] = useState('');
  const [issuesFound, setIssuesFound] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [requiresMaintenance, setRequiresMaintenance] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
  current: number;
  total: number;
  percentage: number;
} | null>(null);
  const [maintenancePriority, setMaintenancePriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('low');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [currentScore, setCurrentScore] = useState(0);
  // ✅ ADD THIS
  const [expandedComponent, setExpandedComponent] = useState<InspectionComponent | null>(
    INSPECTION_COMPONENTS[0].id
    
  );

  const { data: location, isLoading: locationLoading } = getLocation(locationId);

  

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Calculate score whenever ratings change
  useEffect(() => {
    const ratingsList = Array.from(ratings.values());
    if (ratingsList.length > 0) {
      const score = calculateWeightedScore(ratingsList);
      setCurrentScore(score);
    }
  }, [ratings]);

  const handleRatingChange = (componentId: InspectionComponent, choice: RatingChoice) => {
    const existing = ratings.get(componentId) || {
      component: componentId,
      choice: 'good',
    };
    setRatings(new Map(ratings.set(componentId, { ...existing, choice })));

    // Auto-expand next component
    const currentIndex = INSPECTION_COMPONENTS.findIndex((c) => c.id === componentId);
    if (currentIndex < INSPECTION_COMPONENTS.length - 1) {
      const nextComponent = INSPECTION_COMPONENTS[currentIndex + 1];
      if (!ratings.has(nextComponent.id)) {
        setExpandedComponent(nextComponent.id);
      }
    } else {
      // All done, close all
      setExpandedComponent(null);
    }
  };

  const handleNotesChange = (componentId: InspectionComponent, notes: string) => {
    const existing = ratings.get(componentId);
    if (existing) {
      setRatings(new Map(ratings.set(componentId, { ...existing, notes })));
    }
  };

  const handlePhotosChange = (
    componentId: InspectionComponent,
    newPhotos: PhotoWithMetadata[]
  ) => {
    setPhotos(new Map(photos.set(componentId, newPhotos)));
  };

  const validateForm = (): boolean => {
    const requiredComponents = INSPECTION_COMPONENTS.filter((c) => c.required);
    const missingRatings = requiredComponents.filter((c) => !ratings.has(c.id));

    if (missingRatings.length > 0) {
      const missing = missingRatings.map((c) => c.label).join(', ');
      toast.error(
        genZMode
          ? `Masih ada yang belum diisi: ${missing}`
          : `Please rate: ${missing}`
      );
      setExpandedComponent(missingRatings[0].id);
      return false;
    }

    // Validate "other" choice must have notes
    const otherWithoutNotes = Array.from(ratings.values()).filter(
      (r) => r.choice === 'other' && !r.notes?.trim()
    );

    if (otherWithoutNotes.length > 0) {
      const component = INSPECTION_COMPONENTS.find(
        (c) => c.id === otherWithoutNotes[0].component
      );
      toast.error(
        genZMode
          ? `"${component?.labelGenZ}" pilih "Lainnya" tapi belum dikasih penjelasan!`
          : `"${component?.label}" requires explanation when selecting "Other"`
      );
      setExpandedComponent(otherWithoutNotes[0].component);
      return false;
    }

    // VALIDATE: General photos REQUIRED (min 1)
    if (generalPhotos.length === 0) {
      toast.error(
        genZMode
          ? '📸 Wajib upload minimal 1 foto dokumentasi!'
          : '📸 At least 1 documentation photo is required!'
      );
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
          ? 'Pilih prioritas maintenance dong!'
          : 'Please select maintenance priority'
      );
      return false;
    }

    return true;
  };
// src/components/forms/ComprehensiveInspectionForm.tsx
// HANYA UPDATE BAGIAN handleSubmit

// ===============================================
// REPLACE handleSubmit FUNCTION:
// ===============================================
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

    // Collect all photos from per-component uploads
    const componentPhotos: File[] = [];
    for (const [componentId, componentPhotoList] of photos.entries()) {
      for (const photo of componentPhotoList) {
        componentPhotos.push(photo.file);
      }
    }

    // Collect general photos (mandatory)
    const allGeneralPhotos = generalPhotos.map(p => p.file);

    // Combine all photos
    const allPhotos = [...componentPhotos, ...allGeneralPhotos];
    const totalPhotos = allPhotos.length;

    if (totalPhotos === 0) {
      toast.error(
        genZMode
          ? '📸 Wajib upload minimal 1 foto!'
          : 'Please add at least one photo'
      );
      return;
    }

    console.log(`📸 Total photos to process: ${totalPhotos}`);

    // Step 1: Compress photos
    const toastId = toast.loading(
      genZMode
        ? `🗜️ Kompres ${totalPhotos} foto...`
        : `🗜️ Compressing ${totalPhotos} photos...`
    );

    setUploadProgress({
      current: 0,
      total: totalPhotos,
      percentage: 0
    });

    const compressedPhotos: File[] = [];
    for (let i = 0; i < allPhotos.length; i++) {
      const compressed = await compressImage(allPhotos[i]);
      compressedPhotos.push(compressed);

      // Update compression progress (check mounted)
      if (isMountedRef.current) {
        const compressPercent = Math.round(((i + 1) / totalPhotos) * 50); // 0-50%
        setUploadProgress({
          current: i + 1,
          total: totalPhotos,
          percentage: compressPercent
        });
      }
    }

    console.log(`✅ Compressed ${compressedPhotos.length} photos`);

    // Step 2: Upload compressed photos
    toast.loading(
      genZMode
        ? `☁️ Upload ${totalPhotos} foto...`
        : `☁️ Uploading ${totalPhotos} photos...`,
      { id: toastId }
    );

    const uploadedUrls = await batchUploadToCloudinary(
      compressedPhotos,
      (current: number, total: number) => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          const uploadPercent = 50 + Math.round((current / total) * 50); // 50-100%
          setUploadProgress({
            current: current,
            total: total,
            percentage: uploadPercent
          });

          toast.loading(
            genZMode
              ? `☁️ Upload ${current}/${total} foto...`
              : `☁️ Uploading ${current}/${total} photos...`,
            { id: toastId }
          );
        }
      }
    );

    console.log(`✅ Uploaded ${uploadedUrls.length} photos`);

    // Update toast - saving
    toast.loading(
      genZMode ? '💾 Nyimpen inspection...' : '💾 Saving inspection...',
      { id: toastId }
    );

    setUploadProgress(null); // Clear upload progress

    // Map uploaded URLs back to components
    const updatedRatings = new Map(ratings);
    let photoIndex = 0;

    for (const [componentId, componentPhotoList] of photos.entries()) {
      const rating = updatedRatings.get(componentId);
      if (rating && componentPhotoList.length > 0) {
        // Get the first photo URL for this component
        rating.photo = uploadedUrls[photoIndex];
        updatedRatings.set(componentId, rating);
        photoIndex += componentPhotoList.length;
      }
    }

    // Prepare responses
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
        name: profile?.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email,
        profile_id: profile?.id,
      },
    };

    // ✅ Submit to database with photo URLs (not files!)
    await submitInspection.mutateAsync({
      location_id: locationId,
      user_id: user.id,
      responses,
      photo_urls: uploadedUrls, // ✅ Pass URLs, not files
      notes: generalNotes.trim() || undefined,
      duration_seconds: durationSeconds,
    });

    // Success
    toast.success(
      genZMode
        ? `🎉 Sukses! Score: ${currentScore}`
        : `✅ Inspection saved! Score: ${currentScore}`,
      { id: toastId, duration: 2000 }
    );

    // Navigate back to dashboard (with cleanup-safe timeout)
    navigationTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        navigate('/', { replace: true });
      }
    }, 1500);

  } catch (error: any) {
    console.error('❌ Submission error:', error);
    setUploadProgress(null); // Clear progress on error
    toast.error(
      genZMode
        ? '😢 Gagal submit, coba lagi!'
        : error.message || 'Failed to submit inspection'
    );
  } finally {
    setIsSubmitting(false);
    setUploadProgress(null); // Clear progress
  }
};


  if (locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-700">Location not found</p>
        </div>
      </div>
    );
  }

  const scoreStatus = getScoreStatus(currentScore);
  const completedCount = ratings.size;
  const totalRequired = INSPECTION_COMPONENTS.filter((c) => c.required).length;
  const progress = (completedCount / INSPECTION_COMPONENTS.length) * 100;

  return (
    <div
      className={`min-h-screen pb-32 ${
        genZMode
          ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50'
          : 'bg-gray-50'
      }`}
    >
      {/* Header */}
      <div
        className={`
        sticky top-0 z-20
        ${
          genZMode
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
            : 'bg-white border-b border-gray-200'
        }
        shadow-sm
      `}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-xl ${
                genZMode ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

          </div>

          <div className="flex items-center space-x-3 mb-3">
            <div
              className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl
              ${genZMode ? 'bg-white/20' : 'bg-blue-100'}
            `}
            >
              🚽
            </div>
            <div className={genZMode ? 'text-white' : 'text-gray-900'}>
              <h1 className="font-bold text-lg">{location.name}</h1>
              <p className={`text-sm ${genZMode ? 'text-white/80' : 'text-gray-600'}`}>
                {location.building} • {location.floor} • {location.area}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={genZMode ? 'text-white/90' : 'text-gray-600'}>
                {genZMode
                  ? `Progress ${completedCount}/${INSPECTION_COMPONENTS.length}`
                  : `${completedCount} of ${INSPECTION_COMPONENTS.length} completed`}
              </span>
              {currentScore > 0 && (
                <span className={`font-bold ${genZMode ? 'text-white' : 'text-blue-600'}`}>
                  Score: {currentScore}
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  genZMode ? 'bg-white' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">
        {/* Checklist Components */}
        {INSPECTION_COMPONENTS.map((component) => {
          const rating = ratings.get(component.id);
          const componentPhotos = photos.get(component.id) || [];
          const isExpanded = expandedComponent === component.id;

          return (
            <div key={component.id}>
              {isExpanded ? (
                <RatingSelector
                  config={component}
                  value={rating?.choice || null}
                  onChange={(choice) => handleRatingChange(component.id, choice)}
                  onPhotoAdd={
                    component.allowPhoto
                      ? () => {
                          /* Photo handled below */
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
                    ${
                      rating
                        ? genZMode
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
                          : 'bg-green-50 border-green-500'
                        : genZMode
                          ? 'bg-white/80 border-blue-200 hover:border-blue-400'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {component.iconGenZ}
                    </span>
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

              {/* Per-Component Photo Upload (optional) */}
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

              {isExpanded && (
                <button
                  type="button"
                  onClick={() => setExpandedComponent(null)}
                  className={`
                    w-full mt-2 py-2 rounded-xl text-sm font-medium
                    ${
                      genZMode
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
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

        {/* === GENERAL PHOTO SECTION (MANDATORY) === */}
        {completedCount >= totalRequired && (
          <div
            className={`${
              genZMode ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-blue-50'
            } rounded-2xl p-4 shadow-sm border-2 ${
              genZMode ? 'border-blue-400' : 'border-blue-400'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Camera className={`w-5 h-5 ${genZMode ? 'text-blue-700' : 'text-blue-700'}`} />
              <h3 className="font-bold text-gray-900">
                {genZMode ? '📸 Foto Dokumentasi' : '📸 Documentation Photos'}
                <span className="text-red-500 ml-1">*</span>
              </h3>
            </div>

            <p className={`text-sm mb-4 ${genZMode ? 'text-blue-900' : 'text-blue-900'}`}>
              {genZMode 
                ? '⚠️ WAJIB minimal 1 foto! Auto watermark: Tanggal, Jam, GPS, Nama Toilet.'
                : '⚠️ REQUIRED: Minimum 1 photo! Auto watermark: Date, Time, GPS, Toilet Name.'
              }
            </p>

            <GeneralPhotoUpload
              photos={generalPhotos}
              onPhotosChange={setGeneralPhotos}
              maxPhotos={5}
              genZMode={genZMode}
              locationName={`${location.name} - ${location.building}`}
            />
          </div>
        )}

        {/* Issues Section */}
        <div
          className={`${
            genZMode ? 'bg-white/80' : 'bg-white'
          } rounded-2xl p-4 shadow-sm border border-gray-100`}
        >
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
              placeholder={
                genZMode ? 'Jelasin masalahnya...' : 'Describe the issues found...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          )}
        </div>

        {/* Maintenance Required */}
        <div
          className={`${
            genZMode ? 'bg-white/80' : 'bg-white'
          } rounded-2xl p-4 shadow-sm border border-gray-100`}
        >
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
                    ${
                      maintenancePriority === priority
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
        <div
          className={`${
            genZMode ? 'bg-white/80' : 'bg-white'
          } rounded-2xl p-4 shadow-sm border border-gray-100`}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {genZMode ? '📝 Catatan tambahan (opsional)' : 'General Notes (Optional)'}
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder={
              genZMode ? 'Ada yang mau ditambahin?' : 'Any additional observations...'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>
      </div>




{/* Upload Progress Indicator */}
{uploadProgress && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      {/* Progress Title */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg 
            className="w-8 h-8 text-blue-600 animate-spin" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {genZMode ? 'Upload Foto...' : 'Uploading Photos...'}
        </h3>
        <p className="text-sm text-gray-600">
          {uploadProgress.current} of {uploadProgress.total} photos
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress.percentage}%` }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold text-blue-600">
            {uploadProgress.percentage}%
          </span>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center mt-4">
        {genZMode 
          ? 'Sabar ya, lagi upload...' 
          : 'Please wait while we upload your photos...'}
      </p>
    </div>
  </div>
)}

{/* Upload Progress Indicator */}
{uploadProgress && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    {/* ... full progress UI dari artifact ... */}
  </div>
)}

      {/* Submit Button (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || completedCount < totalRequired || generalPhotos.length === 0}
          className={`
            w-full py-4 rounded-xl font-bold text-white transition-all
            ${
              isSubmitting || completedCount < totalRequired || generalPhotos.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : genZMode
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                  : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isSubmitting
            ? uploadProgress.total > 0
              ? genZMode
                ? `📸 Upload ${uploadProgress.current}/${uploadProgress.total}...`
                : `Uploading ${uploadProgress.current}/${uploadProgress.total} photos...`
              : genZMode
                ? '⏳ Submitting...'
                : 'Submitting...'
            : genZMode
              ? `🚀 Submit (Score: ${currentScore})`
              : `Submit Inspection (Score: ${currentScore})`}
        </button>

        {(completedCount < totalRequired || generalPhotos.length === 0) && (
          <div className="text-center text-sm text-red-600 mt-2 space-y-1">
            {completedCount < totalRequired && (
              <p>
                {genZMode
                  ? `❌ Masih kurang ${totalRequired - completedCount} komponen wajib`
                  : `❌ ${totalRequired - completedCount} required components remaining`}
              </p>
            )}
            {generalPhotos.length === 0 && (
              <p>
                {genZMode
                  ? '📸 Wajib upload minimal 1 foto dokumentasi'
                  : '📸 At least 1 documentation photo required'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};