/**
 * Global Error Boundary Component
 * Last Updated: 2024
 * 
 * Provides error handling for the entire application. This component
 * is automatically used by Next.js when an error occurs during
 * rendering or data fetching.
 * 
 * Features:
 * - Client-side error handling
 * - Error recovery with reset functionality
 * - Integration with custom ErrorBoundary component
 * - Automatic error capture and display
 */

'use client'

import ErrorBoundary from './components/ErrorBoundary'

/**
 * Error Component
 * Wraps the custom ErrorBoundary component with Next.js error props
 * 
 * @param props.error - Error object with optional digest
 * @param props.reset - Function to reset the error boundary
 * @returns Error boundary component with error details
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundary error={error} reset={reset} />
} 