/**
 * Global Error Boundary
 * Last Updated: 2025-01-16
 * 
 * Handles uncaught errors at the application root level.
 * This component is the last line of defense for error handling.
 */

'use client'

import { useEffect } from "react"
import { errorLogger } from '@/lib/logging/error-logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    errorLogger.error('Unhandled application error', {
      error,
      context: {
        component: 'GlobalError',
        digest: error.digest,
        timestamp: new Date().toISOString()
      }
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="rounded-lg bg-card p-8 shadow-lg max-w-md w-full space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Something went wrong!
            </h2>
            <p className="text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => reset()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}