// src/components/forms/InspectionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { EnhancedPhotoUpload } from './EnhancedPhotoUpload';
import { useInspection } from '../../hooks/useInspection';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
// InspectionForm.tsx
import { PhotoWithMetadata } from '../../types/photo.types';

const [photos, setPhotos] = useState<PhotoWithMetadata[]>([]);

// Schema berdasarkan inspection_templates.fields 
const inspectionSchema = z.object({
  cleanliness: z.enum(['excellent', 'good', 'fair', 'poor', 'very_poor']),
  toilet_paper: z.boolean(),
  soap_supply: z.boolean(),
  hand_dryer: z.boolean(),
  water_supply: z.boolean(),
  drainage: z.boolean(),
  ventilation: z.boolean(),
  lighting: z.boolean(),
  damage_reported: z.boolean(),
  damage_notes: z.string().optional(),
  additional_notes: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
  locationId: string;
  onComplete: () => void;
}

// PASTIKAN ADA export di sini
export const InspectionForm = ({ locationId, onComplete }: InspectionFormProps) => {
  const { user } = useAuth();
  const { getLocation, submitInspection } = useInspection();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: location } = getLocation(locationId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      cleanliness: 'good',
      toilet_paper: true,
      soap_supply: true,
      hand_dryer: true,
      water_supply: true,
      drainage: true,
      ventilation: true,
      lighting: true,
      damage_reported: false,
    },
  });

  const hasDamage = watch('damage_reported');

  const onSubmit = async (data: InspectionFormData) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitInspection.mutateAsync({
        location_id: locationId,
        user_id: user.id,
        responses: data,
        photos: photos,
        notes: data.additional_notes,
      });

      toast.success('Inspection submitted successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🚽</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">{location.name}</h1>
            <p className="text-sm text-gray-600">
              {location.building} • {location.floor} • {location.area}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-6">
        {/* Cleanliness Rating */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cleanliness Rating
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { value: 'excellent', label: 'Excellent', emoji: '😊' },
              { value: 'good', label: 'Good', emoji: '🙂' },
              { value: 'fair', label: 'Fair', emoji: '😐' },
              { value: 'poor', label: 'Poor', emoji: '😕' },
              { value: 'very_poor', label: 'Very Poor', emoji: '😞' },
            ].map((option) => (
              <label key={option.value} className="text-center">
                <input
                  type="radio"
                  value={option.value}
                  {...register('cleanliness')}
                  className="hidden"
                />
                <div className={`
                  p-2 rounded-xl border-2 cursor-pointer transition-all
                  ${watch('cleanliness') === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-xs font-medium text-gray-700">
                    {option.label}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.cleanliness && (
            <p className="mt-1 text-sm text-red-600">{errors.cleanliness.message}</p>
          )}
        </div>

        {/* Supplies Check */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Supplies & Facilities
          </label>
          <div className="space-y-3">
            {[
              { id: 'toilet_paper', label: 'Toilet Paper Available', emoji: '🧻' },
              { id: 'soap_supply', label: 'Soap Available', emoji: '🧴' },
              { id: 'hand_dryer', label: 'Hand Dryer Working', emoji: '🌬️' },
              { id: 'water_supply', label: 'Water Supply Normal', emoji: '💧' },
              { id: 'drainage', label: 'Drainage Working', emoji: '🔄' },
              { id: 'ventilation', label: 'Good Ventilation', emoji: '💨' },
              { id: 'lighting', label: 'Adequate Lighting', emoji: '💡' },
            ].map((item) => (
              <label key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <input
                  type="checkbox"
                  {...register(item.id as any)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Damage Report */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Damage Reported</span>
            <input
              type="checkbox"
              {...register('damage_reported')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          
          {hasDamage && (
            <div className="mt-3">
              <textarea
                {...register('damage_notes')}
                placeholder="Describe the damage or issues found..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <EnhancedPhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={5}
          />
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Additional Notes
          </label>
          <textarea
            {...register('additional_notes')}
            placeholder="Any additional comments or observations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </form>
  );
};

// PASTIKAN ADA EXPORT DI SINI!
export default InspectionForm; // ← ATAU INI
// export { InspectionForm }; // ← ATAU INI