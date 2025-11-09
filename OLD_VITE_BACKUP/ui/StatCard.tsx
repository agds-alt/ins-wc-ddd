// src/components/ui/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  const iconColors = {
    default: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  return (
    <div
      className={`
        border rounded-xl p-6 shadow-sm
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg bg-opacity-10 ${iconColors[variant]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

// MiniStatCard variant
interface MiniStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  onClick?: () => void;
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
  icon: Icon,
  label,
  value,
  onClick,
}) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200';
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-98' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${interactiveClasses}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};