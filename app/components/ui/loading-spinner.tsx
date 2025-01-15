/**
 * Loading Spinner Component
 * Last Updated: 2024-03-20
 * 
 * A reusable loading spinner component that can be used to indicate
 * loading states throughout the application.
 */

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-2',
    lg: 'h-16 w-16 border-3',
  }

  const containerClasses = cn(
    'flex items-center justify-center',
    fullScreen && 'min-h-screen',
    className
  )

  const spinnerClasses = cn(
    'animate-spin rounded-full border-t-indigo-500 border-b-indigo-500 border-r-transparent border-l-transparent',
    sizeClasses[size]
  )

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} />
    </div>
  )
}

export default LoadingSpinner 