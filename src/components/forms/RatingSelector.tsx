// src/components/forms/RatingSelector.tsx
import { useState } from 'react';
import { InspectionComponentConfig, RatingChoice } from '../../types/inspection.types';
import { Camera, MessageSquare } from 'lucide-react';
import * as Icons from 'lucide-react';

interface RatingSelectorProps {
  config: InspectionComponentConfig;
  value: RatingChoice | null;
  onChange: (choice: RatingChoice) => void;
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
  const [showNotes, setShowNotes] = useState(value === 'other');
  const choices = genZMode ? config.choices.genZ : config.choices.professional;
  const label = genZMode ? config.labelGenZ : config.label;

  // Get Lucide icon component for professional mode
  const IconComponent = !genZMode && config.icon ? (Icons as any)[config.icon] : null;

  // Auto-show notes when "other" is selected
  const handleChoiceChange = (choice: RatingChoice) => {
    onChange(choice);
    if (choice === 'other') {
      setShowNotes(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${genZMode ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-blue-50'}
          `}
          >
            {genZMode ? (
              config.iconGenZ
            ) : IconComponent ? (
              <IconComponent className="w-6 h-6 text-blue-600" />
            ) : (
              config.icon
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${genZMode ? 'text-purple-900' : 'text-gray-900'}`}>
              {label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {!config.required && <span className="text-xs text-gray-500">Optional</span>}
          </div>
        </div>

        {/* Photo Button */}
        {config.allowPhoto && (
          <button
            type="button"
            onClick={onPhotoAdd}
            className={`
              p-2 rounded-xl transition-all
              ${
                hasPhoto
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

      {/* 3-Choice Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['good', 'normal', 'bad'] as RatingChoice[]).map((choice) => {
          const isSelected = value === choice;
          const buttonStyle = getChoiceStyle(choice, isSelected, genZMode);

          return (
            <button
              key={choice}
              type="button"
              onClick={() => handleChoiceChange(choice)}
              className={`
                py-3 px-2 rounded-xl text-center transition-all
                border-2 font-medium text-sm
                ${buttonStyle}
                ${isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xl">{getChoiceEmoji(choice, config.category)}</span>
                <span className="leading-tight">{choices[choice]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Other Button (Full Width) */}
      <button
        type="button"
        onClick={() => handleChoiceChange('other')}
        className={`
          w-full py-3 rounded-xl text-center transition-all
          border-2 font-medium text-sm flex items-center justify-center space-x-2
          ${
            value === 'other'
              ? genZMode
                ? 'bg-purple-50 border-purple-400 text-purple-700'
                : 'bg-blue-50 border-blue-400 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
          }
        `}
      >
        <MessageSquare className="w-4 h-4" />
        <span>{choices.other}</span>
      </button>

      {/* Notes Section (Required for "other") */}
      {showNotes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <textarea
            value={notes || ''}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder={
              value === 'other'
                ? genZMode
                  ? 'Jelasin detailnya dong...'
                  : 'Please specify the details...'
                : genZMode
                  ? 'Catatan tambahan (opsional)...'
                  : 'Additional notes (optional)...'
            }
            className={`
              w-full px-3 py-2 border rounded-xl focus:ring-2 resize-none
              ${
                value === 'other'
                  ? 'border-orange-300 focus:ring-orange-500 focus:border-orange-500'
                  : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
              }
            `}
            rows={3}
            required={value === 'other'}
          />
          {value !== 'other' && (
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="text-sm text-gray-500 hover:text-gray-700 mt-1"
            >
              × Hide notes
            </button>
          )}
        </div>
      )}

      {/* Show notes toggle (only when not "other" and notes hidden) */}
      {value && value !== 'other' && !showNotes && (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className={`
            w-full mt-3 py-2 text-sm font-medium rounded-xl
            ${
              genZMode
                ? 'text-purple-600 hover:bg-purple-50'
                : 'text-blue-600 hover:bg-blue-50'
            }
          `}
        >
          + Add notes
        </button>
      )}
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getChoiceStyle = (
  choice: RatingChoice,
  isSelected: boolean,
  genZMode: boolean
): string => {
  if (!isSelected) {
    return 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50';
  }

  if (genZMode) {
    switch (choice) {
      case 'good':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-900';
      case 'normal':
        return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 text-yellow-900';
      case 'bad':
        return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400 text-red-900';
      default:
        return 'bg-white border-gray-200 text-gray-700';
    }
  } else {
    switch (choice) {
      case 'good':
        return 'bg-green-50 border-green-500 text-green-900';
      case 'normal':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'bad':
        return 'bg-red-50 border-red-500 text-red-900';
      default:
        return 'bg-white border-gray-200 text-gray-700';
    }
  }
};

const getChoiceEmoji = (
  choice: RatingChoice,
  category: 'aroma' | 'visual' | 'availability' | 'functional'
): string => {
  // Aroma category
  if (category === 'aroma') {
    switch (choice) {
      case 'good':
        return '🌸';
      case 'normal':
        return '😐';
      case 'bad':
        return '🤢';
    }
  }

  // Visual category
  if (category === 'visual') {
    switch (choice) {
      case 'good':
        return '✨';
      case 'normal':
        return '😐';
      case 'bad':
        return '💩';
    }
  }

  // Availability category
  if (category === 'availability') {
    switch (choice) {
      case 'good':
        return '✅';
      case 'normal':
        return '⚠️';
      case 'bad':
        return '❌';
    }
  }

  // Functional category
  if (category === 'functional') {
    switch (choice) {
      case 'good':
        return '✅';
      case 'normal':
        return '⚠️';
      case 'bad':
        return '❌';
    }
  }

  return '💬';
};