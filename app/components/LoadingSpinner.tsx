/**
 * Loading Spinner Component
 * Last Updated: 2024-01-15
 * 
 * A simple loading spinner component using Lucide icons.
 */

'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
}

export default function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`h-6 w-6 animate-spin ${className || ''}`} />
    </div>
  )
} 