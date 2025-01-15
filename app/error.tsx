/**
 * Root Error Handler
 * Last Updated: 2024-03-20
 * 
 * This component provides error handling for the entire application
 * following Next.js App Router best practices.
 */

'use client'

import { useEffect } from 'react'
import { errorLogger, formatNextError } from '@/lib/logging/error-logger'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error with proper formatting
    errorLogger.error('Unhandled application error', {
      error: formatNextError(error),
      requestId: crypto.randomUUID()
    })
  }, [error])

  return (
    <div className="min-h-screen bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <main className="sm:flex">
          <p className="text-4xl font-bold tracking-tight text-red-600 sm:text-5xl">500</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Something went wrong!
              </h1>
              <p className="mt-1 text-base text-gray-500">
                {error.message || 'An unexpected error occurred'}
              </p>
              {error.digest && (
                <p className="mt-1 text-sm text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <button
                onClick={reset}
                className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Go back home
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 