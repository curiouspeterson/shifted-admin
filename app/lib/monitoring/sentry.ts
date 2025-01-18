/**
 * Sentry Error Monitoring Configuration
 * Last Updated: 2025-01-16
 * 
 * Configures Sentry for error monitoring and reporting.
 */

import * as Sentry from '@sentry/nextjs';
import { init, captureException, captureMessage, setContext, setTag, setUser, type SeverityLevel } from '@sentry/nextjs';
import { errorLogger, ErrorSeverity } from '@/app/lib/logging/error-logger';
import { AppError } from '../errors/base';

// Map our error severity levels to Sentry severity levels
const severityMap: Record<ErrorSeverity, SeverityLevel> = {
  [ErrorSeverity.DEBUG]: 'debug',
  [ErrorSeverity.INFO]: 'info',
  [ErrorSeverity.WARN]: 'warning',
  [ErrorSeverity.ERROR]: 'error',
  [ErrorSeverity.CRITICAL]: 'fatal',
};

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry with environment-specific configuration
 */
export function initSentry(): void {
  if (typeof SENTRY_DSN !== 'string' || SENTRY_DSN.length === 0) {
    errorLogger.warn('Sentry DSN not found', {
      context: {
        message: 'Error monitoring will be disabled',
        environment: process.env.NODE_ENV
      }
    });
    return;
  }

  init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Report an error to Sentry with additional context
 */
export function reportError(
  error: Error | AppError | unknown,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context: Record<string, unknown> = {}
): void {
  // Don't report errors in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_ERROR_REPORTING !== 'true') {
    console.debug('Error reporting disabled in development:', error);
    return;
  }

  // Set error context and tags
  setContext('error', {
    ...context,
    timestamp: new Date().toISOString(),
  });

  // Add user context if available
  const userId = context.userId;
  if (typeof userId === 'string' && userId.length > 0) {
    setUser({ id: userId });
  }

  // Add request context if available
  const requestId = context.requestId;
  if (typeof requestId === 'string' && requestId.length > 0) {
    setTag('requestId', requestId);
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    captureException(error, {
      level: severityMap[severity],
      tags: {
        errorCode: error.code,
        errorType: error.constructor.name,
      },
      contexts: {
        error: {
          code: error.code,
          details: error.details,
        },
      },
    });
    return;
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    captureException(error, {
      level: severityMap[severity],
      tags: {
        errorType: error.constructor.name,
      },
    });
    return;
  }

  // Handle unknown error types
  captureMessage(String(error), {
    level: severityMap[severity],
    tags: {
      errorType: 'UnknownError',
    },
  });
}

/**
 * Set global tags for all error reports
 */
export function setGlobalTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    setTag(key, value);
  });
}

/**
 * Flush any pending error reports
 * Useful before shutting down the application
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
} 