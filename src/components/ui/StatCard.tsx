// src/components/ui/StatCard.tsx
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon | string;
  value: string | number;
  label: string;
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

export const StatCard = ({ 
  icon, 
  value, 
  label, 
  color = 'primary',
  trend,
  onClick 
}: StatCardProps) => {
  const colorStyles = {
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
    primary: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
  };

  const Icon = typeof icon === 'string' ? null : icon;

  return (
    <button
      onClick={onClick}
      className="stat-card w-full text-left"
    >
      <div className={clsx('stat-icon', color !== 'primary' && colorStyles[color])}>
        {Icon ? (
          <Icon className="w-6 h-6" />
        ) : (
          <span className="text-2xl">{icon}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend && (
            <div
              className={clsx(
                'text-xs font-medium',
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </button>
  );
};

// Mini Stat Card (for grid layouts)
interface MiniStatCardProps {
  icon: string | ReactNode;
  value: string | number;
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
  onClick?: () => void;
}

export const MiniStatCard = ({ icon, value, label, color, onClick }: MiniStatCardProps) => {
  const colorClasses = {
    green: 'from-green-400 to-green-500',
    yellow: 'from-yellow-400 to-yellow-500',
    red: 'from-red-400 to-red-500',
    blue: 'from-blue-400 to-blue-500',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'bg-gradient-to-br text-white rounded-2xl p-4 shadow-lg',
        'active:scale-95 transition-transform',
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <span className="text-xs font-bold">→</span>
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </button>
  );
};