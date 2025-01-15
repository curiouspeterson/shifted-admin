/**
 * Error Alert Component
 * Last Updated: 2025-01-15
 * 
 * This component displays error messages with a retry option.
 * It provides a consistent error UI across the application.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  title: string;
  error: Error | null;
  onReset?: () => void;
}

export function ErrorAlert({ title, error, onReset }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-50 p-2 text-xs text-red-900 dark:bg-red-950 dark:text-red-100">
              {error.stack}
            </pre>
          )}
        </div>
        {onReset && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={onReset}
              className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              Try again
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 