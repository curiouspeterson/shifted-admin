/**
 * Spinner Component
 * Last Updated: 2024-03-21
 * 
 * A reusable loading indicator component.
 * Features:
 * - Centered layout
 * - Smooth spinning animation
 * - Customizable size
 * - Theme-aware colors
 * - Accessibility support
 */

'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export function Spinner({
  size = 'md',
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Alias for backward compatibility
export const LoadingSpinner = Spinner 