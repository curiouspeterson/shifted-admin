/**
 * Loading Spinner Component
 * Last Updated: 2025-01-15
 * 
 * This component provides a loading spinner with different sizes.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  className,
  size = 'md',
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex items-center justify-center p-4', className)}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground',
          {
            'h-4 w-4': size === 'sm',
            'h-8 w-8': size === 'md',
            'h-12 w-12': size === 'lg',
          }
        )}
      />
    </div>
  );
} 