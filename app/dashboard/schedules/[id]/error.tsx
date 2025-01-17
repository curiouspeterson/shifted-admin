/**
 * Schedule Page Error Boundary
 * Last Updated: 2024-03-21
 * 
 * Error boundary component for the schedule page.
 * Handles errors that occur during schedule data fetching and rendering.
 * Provides detailed error information and recovery options.
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { 
    digest?: string;
    status?: number;
    code?: string;
  };
  reset: () => void;
}

type ErrorCategory = 'auth' | 'network' | 'data' | 'unknown';

/**
 * Categorizes errors based on their type and properties
 */
function categorizeError(error: ErrorProps['error']): ErrorCategory {
  if (error.status === 401 || error.status === 403) {
    return 'auth';
  }
  if (error.status === 404 || error.code === 'PGRST116') {
    return 'data';
  }
  if (error.message.toLowerCase().includes('network') || error.status === 503) {
    return 'network';
  }
  return 'unknown';
}

/**
 * Gets user-friendly error message based on error category
 */
function getErrorMessage(category: ErrorCategory, error: Error): string {
  switch (category) {
    case 'auth':
      return 'You do not have permission to view this schedule. Please check your access rights.';
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection.';
    case 'data':
      return 'The requested schedule could not be found or has been deleted.';
    default:
      return error.message || 'An unexpected error occurred while loading the schedule.';
  }
}

export default function Error({ error, reset }: ErrorProps) {
  const category = categorizeError(error);
  const message = getErrorMessage(category, error);

  useEffect(() => {
    // Log error to monitoring service
    console.error('Schedule page error:', {
      message: error.message,
      digest: error.digest,
      status: error.status,
      code: error.code,
      category,
      timestamp: new Date().toISOString(),
    });
  }, [error, category]);

  return (
    <div className="container mx-auto py-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex flex-col items-center text-center">
          {category === 'network' ? (
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
          )}
          
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {category === 'network' ? 'Connection Error' : 'Error Loading Schedule'}
          </h3>
          
          <div className="mt-2 text-sm text-red-700 max-w-md">
            <p>{message}</p>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              onClick={reset}
              variant="secondary"
              className="bg-red-50 text-red-800 hover:bg-red-100 inline-flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            
            {category === 'auth' && (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="border-red-200 text-red-800 hover:bg-red-100"
              >
                Return to Dashboard
              </Button>
            )}
          </div>

          {error.digest && (
            <div className="mt-4 text-xs text-red-600">
              Error ID: {error.digest}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 