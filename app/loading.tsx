/**
 * Loading Component
 * Last Updated: 2025-03-19
 * 
 * Displays a loading spinner during page transitions.
 */

import { Spinner } from '@/app/components/ui/spinner'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
} 