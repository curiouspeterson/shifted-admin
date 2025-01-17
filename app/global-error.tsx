/**
 * Global Error Component
 * Last Updated: 2025-01-17
 * 
 * Handles application-level errors that occur outside the main app tree.
 * This component is used as a last resort when the app fails to render.
 */

'use client'

import * as React from 'react'
import { ClientButton } from '@/components/ui'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.ReactElement {
  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <ClientButton onClick={() => reset()}>Try again</ClientButton>
        </div>
      </body>
    </html>
  )
}