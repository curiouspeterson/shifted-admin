/**
 * Error Logger
 * Last Updated: 2025-03-19
 * 
 * Centralized error logging utility with severity levels and context.
 */

export type ErrorSeverity = 'error' | 'warning' | 'info'

interface ErrorContext {
  userId?: string
  path?: string
  action?: string
  [key: string]: unknown
}

interface LogEntry {
  message: string
  severity: ErrorSeverity
  timestamp: string
  context?: ErrorContext
  error?: Error
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  error(message: string, context?: ErrorContext) {
    this.log('error', message, context)
  }

  warning(message: string, context?: ErrorContext) {
    this.log('warning', message, context)
  }

  info(message: string, context?: ErrorContext) {
    this.log('info', message, context)
  }

  private log(severity: ErrorSeverity, message: string, context?: ErrorContext) {
    const entry: LogEntry = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      ...(context && { context })
    }

    // In development, log to console
    if (this.isDevelopment) {
      console.log(JSON.stringify(entry, null, 2))
    }

    // TODO: Add production logging (e.g., to a service or database)
  }
}

export const errorLogger = new ErrorLogger() 