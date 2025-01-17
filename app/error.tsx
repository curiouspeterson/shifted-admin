/**
 * Root Error Boundary
 * Last Updated: 2025-01-16
 * 
 * Global error handler for the application
 */

'use client'

import { useEffect } from 'react'
import { errorLogger } from '@/lib/logging/error-logger'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our reporting system
    errorLogger.error('App level error caught', { 
      error,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 px-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Something went wrong!
        </h2>
        <p className="text-sm text-muted-foreground">
          {process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An error occurred while processing your request.'}
        </p>
      </div>
      <Button
        variant="default"
        onClick={() => reset()}
        className="px-8"
      >
        Try again
      </Button>
    </div>
  )
} 