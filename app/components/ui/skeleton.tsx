'use client';

/**
 * Skeleton Component
 * Last Updated: 2024-03
 * 
 * A reusable skeleton component for loading states.
 * Features:
 * - Animated pulse effect
 * - Custom styling
 * - Accessibility support
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton }; 