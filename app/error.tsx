/**
 * Global Error Handler
 * Last Updated: 2025-01-16
 * 
 * Global error handler component for Next.js app router.
 */

'use client'

import { useEffect } from 'react'
import { AppError } from '@/lib/errors/base'

interface Props {
  error: Error
  reset: () => void
}

/**
 * Global error handler component
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong!
              </h2>
              <p className="text-gray-600 mb-6">
                {error instanceof AppError
                  ? error.message
                  : 'An unexpected error occurred. Please try again later.'}
              </p>
              <button
                onClick={reset}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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