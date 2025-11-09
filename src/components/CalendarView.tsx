/**
 * Calendar View Component
 * Displays monthly calendar with inspection indicators
 * Optimized with memo and efficient date calculations
 */

'use client';

import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns';

export interface DateInspection {
  date: string; // yyyy-MM-dd
  count: number;
  averageScore: number;
}

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  dateInspections: DateInspection[];
  onDateClick: (date: string) => void;
}

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

// Score color mapping
function getScoreColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function CalendarViewContent({
  currentDate,
  onDateChange,
  dateInspections,
  onDateClick,
}: CalendarViewProps) {
  // Memoized calculations
  const { monthStart, monthEnd, daysInMonth, emptyDays } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const empty = Array(start.getDay()).fill(null);

    return {
      monthStart: start,
      monthEnd: end,
      daysInMonth: days,
      emptyDays: empty,
    };
  }, [currentDate]);

  // Create a map for O(1) lookup
  const inspectionMap = useMemo(() => {
    const map = new Map<string, DateInspection>();
    dateInspections.forEach((item) => {
      map.set(item.date, item);
    });
    return map;
  }, [dateInspections]);

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            type="button"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="text-lg font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            type="button"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const inspection = inspectionMap.get(dateStr);
            const hasInspections = !!inspection && inspection.count > 0;
            const dayIsToday = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => hasInspections && onDateClick(dateStr)}
                disabled={!hasInspections}
                className={`
                  aspect-square p-1 rounded-lg transition-all relative
                  ${dayIsToday ? 'ring-2 ring-blue-500' : ''}
                  ${
                    hasInspections
                      ? 'hover:bg-gray-50 cursor-pointer active:scale-95'
                      : 'cursor-default opacity-40'
                  }
                `}
                type="button"
                aria-label={`${format(day, 'd MMMM')}${hasInspections ? `, ${inspection.count} inspeksi` : ''}`}
              >
                {/* Date number */}
                <div
                  className={`
                  text-sm font-medium
                  ${dayIsToday ? 'text-blue-600 font-bold' : 'text-gray-700'}
                `}
                >
                  {format(day, 'd')}
                </div>

                {/* Inspection indicator */}
                {hasInspections && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getScoreColor(
                        inspection.averageScore
                      )}`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Baik (85+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Cukup (70-84)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Kurang (&lt;70)</span>
        </div>
      </div>
    </div>
  );
}

// Memoized export
export const CalendarView = memo(CalendarViewContent);
CalendarView.displayName = 'CalendarView';
