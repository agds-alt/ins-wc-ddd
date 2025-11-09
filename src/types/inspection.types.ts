// src/types/inspection.types.ts
export type InspectionComponent =
  | 'aroma'
  | 'floor_cleanliness'
  | 'wall_condition'
  | 'sink_condition'
  | 'mirror_condition'
  | 'toilet_condition'
  | 'urinal_condition'
  | 'soap_availability'
  | 'tissue_availability'
  | 'air_freshener'
  | 'trash_bin_condition';

// NEW: Star rating system 1-5
export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface ComponentRating {
  component: InspectionComponent;
  rating: StarRating; // 1 = Very Bad, 2 = Bad, 3 = Fair, 4 = Good, 5 = Excellent
  notes?: string; // Optional notes for additional context
  photo?: string; // Optional photo URL after upload
}

export type ComponentCategory = 'aroma' | 'visual' | 'availability' | 'functional';

export interface InspectionComponentConfig {
  id: InspectionComponent;
  category: ComponentCategory;
  label: string;
  labelGenZ: string;
  weight: number;
  icon: string; // Lucide icon name for professional mode
  iconGenZ: string; // Emoji for GenZ mode
  required: boolean;
  allowPhoto: boolean;
  description?: string; // Optional description for guidance
}

// ============================================
// INSPECTION COMPONENTS CONFIGURATION
// ============================================

export const INSPECTION_COMPONENTS: InspectionComponentConfig[] = [
  // AROMA CATEGORY
  {
    id: 'aroma',
    category: 'aroma',
    label: 'Aroma/Odor Level',
    labelGenZ: 'Bau-bauan',
    weight: 0.15,
    icon: 'Nose',
    iconGenZ: '👃',
    required: true,
    allowPhoto: false,
    description: 'Rate the overall smell/odor of the restroom',
  },

  // VISUAL CLEANLINESS CATEGORY
  {
    id: 'floor_cleanliness',
    category: 'visual',
    label: 'Floor Cleanliness',
    labelGenZ: 'Kebersihan Lantai',
    weight: 0.12,
    icon: 'Droplets',
    iconGenZ: '✨',
    required: true,
    allowPhoto: true,
    description: 'Check if the floor is clean and dry',
  },
  {
    id: 'wall_condition',
    category: 'visual',
    label: 'Wall & Tile Condition',
    labelGenZ: 'Kondisi Dinding',
    weight: 0.08,
    icon: 'Square',
    iconGenZ: '🎨',
    required: true,
    allowPhoto: true,
    description: 'Check walls and tiles for cleanliness and damage',
  },
  {
    id: 'mirror_condition',
    category: 'visual',
    label: 'Mirror Cleanliness',
    labelGenZ: 'Kebersihan Cermin',
    weight: 0.06,
    icon: 'Mirror',
    iconGenZ: '🪞',
    required: true,
    allowPhoto: false,
    description: 'Check if mirrors are clean and free of spots',
  },
  {
    id: 'toilet_condition',
    category: 'visual',
    label: 'Toilet Bowl Condition',
    labelGenZ: 'Kondisi Kloset',
    weight: 0.15,
    icon: 'Droplet',
    iconGenZ: '🚽',
    required: true,
    allowPhoto: true,
    description: 'Check toilet bowl cleanliness',
  },
  {
    id: 'trash_bin_condition',
    category: 'visual',
    label: 'Trash Bin Condition',
    labelGenZ: 'Kondisi Tempat Sampah',
    weight: 0.06,
    icon: 'Trash2',
    iconGenZ: '🗑️',
    required: true,
    allowPhoto: false,
    description: 'Check if trash bins are empty and clean',
  },

  // FUNCTIONAL CATEGORY
  {
    id: 'sink_condition',
    category: 'functional',
    label: 'Sink & Faucet Condition',
    labelGenZ: 'Kondisi Wastafel',
    weight: 0.10,
    icon: 'Droplet',
    iconGenZ: '💧',
    required: true,
    allowPhoto: true,
    description: 'Check if sink and faucet are working properly',
  },
  {
    id: 'urinal_condition',
    category: 'functional',
    label: 'Urinal Condition',
    labelGenZ: 'Kondisi Urinoir',
    weight: 0.08,
    icon: 'Droplets',
    iconGenZ: '🚿',
    required: false, // Not all toilets have urinals
    allowPhoto: true,
    description: 'Check urinal functionality (if available)',
  },

  // AVAILABILITY CATEGORY
  {
    id: 'soap_availability',
    category: 'availability',
    label: 'Soap Availability',
    labelGenZ: 'Ketersediaan Sabun',
    weight: 0.08,
    icon: 'Droplets',
    iconGenZ: '🧴',
    required: true,
    allowPhoto: false,
    description: 'Check if soap is available and sufficient',
  },
  {
    id: 'tissue_availability',
    category: 'availability',
    label: 'Tissue Availability',
    labelGenZ: 'Ketersediaan Tissue',
    weight: 0.08,
    icon: 'FileText',
    iconGenZ: '🧻',
    required: true,
    allowPhoto: false,
    description: 'Check if tissue is available and sufficient',
  },
  {
    id: 'air_freshener',
    category: 'availability',
    label: 'Air Freshener',
    labelGenZ: 'Pengharum Ruangan',
    weight: 0.04,
    icon: 'Wind',
    iconGenZ: '🌬️',
    required: true,
    allowPhoto: false,
    description: 'Check if air freshener is available',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate weighted score from star ratings
 * Formula: (sum of rating * weight) / total weight * 20 to get 0-100 scale
 * Rating 1 = 20%, Rating 2 = 40%, Rating 3 = 60%, Rating 4 = 80%, Rating 5 = 100%
 */
export const calculateWeightedScore = (ratings: ComponentRating[]): number => {
  let totalWeight = 0;
  let weightedSum = 0;

  ratings.forEach((rating) => {
    const component = INSPECTION_COMPONENTS.find((c) => c.id === rating.component);
    if (!component) return;

    totalWeight += component.weight;

    // Convert star rating (1-5) to percentage (20-100)
    const scorePercentage = rating.rating * 20;

    weightedSum += scorePercentage * component.weight;
  });

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

/**
 * Get score status with color and emoji
 */
export const getScoreStatus = (
  score: number
): { label: string; color: string; emoji: string } => {
  if (score >= 85) {
    return { label: 'Excellent', color: 'green', emoji: '🌟' };
  } else if (score >= 70) {
    return { label: 'Good', color: 'blue', emoji: '😊' };
  } else if (score >= 50) {
    return { label: 'Fair', color: 'yellow', emoji: '😐' };
  } else if (score >= 30) {
    return { label: 'Poor', color: 'orange', emoji: '😟' };
  } else {
    return { label: 'Critical', color: 'red', emoji: '😨' };
  }
};

/**
 * Get star rating label in Indonesian
 */
export const getStarRatingLabel = (rating: StarRating, genZMode = false): string => {
  const labels: Record<StarRating, { professional: string; genZ: string }> = {
    1: { professional: 'Very Bad', genZ: 'Sangat Buruk' },
    2: { professional: 'Bad', genZ: 'Buruk' },
    3: { professional: 'Fair', genZ: 'Cukup' },
    4: { professional: 'Good', genZ: 'Baik' },
    5: { professional: 'Excellent', genZ: 'Sangat Baik' },
  };

  return genZMode ? labels[rating].genZ : labels[rating].professional;
};

export interface PhotoWithMetadata {
  file: File;
  preview: string;
  componentId: InspectionComponent;
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}
