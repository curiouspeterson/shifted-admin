/**
 * Global Loading Component
 * Last Updated: 2024
 * 
 * Provides a full-screen loading indicator for route transitions and
 * data fetching states. This component is automatically used by
 * Next.js when loading new routes or during Suspense boundaries.
 * 
 * Features:
 * - Centered loading spinner
 * - Full viewport height
 * - Consistent loading state across routes
 * - Automatic integration with Next.js
 */

import LoadingSpinner from '@/components/loading-spinner'

/**
 * Loading Component
 * Renders a centered loading spinner in a full-screen container
 * Used automatically by Next.js for route transitions
 * 
 * @returns Full-screen loading indicator
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  )
} 