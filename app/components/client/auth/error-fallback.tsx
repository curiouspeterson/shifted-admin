/**
 * Auth Error Fallback Component
 * Last Updated: 2025-03-19
 * 
 * Displays a user-friendly error message with a retry button.
 */

'use client'

import * as React from 'react'
import { ClientButton } from '@/app/components/ui/button/button-client'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Authentication Error
        </h2>
        <p className="text-muted-foreground">
          {error.message || 'An error occurred during authentication'}
        </p>
      </div>
      <ClientButton onClick={resetErrorBoundary}>
        Try Again
      </ClientButton>
    </div>
  )
} 