// src/components/admin/AdminCard.tsx - Navigation Card for Admin Dashboard
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface AdminCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  color?: string;
  count?: number;
  badge?: string;
}

export const AdminCard = ({ 
  icon: Icon, 
  title, 
  description, 
  path, 
  color = 'blue',
  count,
  badge
}: AdminCardProps) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <button
      onClick={() => navigate(path)}
      className="
        relative w-full p-6 bg-white rounded-2xl shadow-sm border border-gray-100
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-200
        text-left group
      "
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-14 h-14 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} 
        rounded-2xl flex items-center justify-center mb-4
        group-hover:scale-110 transition-transform
      `}>
        <Icon className="w-7 h-7" />
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {count !== undefined && (
          <div className="text-2xl font-bold text-gray-900">{count}</div>
        )}
        <div className={`
          ml-auto flex items-center gap-1 text-sm font-medium
          ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'text-blue-600'}
          group-hover:gap-2 transition-all
        `}>
          <span>Manage</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};

// Compact version for grid layouts
export const AdminCardCompact = ({ 
  icon: Icon, 
  title, 
  path, 
  color = 'blue' 
}: Pick<AdminCardProps, 'icon' | 'title' | 'path' | 'color'>) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <button
      onClick={() => navigate(path)}
      className="
        w-full p-4 bg-white rounded-xl shadow-sm border border-gray-100
        hover:shadow-md hover:scale-105 active:scale-95
        transition-all duration-200
        flex items-center gap-3
      "
    >
      <div className={`
        w-12 h-12 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
        rounded-xl flex items-center justify-center text-white flex-shrink-0
      `}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="font-medium text-gray-900 text-left">{title}</span>
      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
    </button>
  );
};