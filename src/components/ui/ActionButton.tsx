// src/components/ui/ActionButton.tsx
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ActionButtonProps {
  icon: LucideIcon | string;
  label: string;
  badge?: string | number;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'ghost';
  disabled?: boolean;
}

export const ActionButton = ({ 
  icon, 
  label, 
  badge,
  onClick,
  variant = 'default',
  disabled = false
}: ActionButtonProps) => {
  const Icon = typeof icon === 'string' ? null : icon;

  const variantStyles = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0',
    ghost: 'bg-transparent border border-transparent hover:bg-gray-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'action-button relative',
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={clsx(
        'action-button-icon',
        variant === 'primary' ? 'bg-white/20' : ''
      )}>
        {Icon ? (
          <Icon className={clsx(
            'w-6 h-6',
            variant === 'primary' ? 'text-white' : 'text-blue-600'
          )} />
        ) : (
          <span className="text-2xl">{icon}</span>
        )}
      </div>

      {/* Label */}
      <span className={clsx(
        'text-xs font-medium',
        variant === 'primary' ? 'text-white' : 'text-gray-700'
      )}>
        {label}
      </span>
    </button>
  );
};

// Compact Action Button (for toolbar)
interface CompactActionButtonProps {
  icon: LucideIcon | string;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export const CompactActionButton = ({ 
  icon, 
  label, 
  onClick,
  active = false 
}: CompactActionButtonProps) => {
  const Icon = typeof icon === 'string' ? null : icon;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
        active 
          ? 'bg-blue-100 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {Icon ? (
        <Icon className="w-5 h-5" />
      ) : (
        <span className="text-xl">{icon}</span>
      )}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};