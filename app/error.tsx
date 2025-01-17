/**
 * Global Error Boundary Component
 * Last Updated: 2025-01-17
 * 
 * Provides a consistent error handling experience across the application.
 * Features:
 * - Error logging
 * - User-friendly error messages
 * - Retry functionality
 * - Error details for development
 */

'use client'

import * as React from 'react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to your error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">
                Something went wrong!
              </h1>
              <p className="text-gray-600 mb-8">
                We apologize for the inconvenience. Our team has been notified and is working to fix the issue.
              </p>
              <div className="space-y-4">
                <button
                  onClick={reset}
                  className="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Try again
                </button>
                <button
                  className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => window.location.href = '/'}
                >
                  Return Home
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
                  <p className="font-mono text-sm text-gray-600">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="font-mono text-sm text-gray-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 