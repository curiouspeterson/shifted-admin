/**
 * Schedule Error Component
 * Last Updated: 2025-03-19
 * 
 * Error boundary for schedule pages.
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/app/components/ui/button/index'

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Schedule error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold">Error Loading Schedule</h2>
        <p className="mb-4 text-sm text-gray-600">{error.message}</p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  )
} 