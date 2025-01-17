'use client'

/**
 * Auth Error Fallback Component
 * Last Updated: 2025-01-17
 * 
 * Client-side error boundary fallback for authentication errors.
 */

import { Button } from '@/components/client-wrappers/button-client'

interface AuthErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function AuthErrorFallback({ error, resetErrorBoundary }: AuthErrorFallbackProps) {
  return (
    <div className="p-4 border border-red-500 rounded-md">
      <h2 className="text-lg font-semibold text-red-600">Authentication Error:</h2>
      <pre className="mt-2 text-sm text-red-500">{error.message}</pre>
      <Button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
      >
        Try again
      </Button>
    </div>
  )
} 