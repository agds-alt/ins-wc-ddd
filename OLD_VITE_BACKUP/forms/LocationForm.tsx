// src/features/locations/components/LocationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useBuildings } from '../../hooks/useBuildings';
import type { LocationFormData } from '../../types/location.types';
import { validateLocationData } from '../../lib/locationService';

interface LocationFormProps {
  initialData?: Partial<LocationFormData>;
  onSubmit: (data: LocationFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function LocationForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting: externalIsSubmitting 
}: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || '',
    organization_id: initialData?.organization_id || '',
    building_id: initialData?.building_id || '',
    floor: initialData?.floor || '',
    section: initialData?.section || '',
    area: initialData?.area || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  
  const isSubmitting = externalIsSubmitting ?? internalIsSubmitting;

  // Fetch organizations
  const { 
    data: organizations, 
    isLoading: isLoadingOrgs 
  } = useOrganizations();

  // Fetch buildings based on selected organization
  const { 
    data: buildings, 
    isLoading: isLoadingBuildings 
  } = useBuildings({
    organizationId: formData.organization_id,
    enabled: !!formData.organization_id,
  });

  // Reset building when organization changes (except for initial data)
  useEffect(() => {
    if (!initialData?.building_id && formData.organization_id) {
      setFormData((prev: LocationFormData) => ({ ...prev, building_id: '' }));
    }
  }, [formData.organization_id, initialData?.building_id]);

  const handleInputChange = (
    field: keyof LocationFormData,
    value: string
  ) => {
    setFormData((prev: LocationFormData) => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateLocationData(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setInternalIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      // Form will be cleared by parent component after successful submit
    } catch (error: any) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error.message || 'Failed to save location. Please try again.',
      });
    } finally {
      setInternalIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Organization Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Organization <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.organization_id}
          onChange={(e) => handleInputChange('organization_id', e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.organization_id 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-white'
          }`}
          required
          disabled={isLoadingOrgs || isSubmitting}
        >
          <option value="">
            {isLoadingOrgs ? 'Loading organizations...' : 'Select Organization'}
          </option>
          {organizations?.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.short_code})
            </option>
          ))}
        </select>
        {errors.organization_id && (
          <p className="mt-1 text-sm text-red-600">{errors.organization_id}</p>
        )}
      </div>

      {/* Building Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Building <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.building_id}
          onChange={(e) => handleInputChange('building_id', e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.building_id 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-white'
          }`}
          required
          disabled={!formData.organization_id || isLoadingBuildings || isSubmitting}
        >
          <option value="">
            {isLoadingBuildings 
              ? 'Loading buildings...' 
              : !formData.organization_id
              ? 'Select organization first'
              : 'Select Building'
            }
          </option>
          {buildings?.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name} ({building.short_code})
            </option>
          ))}
        </select>
        {!formData.organization_id && (
          <p className="mt-1 text-sm text-gray-500">
            Please select an organization first
          </p>
        )}
        {errors.building_id && (
          <p className="mt-1 text-sm text-red-600">{errors.building_id}</p>
        )}
      </div>

      {/* Location Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.name 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-white'
          }`}
          placeholder="e.g., Lobby Toilet - Men's Room"
          required
          disabled={isSubmitting}
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Floor & Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floor
          </label>
          <input
            type="text"
            value={formData.floor}
            onChange={(e) => handleInputChange('floor', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 3F, Ground, Basement 1"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Specify which floor
          </p>
        </div>

        {/* Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section
          </label>
          <input
            type="text"
            value={formData.section}
            onChange={(e) => handleInputChange('section', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., North Wing, Hall A"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Specify section or wing
          </p>
        </div>
      </div>

      {/* Area & Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area Type
          </label>
          <select
            value={formData.area}
            onChange={(e) => handleInputChange('area', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="">Select Area Type</option>
            <option value="Public Area">Public Area</option>
            <option value="Staff Area">Staff Area</option>
            <option value="VIP Area">VIP Area</option>
            <option value="Service Area">Service Area</option>
            <option value="Emergency Area">Emergency Area</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Optional: Type of area
          </p>
        </div>

        {/* Location Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Code
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.code 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 bg-white'
            }`}
            placeholder="e.g., T01, WC-M1, LBY-T1"
            disabled={isSubmitting}
            maxLength={20}
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Short code for easy reference
          </p>
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.description 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-white'
          }`}
          rows={3}
          placeholder="Additional details about this location..."
          disabled={isSubmitting}
          maxLength={500}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            Optional: Any additional information
          </p>
          <p className="text-xs text-gray-500">
            {formData.description?.length || 0} / 500
          </p>
        </div>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg 
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd" 
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">QR Code will be generated automatically</p>
            <p className="text-blue-700">
              A unique QR code will be created when you save this location. You can print it later from the location details page.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={
            isSubmitting || 
            !formData.organization_id || 
            !formData.building_id || 
            !formData.name
          }
        >
          {isSubmitting && (
            <svg 
              className="animate-spin h-4 w-4 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
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
          )}
          {isSubmitting 
            ? 'Saving...' 
            : initialData 
            ? 'Update Location' 
            : 'Create Location'
          }
        </button>
      </div>
    </form>
  );
}