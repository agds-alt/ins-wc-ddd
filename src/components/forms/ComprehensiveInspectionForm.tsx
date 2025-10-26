// src/components/forms/ComprehensiveInspectionForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { EnhancedPhotoUpload } from './EnhancedPhotoUpload';
import { useAuth } from '../../hooks/useAuth';
import { useInspection } from '../../hooks/useInspection';

interface ComprehensiveInspectionFormProps {
  locationId: string;
  genZMode?: boolean;
  onToggleMode?: () => void;
}

export const ComprehensiveInspectionForm = ({
  locationId,
  genZMode = false,
  onToggleMode,
}: ComprehensiveInspectionFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getLocation, submitInspection } = useInspection();

  // Form state
  const [ratings, setRatings] = useState<Map<InspectionComponent, ComponentRating>>(new Map());
  const [photos, setPhotos] = useState<Map<InspectionComponent, PhotoWithMetadata[]>>(new Map());
  const [generalNotes, setGeneralNotes] = useState('');
  const [issuesFound, setIssuesFound] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [requiresMaintenance, setRequiresMaintenance] = useState(false);
  const [maintenancePriority, setMaintenancePriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('low');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [currentScore, setCurrentScore] = useState(0);
  const [expandedComponent, setExpandedComponent] = useState<InspectionComponent | null>(
    INSPECTION_COMPONENTS[0].id
  );

  const { data: location, isLoading: locationLoading } = getLocation(locationId);

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

      // Prepare responses
      const responses = {
        ratings: Array.from(ratings.values()),
        issues: issuesFound ? { description: issueDescription } : null,
        maintenance: requiresMaintenance
          ? { required: true, priority: maintenancePriority }
          : null,
        inspection_mode: genZMode ? 'genz' : 'professional',
      };

      // Submit inspection
      await submitInspection.mutateAsync({
        location_id: locationId,
        user_id: user.id,
        responses,
        photos: Array.from(photos.values())
          .flat()
          .map((p) => p.file),
        notes: generalNotes,
      });

      toast.success(
        genZMode
          ? `🎉 Inspection selesai! Score: ${currentScore}`
          : `Inspection submitted successfully! Score: ${currentScore}`
      );

      // Navigate back
      navigate('/scan');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
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
          ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'
          : 'bg-gray-50'
      }`}
    >
      {/* Header */}
      <div
        className={`
        sticky top-0 z-20 
        ${
          genZMode
            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
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

            {/* Mode Toggle */}
            {onToggleMode && (
              <button
                onClick={onToggleMode}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${
                    genZMode
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

          {/* Progress Bar */}
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
                    ${
                      rating
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
                    <span className="text-2xl">
                      {genZMode ? component.iconGenZ : component.icon}
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

              {/* Photo Upload (shown when expanded and photos allowed) */}
              {isExpanded && component.allowPhoto && (
                <div className="mt-3">
                  <EnhancedPhotoUpload
                    componentId={component.id}
                    photos={componentPhotos}
                    onPhotosChange={(PhotoWithMetadata) => handlePhotosChange(component.id, PhotoWithMetadata)}
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
                    ${
                      genZMode
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

        {/* Photo Preview Section */}
        {Array.from(photos.values()).flat().length > 0 && (
          <div
            className={`${
              genZMode ? 'bg-white/80' : 'bg-white'
            } rounded-2xl p-4 shadow-sm border border-gray-100`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {genZMode ? '📸 Foto yang akan diupload' : '📸 Photos to Upload'}
              </h3>
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  genZMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {Array.from(photos.values()).flat().length} photos
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || completedCount < totalRequired}
          className={`
            w-full py-4 rounded-xl font-bold text-white transition-all
            ${
              isSubmitting || completedCount < totalRequired
                ? 'bg-gray-300 cursor-not-allowed'
                : genZMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isSubmitting
            ? genZMode
              ? '⏳ Submitting...'
              : 'Submitting...'
            : genZMode
              ? `🚀 Submit (Score: ${currentScore})`
              : `Submit Inspection (Score: ${currentScore})`}
        </button>

        {completedCount < totalRequired && (
          <p className="text-center text-sm text-red-600 mt-2">
            {genZMode
              ? `Masih kurang ${totalRequired - completedCount} komponen wajib!`
              : `${totalRequired - completedCount} required components remaining`}
          </p>
        )}
      </div>
    </div>
  );
};