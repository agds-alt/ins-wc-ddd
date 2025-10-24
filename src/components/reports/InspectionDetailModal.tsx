// src/components/reports/InspectionDetailModal.tsx
import { X, MapPin, Clock, User, Camera, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { InspectionReport } from '../../hooks/useReports';
import { INSPECTION_COMPONENTS, calculateWeightedScore } from '../../types/inspection.types';

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionReport | null;
}

// Helper to extract score from any response format
const getScoreFromResponses = (responses: any): number => {
  if (!responses) return 0;
  
  // Direct score field
  if (typeof responses.score === 'number') return responses.score;
  
  // Calculate from ratings array
  if (Array.isArray(responses.ratings) && responses.ratings.length > 0) {
    return calculateWeightedScore(responses.ratings);
  }
  
  // Fallback
  const values = Object.values(responses).filter(v => 
    typeof v === 'string' || typeof v === 'boolean'
  );
  if (values.length === 0) return 0;
  
  const goodCount = values.filter(v => 
    v === true || v === 'good' || v === 'excellent' || v === 'baik'
  ).length;
  
  return Math.round((goodCount / values.length) * 100);
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-100 text-green-700';
  if (score >= 70) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const getRatingEmoji = (rating: number) => {
  const emojis = ['😨', '😟', '😐', '😊', '🌟'];
  return emojis[rating - 1] || '😐';
};

export const InspectionDetailModal = ({
  isOpen,
  onClose,
  inspection,
}: InspectionDetailModalProps) => {
  if (!isOpen || !inspection) return null;

  const responses = inspection.responses as any;
  const score = getScoreFromResponses(responses);
  const ratings = responses?.ratings || [];

  const formattedDate = format(new Date(inspection.inspection_date), 'EEEE, MMMM d, yyyy');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[5%] bottom-[5%] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Inspection Details
              </h2>
              <p className="text-sm text-gray-600">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Score Badge */}
          <div className="mt-4">
            <div className={`
              inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-bold
              ${getScoreColor(score)}
            `}>
              <span className="text-2xl">
                {score >= 85 ? '🌟' : score >= 70 ? '😊' : '😟'}
              </span>
              <span className="text-2xl">{score}</span>
              <span className="text-sm font-normal">Overall Score</span>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Location Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {inspection.location.name}
                </h3>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {inspection.location.building && (
                    <p>🏢 {inspection.location.building}</p>
                  )}
                  {inspection.location.floor && (
                    <p>📍 {inspection.location.floor}</p>
                  )}
                  <div className="flex items-center space-x-1 mt-2">
                    <Clock className="w-4 h-4" />
                    <span>{inspection.inspection_time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspector Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inspected by</p>
              <p className="font-semibold text-gray-900">{inspection.user.full_name}</p>
            </div>
          </div>

          {/* Component Ratings */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <span>📋</span>
              <span>Component Ratings</span>
            </h3>
            <div className="space-y-3">
              {ratings.map((rating: any, index: number) => {
                const component = INSPECTION_COMPONENTS.find(c => c.id === rating.component);
                if (!component) return null;

                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xl">{component.icon}</span>
                          <span className="font-medium text-gray-900">
                            {component.label}
                          </span>
                        </div>
                        {rating.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            💬 {rating.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span className="text-2xl">{getRatingEmoji(rating.rating)}</span>
                        <span className="text-lg font-bold text-gray-900">
                          {rating.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photos */}
          {inspection.photo_urls.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Photos</span>
                <span className="text-sm font-normal text-gray-600">
                  ({inspection.photo_urls.length})
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {inspection.photo_urls.map((url, index) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden">
                    <img
                      src={url}
                      alt={`Inspection photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {inspection.notes && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Additional Notes</span>
              </h3>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {inspection.notes}
                </p>
              </div>
            </div>
          )}

          {/* Issues & Maintenance */}
          {responses?.issues_found && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="font-bold text-red-900 mb-2 flex items-center space-x-2">
                <span>⚠️</span>
                <span>Issues Found</span>
              </h3>
              <p className="text-red-800">
                {responses.issue_description}
              </p>
              {responses.requires_maintenance && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm font-semibold text-red-900">
                    🔧 Maintenance Required
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    Priority: <span className="font-bold uppercase">
                      {responses.maintenance_priority}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};