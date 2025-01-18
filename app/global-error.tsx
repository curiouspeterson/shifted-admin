/**
 * Global Error Page Component
 * Last Updated: 2025-03-19
 * 
 * Displays a user-friendly error message with a retry button.
 */

'use client'

import * as React from 'react'
import { Button } from '@/app/components/ui/button/index'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Global Error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
            <Button
              onClick={() => reset()}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}