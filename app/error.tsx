/**
 * Global Error Component
 * Last Updated: 2025-01-17
 * 
 * Handles application-level errors and provides recovery options.
 */

'use client'

import * as React from 'react'
import { ClientButton } from '@/components/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.ReactElement {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Something went wrong!</h1>
        <p className="text-lg text-gray-600">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <ClientButton onClick={reset}>
            Try again
          </ClientButton>
          <ClientButton 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </ClientButton>
        </div>
      </div>
    </div>
  )
} 