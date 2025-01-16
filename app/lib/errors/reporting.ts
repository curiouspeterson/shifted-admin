/**
 * Error Reporting Service
 * Last Updated: 2025-01-16
 * 
 * Error reporting service with support for multiple reporting platforms.
 */

import { AppError } from './base'
import { logger } from './logger'

/**
 * Error context type
 */
export interface ErrorContext {
  userId?: string
  requestId?: string
  url?: string
  action?: string
  [key: string]: unknown
}

/**
 * Error report structure
 */
export interface ErrorReport {
  name: string
  message: string
  stack?: string
  timestamp: string
  context?: ErrorContext
  metadata?: Record<string, unknown>
}

/**
 * Format error for reporting
 */
function formatErrorReport(
  error: unknown,
  context?: ErrorContext
): ErrorReport {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      metadata: {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      }
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
    timestamp: new Date().toISOString(),
    context
  }
}

/**
 * Error reporting service
 */
class ErrorReporter {
  private static instance: ErrorReporter

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  /**
   * Report an error
   */
  async report(error: unknown, context?: ErrorContext): Promise<void> {
    const report = formatErrorReport(error, context)

    // Log locally
    logger.error('Error reported', error, context)

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to error reporting service
        // await this.sendToErrorService(report)
        
        // For now, just log that we would send
        logger.info('Would send to error service:', { report })
      } catch (err) {
        logger.error('Failed to send error report', err)
      }
    }
  }

  /**
   * Handle unhandled rejection
   */
  handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.report(event.reason, {
      action: 'unhandledRejection'
    })
  }

  /**
   * Handle uncaught exception
   */
  handleUncaughtException = (error: Error): void => {
    this.report(error, {
      action: 'uncaughtException'
    })
  }

  /**
   * Initialize global error handlers
   */
  initializeGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.addEventListener('error', (event) => {
        this.report(event.error, {
          action: 'uncaughtError'
        })
      })
    }

    if (typeof process !== 'undefined') {
      process.on('uncaughtException', this.handleUncaughtException)
      process.on('unhandledRejection', (reason) => {
        this.report(reason, {
          action: 'unhandledRejection'
        })
      })
    }
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance() 