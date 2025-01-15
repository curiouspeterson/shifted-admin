'use client';

/**
 * Error Boundary Component
 * Last Updated: 2024-03
 * 
 * A component that catches JavaScript errors in its child component tree.
 * Features:
 * - Error catching and handling
 * - Fallback UI display
 * - Error logging
 * - Error recovery
 * - Accessibility support
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Must be a class component to use error boundary lifecycle methods
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {this.state.error?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
} 