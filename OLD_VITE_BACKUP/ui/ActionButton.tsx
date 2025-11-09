// src/components/ui/ActionButton.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'flex flex-col items-center justify-center gap-2 rounded-xl transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white active:scale-95',
    danger: 'bg-red-500 hover:bg-red-600 text-white active:scale-95',
    success: 'bg-green-500 hover:bg-green-600 text-white active:scale-95',
  };

  const sizeClasses = {
    sm: 'p-2 min-h-[60px]',      // diperkecil dari p-3 min-h-[80px]
    md: 'p-3 min-h-[80px]',      // diperkecil dari p-4 min-h-[100px]
    lg: 'p-4 min-h-[100px]',     // diperkecil dari p-6 min-h-[120px]
  };

  const iconSizes = {
    sm: 'w-5 h-5',              // diperkecil dari w-6 h-6
    md: 'w-6 h-6',              // diperkecil dari w-8 h-8
    lg: 'w-8 h-8',              // diperkecil dari w-10 h-10
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer shadow-lg hover:shadow-xl';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}`}>
        {label}
      </span>
    </button>
  );
};

// MiniActionButton variant
interface MiniActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export const MiniActionButton: React.FC<MiniActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg
        transition-all duration-200 active:scale-95
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};