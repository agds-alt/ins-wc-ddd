/**
 * StarRating Component
 * Interactive 5-star rating selector with animations
 */

'use client';

import { Star } from 'lucide-react';
import { memo } from 'react';
import type { StarRating as StarRatingType } from '@/types/inspection.types';

interface StarRatingProps {
  value: StarRatingType | null;
  onChange: (rating: StarRatingType) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showLabel?: boolean;
  genZMode?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const StarRatingComponent = ({
  value,
  onChange,
  size = 'lg',
  disabled = false,
  showLabel = true,
  genZMode = false,
}: StarRatingProps) => {
  const stars = [1, 2, 3, 4, 5] as StarRatingType[];

  const getLabel = (rating: StarRatingType): string => {
    const labels: Record<StarRatingType, { professional: string; genZ: string }> = {
      1: { professional: 'Very Bad', genZ: 'Sangat Buruk ☹️' },
      2: { professional: 'Bad', genZ: 'Buruk 😞' },
      3: { professional: 'Fair', genZ: 'Cukup 😐' },
      4: { professional: 'Good', genZ: 'Baik 🙂' },
      5: { professional: 'Excellent', genZ: 'Sangat Baik! 🌟' },
    };

    return genZMode ? labels[rating].genZ : labels[rating].professional;
  };

  const getColor = (rating: StarRatingType): string => {
    if (rating <= 2) return 'text-red-500';
    if (rating === 3) return 'text-yellow-500';
    if (rating === 4) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-3">
      {/* Stars */}
      <div className="flex items-center justify-center gap-2">
        {stars.map((star) => {
          const isSelected = value !== null && star <= value;

          return (
            <button
              key={star}
              type="button"
              onClick={() => !disabled && onChange(star)}
              disabled={disabled}
              className={`
                transition-all duration-200 transform
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95 cursor-pointer'}
                ${isSelected ? 'scale-110' : 'scale-100'}
              `}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  transition-all duration-200
                  ${isSelected
                    ? `fill-current ${value ? getColor(value) : 'text-gray-300'}`
                    : 'text-gray-300'
                  }
                `}
                strokeWidth={isSelected ? 0 : 2}
              />
            </button>
          );
        })}
      </div>

      {/* Label */}
      {showLabel && value !== null && (
        <div className="text-center">
          <p className={`
            text-sm font-medium transition-all duration-200
            ${getColor(value)}
          `}>
            {getLabel(value)}
          </p>
        </div>
      )}
    </div>
  );
};

export const StarRating = memo(StarRatingComponent);
