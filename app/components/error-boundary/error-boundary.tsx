'use client';

/**
 * Error Boundary Component
 * Last Updated: 2025-01-17
 * 
 * Modern error boundary implementation with proper error handling,
 * recovery options, and error reporting.
 */

import React from 'react';
import { isAppError, type AppError } from '@/lib/errors/types';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | AppError; reset: () => void }>;
  onError?: (error: Error | AppError) => void;
}

interface State {
  error: Error | AppError | null;
}

/**
 * Modern error boundary component with TypeScript support
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error | AppError): State {
    return { error };
  }

  override componentDidCatch(error: Error | AppError, errorInfo: React.ErrorInfo): void {
    // Log error to error reporting service
    this.props.onError?.(error);
    console.error('Error caught by boundary:', { error, errorInfo });
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    const { error } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (error) {
      if (Fallback) {
        return <Fallback error={error} reset={this.reset} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-md">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {isAppError(error) ? `Error: ${error.type}` : 'An error occurred'}
                </h2>
                <p className="mt-2 text-gray-600">
                  {error.message}
                </p>
                {isAppError(error) && (
                  <p className="mt-1 text-sm text-gray-500">
                    Error Code: {error.code}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {isAppError(error) && error.type === 'validation' && (
                  <ul className="text-sm text-red-600 space-y-1">
                    {error.errors.map((err, index) => (
                      <li key={index}>
                        {err.field}: {err.message}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={this.reset}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Reload Page
                  </button>
                </div>

                {isAppError(error) && (
                  <p className="text-xs text-gray-500 text-center">
                    Correlation ID: {error.correlationId}
                  </p>
                )}
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
export function useErrorBoundary(): {
  showBoundary: (error: Error | AppError) => void;
} {
  const [, setError] = React.useState<Error | AppError | null>(null);

  const showBoundary = React.useCallback((error: Error | AppError) => {
    setError(() => {
      throw error;
    });
  }, []);

  return { showBoundary };
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
} 