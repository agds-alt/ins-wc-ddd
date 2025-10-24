// src/components/ui/LoadingSpinner.tsx
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  fullScreen?: boolean;
  text?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  fullScreen = false,
  text
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-blue-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-300 border-t-gray-600',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={clsx(
          'spinner rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {text && (
        <p className={clsx(
          'text-sm font-medium',
          color === 'white' ? 'text-white' : 'text-gray-600'
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton Loader
interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}

export const Skeleton = ({ 
  width = '100%', 
  height = '1rem',
  rounded = false,
  className 
}: SkeletonProps) => {
  return (
    <div
      className={clsx(
        'skeleton',
        rounded && 'rounded-full',
        className
      )}
      style={{ width, height }}
    />
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton width="3rem" height="3rem" rounded />
        <div className="flex-1">
          <Skeleton width="60%" height="1rem" className="mb-2" />
          <Skeleton width="40%" height="0.75rem" />
        </div>
      </div>
      <Skeleton width="100%" height="4rem" />
    </div>
  );
};

// List Skeleton
export const ListSkeleton = ({ items = 3 }: { items?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
          <Skeleton width="2.5rem" height="2.5rem" rounded />
          <div className="flex-1">
            <Skeleton width="70%" height="1rem" className="mb-2" />
            <Skeleton width="50%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
};