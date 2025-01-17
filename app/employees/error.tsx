/**
 * Employees Page Error Boundary
 * Last Updated: 2025-01-16
 * 
 * Error boundary component for the employees page.
 * Handles errors in the employees page component tree.
 */

'use client'

import { useEffect } from "react"
import { errorLogger } from '@/lib/logging/error-logger'

export default function EmployeesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    errorLogger.error('Employees page error', {
      error,
      context: {
        component: 'EmployeesError',
        page: '/employees',
        digest: error.digest,
        timestamp: new Date().toISOString()
      }
    })
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="rounded-lg bg-card p-8 shadow-lg max-w-md w-full space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Unable to load employees
        </h2>
        <p className="text-muted-foreground">
          There was a problem loading the employees list. Our team has been notified.
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
  )
} 