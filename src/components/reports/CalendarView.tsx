// src/components/reports/CalendarView.tsx - FIXED: Remove unused imports
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths 
} from 'date-fns';
import { DateInspections } from '../../hooks/useReports';

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  dateInspections: DateInspections[];
  onDateClick: (date: string) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const CalendarView = ({
  currentDate,
  onDateChange,
  dateInspections,
  onDateClick,
}: CalendarViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 1 = Monday, etc)
  const firstDayOfMonth = monthStart.getDay();

  // Fill empty cells at the start
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const getDateData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateInspections.find(d => d.date === dateStr);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="text-lg font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mt-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
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
            const dateData = getDateData(day);
            const hasInspections = dateData && dateData.count > 0;
            const dayIsToday = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');

            return (
              <button
                key={day.toISOString()}
                onClick={() => hasInspections && onDateClick(dateStr)}
                disabled={!hasInspections}
                className={`
                  aspect-square p-1 rounded-lg transition-all relative
                  ${dayIsToday ? 'ring-2 ring-blue-500' : ''}
                  ${hasInspections 
                    ? 'hover:bg-gray-50 cursor-pointer active:scale-95' 
                    : 'cursor-default opacity-40'
                  }
                `}
              >
                {/* Date number */}
                <div className={`
                  text-sm font-medium
                  ${dayIsToday ? 'text-blue-600 font-bold' : 'text-gray-700'}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Inspection indicator */}
                {hasInspections && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getScoreColor(dateData.averageScore)}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Good (85+)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Fair (70-84)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Poor (&lt;70)</span>
        </div>
      </div>
    </div>
  );
};