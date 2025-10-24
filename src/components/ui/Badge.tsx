// src/components/ui/Badge.tsx
import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  dot?: boolean;
}

export const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  icon,
  dot = false
}: BadgeProps) => {
  const variantStyles = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    default: 'bg-gray-100 text-gray-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={clsx(
      'badge inline-flex items-center gap-1.5',
      variantStyles[variant],
      sizeStyles[size]
    )}>
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-green-600',
          variant === 'warning' && 'bg-yellow-600',
          variant === 'danger' && 'bg-red-600',
          variant === 'info' && 'bg-blue-600',
          variant === 'default' && 'bg-gray-600'
        )} />
      )}
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};

// Status Badge (for inspection status)
interface StatusBadgeProps {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'pending' | 'completed' | 'verified';
  showIcon?: boolean;
}

export const StatusBadge = ({ status, showIcon = true }: StatusBadgeProps) => {
  const statusConfig = {
    excellent: { 
      label: 'Excellent', 
      variant: 'success' as const, 
      icon: '🌟',
      emoji: '😊'
    },
    good: { 
      label: 'Good', 
      variant: 'success' as const, 
      icon: '✅',
      emoji: '🙂'
    },
    fair: { 
      label: 'Fair', 
      variant: 'warning' as const, 
      icon: '⚠️',
      emoji: '😐'
    },
    poor: { 
      label: 'Poor', 
      variant: 'danger' as const, 
      icon: '❌',
      emoji: '😕'
    },
    pending: { 
      label: 'Pending', 
      variant: 'warning' as const, 
      icon: '⏰',
      emoji: '⏳'
    },
    completed: { 
      label: 'Completed', 
      variant: 'success' as const, 
      icon: '✓',
      emoji: '✅'
    },
    verified: { 
      label: 'Verified', 
      variant: 'info' as const, 
      icon: '✓✓',
      emoji: '✅'
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {showIcon && <span>{config.emoji}</span>}
      {config.label}
    </Badge>
  );
};

// Score Badge (for cleanliness scores)
interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
}

export const ScoreBadge = ({ score, maxScore = 100, showLabel = true }: ScoreBadgeProps) => {
  const percentage = (score / maxScore) * 100;
  
  let variant: 'success' | 'warning' | 'danger';
  let emoji: string;
  
  if (percentage >= 80) {
    variant = 'success';
    emoji = '😊';
  } else if (percentage >= 60) {
    variant = 'warning';
    emoji = '😐';
  } else {
    variant = 'danger';
    emoji = '😟';
  }

  return (
    <Badge variant={variant} size="lg">
      <span>{emoji}</span>
      <span className="font-bold">{score}</span>
      {showLabel && <span>/ {maxScore}</span>}
    </Badge>
  );
};