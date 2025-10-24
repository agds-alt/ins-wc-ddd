// src/components/forms/RatingSelector.tsx
import { useState } from 'react';
import { InspectionComponentConfig, RatingLevel } from '../../types/inspection.types';
import { Camera } from 'lucide-react';

interface RatingSelectorProps {
  config: InspectionComponentConfig;
  value: RatingLevel | null;
  onChange: (rating: RatingLevel) => void;
  onPhotoAdd?: () => void;
  hasPhoto?: boolean;
  genZMode?: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

export const RatingSelector = ({
  config,
  value,
  onChange,
  onPhotoAdd,
  hasPhoto,
  genZMode = false,
  notes,
  onNotesChange,
}: RatingSelectorProps) => {
  const [showNotes, setShowNotes] = useState(false);
  const labels = genZMode ? config.ratingLabels.genZ : config.ratingLabels.professional;
  const icon = genZMode ? config.iconGenZ : config.icon;
  const label = genZMode ? config.labelGenZ : config.label;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${genZMode ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-blue-50'}
          `}>
            {icon}
          </div>
          <div>
            <h3 className={`font-semibold ${genZMode ? 'text-purple-900' : 'text-gray-900'}`}>
              {label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {!config.required && (
              <span className="text-xs text-gray-500">Optional</span>
            )}
          </div>
        </div>

        {/* Photo Button */}
        {config.allowPhoto && (
          <button
            type="button"
            onClick={onPhotoAdd}
            className={`
              p-2 rounded-xl transition-all
              ${hasPhoto 
                ? 'bg-green-100 text-green-600' 
                : genZMode 
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Rating Buttons */}
      <div className="space-y-2">
        {([1, 2, 3, 4, 5] as RatingLevel[]).map((rating) => {
          const isSelected = value === rating;
          const ratingColor = getRatingColor(rating, genZMode);

          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`
                w-full p-3 rounded-xl text-left transition-all
                border-2 flex items-center justify-between
                ${isSelected
                  ? `${ratingColor.bg} ${ratingColor.border} ${ratingColor.text} shadow-md scale-[1.02]`
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span className="font-medium">{labels[rating]}</span>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-lg
                ${isSelected ? 'bg-white/30' : 'bg-gray-100'}
              `}>
                {getRatingEmoji(rating)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes Section */}
      {value && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showNotes ? '− Hide notes' : '+ Add notes'}
          </button>

          {showNotes && (
            <textarea
              value={notes || ''}
              onChange={(e) => onNotesChange?.(e.target.value)}
              placeholder={genZMode ? "Catatan tambahan (optional)..." : "Additional notes (optional)..."}
              className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getRatingColor = (rating: RatingLevel, genZMode: boolean) => {
  if (genZMode) {
    switch (rating) {
      case 5:
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-green-400',
          text: 'text-green-900',
        };
      case 4:
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
          border: 'border-blue-400',
          text: 'text-blue-900',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
          border: 'border-yellow-400',
          text: 'text-yellow-900',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-red-50',
          border: 'border-orange-400',
          text: 'text-orange-900',
        };
      case 1:
        return {
          bg: 'bg-gradient-to-br from-red-50 to-pink-50',
          border: 'border-red-400',
          text: 'text-red-900',
        };
    }
  } else {
    switch (rating) {
      case 5:
        return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900' };
      case 4:
        return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900' };
      case 3:
        return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900' };
      case 2:
        return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900' };
      case 1:
        return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900' };
    }
  }
};

const getRatingEmoji = (rating: RatingLevel): string => {
  switch (rating) {
    case 5: return '🌟';
    case 4: return '😊';
    case 3: return '😐';
    case 2: return '😟';
    case 1: return '😨';
  }
};