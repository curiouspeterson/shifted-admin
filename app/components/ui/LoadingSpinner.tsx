/**
 * Loading Spinner Component
 * Last Updated: 2025-01-16
 * 
 * A reusable loading spinner component with customizable size and color.
 */

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn(
        'animate-spin text-gray-500',
        sizeClasses[size],
        className
      )} 
    />
  )
} 