/**
 * Progress Component
 * Last Updated: 2024-03
 * 
 * Reusable progress bar component.
 * Features:
 * - Customizable colors and styles
 * - Animated transitions
 * - Accessible design
 * - Size variants
 */

'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
};

const sizeStyles = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all',
            variantStyles[variant]
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-medium">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
} 