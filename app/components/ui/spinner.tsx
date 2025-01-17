/**
 * Spinner Component
 * Last Updated: 2024-03-21
 * 
 * Reusable loading spinner component with size variants.
 * Uses Tailwind CSS for styling and animations.
 */

'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

export const Spinner = memo(function Spinner({ 
  size = 'md',
  className
}: SpinnerProps) {
  return (
    <Loader2 
      className={cn(
        'animate-spin text-gray-500',
        sizeClasses[size],
        className
      )}
    />
  );
}); 