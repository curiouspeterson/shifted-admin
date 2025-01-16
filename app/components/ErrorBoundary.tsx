/**
 * Error Boundary Component
 * Last Updated: 2024-01-15
 * 
 * A React error boundary component that catches errors in its child components.
 */

'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error)
  }, [error])

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTitle>Something went wrong!</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{error.message}</p>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
} 