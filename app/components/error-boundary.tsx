/**
 * Error Boundary Component
 * Last Updated: 2024-03-19 20:15 PST
 * 
 * This component provides error boundary functionality for React components,
 * catching and handling errors that occur during rendering.
 */

'use client';

import React from 'react';
import { AppError } from '@/lib/errors/base';
import { createError, getUserMessage, getRecoveryActions } from '@/lib/errors/utils';
import { ErrorCodes } from '@/lib/errors/types';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AppError }>;
}

interface State {
  error: AppError | null;
}

/**
 * Error boundary component
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert Error to AppError
    const appError = error instanceof AppError
      ? error
      : createError(
          ErrorCodes.SYSTEM_ERROR,
          error.message || 'An unexpected error occurred',
          { originalError: error }
        );

    return { error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    const { error } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (error) {
      if (Fallback) {
        return <Fallback error={error} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 mb-4">
                {getUserMessage(error)}
              </p>
              <div className="space-y-2">
                {getRecoveryActions(error).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => action.handler()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Error boundary hook for functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<AppError | null>(null);

  const showError = React.useCallback((error: Error | AppError) => {
    const appError = error instanceof AppError
      ? error
      : createError(
          ErrorCodes.SYSTEM_ERROR,
          error.message || 'An unexpected error occurred',
          { originalError: error }
        );

    setError(appError);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    showError,
    clearError,
  };
} 