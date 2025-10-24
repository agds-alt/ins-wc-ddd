// src/components/reports/InspectionDrawer.tsx
import { useEffect, useState } from 'react';
import { X, MapPin, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { InspectionReport } from '../../hooks/useReports';

interface InspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspections: InspectionReport[];
  selectedDate: string;
  onInspectionClick: (inspection: InspectionReport) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const getScoreEmoji = (score: number) => {
  if (score >= 85) return '😊';
  if (score >= 70) return '😐';
  return '😟';
};

export const InspectionDrawer = ({
  isOpen,
  onClose,
  inspections,
  selectedDate,
  onInspectionClick,
}: InspectionDrawerProps) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const y = e.touches[0].clientY;
    const delta = y - startY;
    if (delta > 0) { // Only allow downward swipe
      setCurrentY(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentY > 100) { // Close threshold
      onClose();
    }
    setCurrentY(0);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedDate = format(new Date(selectedDate), 'EEEE, MMMM d, yyyy');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] flex flex-col transition-transform"
        style={{
          transform: `translateY(${currentY}px)`,
        }}
      >
        {/* Drag Handle */}
        <div
          className="py-3 flex justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Inspections
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {formattedDate}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {inspections.length} inspection{inspections.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Inspection List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {inspections.map((inspection) => {
            const score = (inspection.responses as any)?.score || 0;
            const scoreColor = getScoreColor(score);
            const emoji = getScoreEmoji(score);

            return (
              <button
                key={inspection.id}
                onClick={() => onInspectionClick(inspection)}
                className="w-full bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors active:scale-[0.98] text-left"
              >
                <div className="flex items-start justify-between space-x-3">
                  {/* Left side - Location info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">
                        {inspection.location.name}
                      </h3>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {inspection.location.building && (
                        <p className="truncate">
                          🏢 {inspection.location.building} • {inspection.location.floor}
                        </p>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{inspection.inspection_time}</span>
                      </div>
                    </div>

                    {/* Photos indicator */}
                    {inspection.photo_urls.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          📸 {inspection.photo_urls.length} photo{inspection.photo_urls.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side - Score */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className={`
                      px-3 py-2 rounded-xl border-2 font-bold
                      flex items-center space-x-1.5
                      ${scoreColor}
                    `}>
                      <span className="text-lg">{emoji}</span>
                      <span className="text-xl">{score}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Score</span>
                  </div>
                </div>

                {/* Notes preview */}
                {inspection.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      💬 {inspection.notes}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};