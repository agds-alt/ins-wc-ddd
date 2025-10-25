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

export type RatingLevel = 1 | 2 | 3 | 4 | 5;

export interface ComponentRating {
  component: InspectionComponent;
  rating: RatingLevel;
  notes?: string;
  photo?: string;
}

export interface InspectionComponentConfig {
  id: InspectionComponent;
  label: string;
  labelGenZ: string;
  weight: number; // untuk weighted scoring
  icon: string;
  iconGenZ: string;
  required: boolean;
  allowPhoto: boolean;
  ratingLabels: {
    professional: { [key in RatingLevel]: string };
    genZ: { [key in RatingLevel]: string };
  };
}

export const INSPECTION_COMPONENTS: InspectionComponentConfig[] = [
  {
    id: 'aroma',
    label: 'Aroma/Odor Level',
    labelGenZ: 'Bau-bauan',
    weight: 0.15, // 15% of total score
    icon: 'ðŸ‘ƒ',
    iconGenZ: 'ðŸ˜·',
    required: true,
    allowPhoto: false,
    ratingLabels: {
      professional: {
        1: 'Very Poor - Strong unpleasant odor',
        2: 'Poor - Noticeable odor',
        3: 'Fair - Slight odor',
        4: 'Good - Fresh',
        5: 'Excellent - Very fresh',
      },
      genZ: {
        1: 'ðŸ¤¢ Bau banget!',
        2: 'ðŸ˜· Agak bau',
        3: 'ðŸ˜ Lumayan',
        4: 'ðŸ˜Š Seger',
        5: 'ðŸŒ¸ Wangi poll!',
      },
    },
  },
  {
    id: 'floor_cleanliness',
    label: 'Floor Cleanliness',
    labelGenZ: 'Kebersihan Lantai',
    weight: 0.12,
    icon: 'ðŸ§¹',
    iconGenZ: 'âœ¨',
    required: true,
    allowPhoto: true,
    ratingLabels: {
      professional: {
        1: 'Very dirty - Major cleaning needed',
        2: 'Dirty - Visible stains/debris',
        3: 'Moderately clean',
        4: 'Clean - Minor spots only',
        5: 'Spotless',
      },
      genZ: {
        1: 'ðŸ¤® Kotor parah',
        2: 'ðŸ˜£ Kotor',
        3: 'ðŸ˜ Lumayan bersih',
        4: 'ðŸ˜Š Bersih',
        5: 'âœ¨ Kinclong!',
      },
    },
  },
  {
    id: 'wall_condition',
    label: 'Wall & Tile Condition',
    labelGenZ: 'Kondisi Dinding',
    weight: 0.08,
    icon: 'ðŸ§±',
    iconGenZ: 'ðŸŽ¨',
    required: true,
    allowPhoto: true,
    ratingLabels: {
      professional: {
        1: 'Very poor - Damaged/moldy',
        2: 'Poor - Visible stains',
        3: 'Fair - Some marks',
        4: 'Good - Clean',
        5: 'Excellent - Pristine',
      },
      genZ: {
        1: 'ðŸ˜¨ Rusak/jamur',
        2: 'ðŸ˜Ÿ Bernoda',
        3: 'ðŸ˜ Ada noda dikit',
        4: 'ðŸ˜Š Bersih',
        5: 'ðŸŒŸ Mulus!',
      },
    },
  },
  {
    id: 'sink_condition',
    label: 'Sink & Faucet Condition',
    labelGenZ: 'Kondisi Wastafel',
    weight: 0.10,
    icon: 'ðŸš°',
    iconGenZ: 'ðŸ’§',
    required: true,
    allowPhoto: true,
    ratingLabels: {
      professional: {
        1: 'Not functional',
        2: 'Poor - Clogged/leaking',
        3: 'Fair - Minor issues',
        4: 'Good - Functioning well',
        5: 'Excellent - Perfect condition',
      },
      genZ: {
        1: 'âŒ Rusak',
        2: 'ðŸ˜« Mampet/bocor',
        3: 'ðŸ˜ Agak bermasalah',
        4: 'ðŸ˜Š Lancar',
        5: 'ðŸ’¯ Perfect!',
      },
    },
  },
  {
    id: 'mirror_condition',
    label: 'Mirror Cleanliness',
    labelGenZ: 'Kebersihan Cermin',
    weight: 0.06,
    icon: 'ðŸªž',
    iconGenZ: 'âœ¨',
    required: true,
    allowPhoto: false,
    ratingLabels: {
      professional: {
        1: 'Very dirty/damaged',
        2: 'Dirty - Heavy stains',
        3: 'Fair - Some spots',
        4: 'Clean - Minor marks',
        5: 'Spotless',
      },
      genZ: {
        1: 'ðŸ˜µ Kotor/rusak',
        2: 'ðŸ˜£ Banyak noda',
        3: 'ðŸ˜ Ada noda dikit',
        4: 'ðŸ˜Š Bersih',
        5: 'âœ¨ Bening!',
      },
    },
  },
  {
    id: 'toilet_condition',
    label: 'Toilet Bowl Condition',
    labelGenZ: 'Kondisi Kloset',
    weight: 0.15,
    icon: 'ðŸš½',
    iconGenZ: 'ðŸš½',
    required: true,
    allowPhoto: true,
    ratingLabels: {
      professional: {
        1: 'Very dirty - Unsanitary',
        2: 'Dirty - Visible stains',
        3: 'Fair - Needs cleaning',
        4: 'Clean',
        5: 'Spotless - Sanitized',
      },
      genZ: {
        1: 'ðŸ¤¢ Jorok banget',
        2: 'ðŸ˜« Kotor',
        3: 'ðŸ˜ Perlu dibersihkan',
        4: 'ðŸ˜Š Bersih',
        5: 'ðŸŒŸ Bersih banget!',
      },
    },
  },
  {
    id: 'urinal_condition',
    label: 'Urinal Condition (if applicable)',
    labelGenZ: 'Kondisi Urinoir',
    weight: 0.08,
    icon: 'ðŸš¿',
    iconGenZ: 'ðŸš¿',
    required: false, // not all toilets have urinals
    allowPhoto: true,
    ratingLabels: {
      professional: {
        1: 'Very poor - Not functional',
        2: 'Poor - Clogged/dirty',
        3: 'Fair - Needs attention',
        4: 'Good - Clean & functional',
        5: 'Excellent - Pristine',
      },
      genZ: {
        1: 'âŒ Rusak',
        2: 'ðŸ˜« Mampet/kotor',
        3: 'ðŸ˜ Perlu perhatian',
        4: 'ðŸ˜Š Bersih & lancar',
        5: 'ðŸ’¯ Perfect!',
      },
    },
  },
  {
    id: 'soap_availability',
    label: 'Hand Soap Availability',
    labelGenZ: 'Sabun Cuci Tangan',
    weight: 0.08,
    icon: 'ðŸ§´',
    iconGenZ: 'ðŸ§¼',
    required: true,
    allowPhoto: false,
    ratingLabels: {
      professional: {
        1: 'Empty - No soap',
        2: 'Almost empty',
        3: 'Half full',
        4: 'Good supply',
        5: 'Full - Well stocked',
      },
      genZ: {
        1: 'âŒ Habis',
        2: 'ðŸ˜Ÿ Tinggal dikit',
        3: 'ðŸ˜ Setengah',
        4: 'ðŸ˜Š Cukup',
        5: 'âœ… Full!',
      },
    },
  },
  {
    id: 'tissue_availability',
    label: 'Toilet Tissue Availability',
    labelGenZ: 'Tisu/Tissue',
    weight: 0.08,
    icon: 'ðŸ§»',
    iconGenZ: 'ðŸ§»',
    required: true,
    allowPhoto: false,
    ratingLabels: {
      professional: {
        1: 'Empty - No tissue',
        2: 'Almost empty',
        3: 'Half roll',
        4: 'Good supply',
        5: 'Full - Well stocked',
      },
      genZ: {
        1: 'âŒ Habis',
        2: 'ðŸ˜Ÿ Mau habis',
        3: 'ðŸ˜ Setengah',
        4: 'ðŸ˜Š Cukup',
        5: 'âœ… Full!',
      },
    },
  },
  {
    id: 'air_freshener',
    label: 'Air Freshener Status',
    labelGenZ: 'Pengharum Ruangan',
    weight: 0.05,
    icon: 'ðŸŒ¬ï¸',
    iconGenZ: 'ðŸŒ¸',
    required: true,
    allowPhoto: false,
    ratingLabels: {
      professional: {
        1: 'Not working/missing',
        2: 'Empty/weak',
        3: 'Partially effective',
        4: 'Working well',
        5: 'Excellent - Strong & pleasant',
      },
      genZ: {
        1: 'âŒ Rusak/gak ada',
        2: 'ðŸ˜Ÿ Habis/lemah',
        3: 'ðŸ˜ Lumayan',
        4: 'ðŸ˜Š Bagus',
        5: 'ðŸŒ¸ Wangi poll!',
      },
    },
  },
  {
    id: 'trash_bin_condition',
    label: 'Trash Bin Condition',
    labelGenZ: 'Kondisi Tempat Sampah',
    weight: 0.05,
    icon: 'ðŸ—‘ï¸',
    iconGenZ: 'ðŸ—‘ï¸',
    required: true,
    allowPhoto: true,
    ratingLabels: {
      professional: {
        1: 'Overflowing - Critical',
        2: 'Nearly full',
        3: 'Half full',
        4: 'Quarter full',
        5: 'Empty - Clean',
      },
      genZ: {
        1: 'ðŸ¤® Penuh meluber',
        2: 'ðŸ˜« Hampir penuh',
        3: 'ðŸ˜ Setengah',
        4: 'ðŸ˜Š Masih kosong',
        5: 'âœ… Kosong & bersih!',
      },
    },
  },
];

// Calculate weighted score from ratings
export const calculateWeightedScore = (ratings: ComponentRating[]): number => {
  let totalScore = 0;
  let totalWeight = 0;

  ratings.forEach((rating) => {
    const config = INSPECTION_COMPONENTS.find((c) => c.id === rating.component);
    if (config) {
      // Convert rating (1-5) to percentage (0-100)
      const scorePercentage = ((rating.rating - 1) / 4) * 100;
      totalScore += scorePercentage * config.weight;
      totalWeight += config.weight;
    }
  });

  // Normalize to 0-100 scale
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

// Get status based on score
export const getScoreStatus = (score: number): {
  label: string;
  labelGenZ: string;
  color: string;
  emoji: string;
} => {
  if (score >= 90) {
    return {
      label: 'Excellent',
      labelGenZ: 'Perfect! ðŸŽ‰',
      color: 'green',
      emoji: 'ðŸŒŸ',
    };
  } else if (score >= 75) {
    return {
      label: 'Good',
      labelGenZ: 'Bagus! ðŸ‘',
      color: 'blue',
      emoji: 'ðŸ˜Š',
    };
  } else if (score >= 60) {
    return {
      label: 'Fair',
      labelGenZ: 'Lumayan',
      color: 'yellow',
      emoji: 'ðŸ˜',
    };
  } else if (score >= 40) {
    return {
      label: 'Poor',
      labelGenZ: 'Kurang nih',
      color: 'orange',
      emoji: 'ðŸ˜Ÿ',
    };
  } else {
    return {
      label: 'Very Poor',
      labelGenZ: 'Harus diperbaiki!',
      color: 'red',
      emoji: 'ðŸ˜¨',
    };
  }
};

export interface InspectionFormData {
  location_id: string;
  ratings: ComponentRating[];
  photos: File[];
  general_notes?: string;
  issues_found: boolean;
  issue_description?: string;
  requires_maintenance: boolean;
  maintenance_priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Response type for inspection records from database
export interface InspectionResponse {
  id: string;
  location_id: string;
  user_id: string;
  template_id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: string;
  responses: Record<string, any>;
  photo_urls: string[] | null;
  notes: string | null;
  submitted_at: string | null;
  duration_seconds: number | null;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at?: string;
  updated_at?: string;
}

// Insert type for creating new inspection records
export interface InspectionRecordInsert {
  location_id: string;
  user_id: string;
  template_id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: string;
  responses: Record<string, any>;
  photo_urls?: string[] | null;
  notes?: string | null;
  submitted_at?: string | null;
  duration_seconds?: number | null;
  verification_notes?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
}

// Template fields structure
export interface InspectionTemplateFields {
  components: InspectionComponentConfig[];
  requiredPhotos?: number;
  maxPhotos?: number;
  allowNotes?: boolean;
  [key: string]: any;
}