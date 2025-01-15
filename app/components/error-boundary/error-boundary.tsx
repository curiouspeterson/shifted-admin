/**
 * Error Boundary Component
 * Last Updated: 2025-01-15
 * 
 * This component catches React component errors and provides fallback UI.
 * It integrates with our error logging system and Sentry for error tracking.
 */

'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { ErrorAlert } from './error-alert';
import { errorLogger, ErrorSeverity } from '@/lib/logging/error-logger';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to our logging system
    errorLogger.error(error, {
      componentStack: errorInfo.componentStack,
      errorType: 'ReactError',
    });

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', errorInfo.componentStack);
      Sentry.captureException(error);
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorAlert
          title="Something went wrong"
          error={error}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
} 