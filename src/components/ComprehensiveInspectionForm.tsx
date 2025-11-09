/**
 * Comprehensive Inspection Form
 * Modern inspection form with 5-star rating system
 * Optimized for Next.js 15 + React 19 + tRPC
 */

'use client';

import { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Camera } from 'lucide-react';
import {
  INSPECTION_COMPONENTS,
  calculateWeightedScore,
  getScoreStatus,
  type InspectionComponent,
  type ComponentRating,
  type StarRating,
  type PhotoWithMetadata,
} from '@/types/inspection.types';
import { StarRating as StarRatingComponent } from './StarRating';
import { PhotoUpload } from './PhotoUpload';
import { trpc } from '@/lib/trpc/client';
import { compressImage, batchUploadToCloudinary } from '@/lib/cloudinary';

interface ComprehensiveInspectionFormProps {
  locationId: string;
  locationName: string;
  buildingName: string;
  floor: string;
  area: string;
}

const ComprehensiveInspectionFormComponent = ({
  locationId,
  locationName,
  buildingName,
  floor,
  area,
}: ComprehensiveInspectionFormProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Fetch default inspection template
  const { data: defaultTemplate, isLoading: loadingTemplate } = trpc.template.getDefault.useQuery();

  // Form state
  const [ratings, setRatings] = useState<Map<InspectionComponent, ComponentRating>>(new Map());
  const [photos, setPhotos] = useState<Map<InspectionComponent, PhotoWithMetadata[]>>(new Map());
  const [generalPhotos, setGeneralPhotos] = useState<PhotoWithMetadata[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [expandedComponent, setExpandedComponent] = useState<InspectionComponent | null>(
    INSPECTION_COMPONENTS[0].id
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);

  // Calculate current score
  const currentScore = useMemo(() => {
    const ratingsList = Array.from(ratings.values());
    if (ratingsList.length === 0) return 0;
    return calculateWeightedScore(ratingsList);
  }, [ratings]);

  const scoreStatus = useMemo(() => getScoreStatus(currentScore), [currentScore]);

  // Calculate progress
  const completedCount = ratings.size;
  const totalRequired = INSPECTION_COMPONENTS.filter((c) => c.required).length;
  const progress = (completedCount / INSPECTION_COMPONENTS.length) * 100;

  // Handle rating change
  const handleRatingChange = (componentId: InspectionComponent, rating: StarRating) => {
    const existing = ratings.get(componentId);
    setRatings(new Map(ratings.set(componentId, {
      component: componentId,
      rating,
      notes: existing?.notes,
      photo: existing?.photo,
    })));

    // Auto-expand next component
    const currentIndex = INSPECTION_COMPONENTS.findIndex((c) => c.id === componentId);
    if (currentIndex < INSPECTION_COMPONENTS.length - 1) {
      const nextComponent = INSPECTION_COMPONENTS[currentIndex + 1];
      if (!ratings.has(nextComponent.id)) {
        setExpandedComponent(nextComponent.id);
      }
    } else {
      // All done
      setExpandedComponent(null);
    }
  };

  // Handle notes change
  const handleNotesChange = (componentId: InspectionComponent, notes: string) => {
    const existing = ratings.get(componentId);
    if (existing) {
      setRatings(new Map(ratings.set(componentId, { ...existing, notes })));
    }
  };

  // Handle photos change
  const handlePhotosChange = (componentId: InspectionComponent, newPhotos: PhotoWithMetadata[]) => {
    setPhotos(new Map(photos.set(componentId, newPhotos)));
  };

  // Validate form
  const validateForm = (): boolean => {
    const requiredComponents = INSPECTION_COMPONENTS.filter((c) => c.required);
    const missingRatings = requiredComponents.filter((c) => !ratings.has(c.id));

    if (missingRatings.length > 0) {
      const missing = missingRatings.map((c) => c.label).join(', ');
      toast.error(`Please rate: ${missing}`);
      setExpandedComponent(missingRatings[0].id);
      return false;
    }

    // Validate general photos (minimum 1)
    if (generalPhotos.length === 0) {
      toast.error('📸 At least 1 documentation photo is required!');
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Collect all photos
      const componentPhotos: File[] = [];
      for (const photoList of photos.values()) {
        for (const photo of photoList) {
          componentPhotos.push(photo.file);
        }
      }

      const allPhotos = [...componentPhotos, ...generalPhotos.map((p) => p.file)];
      const totalPhotos = allPhotos.length;

      console.log(`📸 Total photos to process: ${totalPhotos}`);

      // Step 1: Compress photos
      const toastId = toast.loading(`🗜️ Compressing ${totalPhotos} photos...`);

      setUploadProgress({
        current: 0,
        total: totalPhotos,
        percentage: 0,
      });

      const compressedPhotos: File[] = [];
      for (let i = 0; i < allPhotos.length; i++) {
        const compressed = await compressImage(allPhotos[i]);
        compressedPhotos.push(compressed);

        const compressPercent = Math.round(((i + 1) / totalPhotos) * 50);
        setUploadProgress({
          current: i + 1,
          total: totalPhotos,
          percentage: compressPercent,
        });
      }

      console.log(`✅ Compressed ${compressedPhotos.length} photos`);

      // Step 2: Upload to Cloudinary
      toast.loading(`☁️ Uploading ${totalPhotos} photos...`, { id: toastId });

      const uploadedUrls = await batchUploadToCloudinary(
        compressedPhotos,
        (current: number, total: number) => {
          const uploadPercent = 50 + Math.round((current / total) * 50);
          setUploadProgress({
            current,
            total,
            percentage: uploadPercent,
          });

          toast.loading(`☁️ Uploading ${current}/${total} photos...`, { id: toastId });
        }
      );

      console.log(`✅ Uploaded ${uploadedUrls.length} photos`);

      toast.loading('💾 Saving inspection...', { id: toastId });
      setUploadProgress(null);

      // Map photo URLs to components
      const updatedRatings = new Map(ratings);
      let photoIndex = 0;

      for (const [componentId, photoList] of photos.entries()) {
        const rating = updatedRatings.get(componentId);
        if (rating && photoList.length > 0) {
          rating.photo = uploadedUrls[photoIndex];
          updatedRatings.set(componentId, rating);
          photoIndex += photoList.length;
        }
      }

      // Prepare submission data
      const responses = {
        ratings: Array.from(updatedRatings.values()),
        score: currentScore,
        general_notes: generalNotes.trim() || null,
        submitted_at: new Date().toISOString(),
      };

      // Determine overall status from score
      let overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
      if (currentScore >= 85) overallStatus = 'excellent';
      else if (currentScore >= 70) overallStatus = 'good';
      else if (currentScore >= 50) overallStatus = 'fair';
      else overallStatus = 'poor';

      // Check if template is loaded
      if (!defaultTemplate) {
        throw new Error('Inspection template not found. Please run /api/seed first.');
      }

      // Submit via tRPC
      await utils.client.inspection.create.mutate({
        location_id: locationId,
        template_id: defaultTemplate.id,
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        overall_status: overallStatus,
        responses,
        photo_urls: uploadedUrls,
        notes: generalNotes.trim() || undefined,
        duration_seconds: durationSeconds,
      });

      toast.success(`✅ Inspection saved! Score: ${currentScore}`, {
        id: toastId,
        duration: 2000,
      });

      // Navigate back
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Submission error:', error);
      setUploadProgress(null);
      toast.error(error.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  // Show loading while template is being fetched
  if (loadingTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-gray-600">Loading inspection form...</p>
        </div>
      </div>
    );
  }

  // Show error if template not found
  if (!defaultTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-3">Template Not Found</h2>
          <p className="text-gray-600 mb-6">
            The inspection template is not configured. Please contact your administrator or run the
            seed script.
          </p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-100">
              🚽
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">{locationName}</h1>
              <p className="text-sm text-gray-600">
                {buildingName} • {floor} • {area}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {completedCount} of {INSPECTION_COMPONENTS.length} completed
              </span>
              {currentScore > 0 && (
                <span className="font-bold text-blue-600">Score: {currentScore}</span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">
        {/* Components */}
        {INSPECTION_COMPONENTS.map((component) => {
          const rating = ratings.get(component.id);
          const componentPhotos = photos.get(component.id) || [];
          const isExpanded = expandedComponent === component.id;

          return (
            <div key={component.id}>
              {isExpanded ? (
                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-blue-500">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">{component.iconGenZ}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{component.label}</h3>
                      {component.description && (
                        <p className="text-sm text-gray-600">{component.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <StarRatingComponent
                    value={rating?.rating || null}
                    onChange={(newRating) => handleRatingChange(component.id, newRating)}
                    size="lg"
                    showLabel
                  />

                  {/* Notes */}
                  <textarea
                    value={rating?.notes || ''}
                    onChange={(e) => handleNotesChange(component.id, e.target.value)}
                    placeholder="Additional notes (optional)..."
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={2}
                  />

                  {/* Photo Upload */}
                  {component.allowPhoto && (
                    <div className="mt-3">
                      <PhotoUpload
                        photos={componentPhotos}
                        onPhotosChange={(newPhotos) => handlePhotosChange(component.id, newPhotos)}
                        maxPhotos={3}
                        componentId={component.id}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedComponent(null)}
                    className="w-full mt-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    ↑ Collapse
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setExpandedComponent(component.id)}
                  className={`
                    w-full p-4 rounded-2xl flex items-center justify-between
                    transition-all border-2
                    ${rating
                      ? 'bg-green-50 border-green-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{component.iconGenZ}</span>
                    <span className="font-medium text-gray-900">{component.label}</span>
                  </div>
                  {rating ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : component.required ? (
                    <span className="text-red-500">*</span>
                  ) : null}
                </button>
              )}
            </div>
          );
        })}

        {/* General Photo Upload (Mandatory) */}
        {completedCount >= totalRequired && (
          <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border-2 border-blue-400">
            <div className="flex items-center space-x-2 mb-2">
              <Camera className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-gray-900">
                📸 Documentation Photos
                <span className="text-red-500 ml-1">*</span>
              </h3>
            </div>

            <p className="text-sm text-blue-900 mb-4">
              ⚠️ REQUIRED: Minimum 1 photo with GPS metadata
            </p>

            <PhotoUpload
              photos={generalPhotos}
              onPhotosChange={setGeneralPhotos}
              maxPhotos={5}
              locationName={`${locationName} - ${buildingName}`}
            />
          </div>
        )}

        {/* General Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 General Notes (Optional)
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Any additional observations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Upload Progress Modal */}
      {uploadProgress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Uploading Photos...</h3>
              <p className="text-sm text-gray-600">
                {uploadProgress.current} of {uploadProgress.total} photos
              </p>
            </div>

            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              <div className="mt-2 text-center">
                <span className="text-2xl font-bold text-blue-600">
                  {uploadProgress.percentage}%
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Please wait while we upload your photos...
            </p>
          </div>
        </div>
      )}

      {/* Submit Button (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting || completedCount < totalRequired || generalPhotos.length === 0
          }
          className={`
            w-full py-4 rounded-xl font-bold text-white transition-all
            ${isSubmitting || completedCount < totalRequired || generalPhotos.length === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isSubmitting
            ? uploadProgress
              ? `📸 Uploading ${uploadProgress.current}/${uploadProgress.total}...`
              : '⏳ Submitting...'
            : `Submit Inspection (Score: ${currentScore} ${scoreStatus.emoji})`
          }
        </button>

        {(completedCount < totalRequired || generalPhotos.length === 0) && (
          <div className="text-center text-sm text-red-600 mt-2 space-y-1">
            {completedCount < totalRequired && (
              <p>❌ {totalRequired - completedCount} required components remaining</p>
            )}
            {generalPhotos.length === 0 && (
              <p>📸 At least 1 documentation photo required</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ComprehensiveInspectionForm = memo(ComprehensiveInspectionFormComponent);
