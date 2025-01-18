/**
 * Error Logger
 * Last Updated: 2025-03-19
 * 
 * Centralized error logging utility with severity levels and context.
 */

export const ErrorSeverity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'error'
} as const

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity]

interface ErrorContext {
  userId?: string
  path?: string
  action?: string
  [key: string]: unknown
}

interface LogEntry {
  message: string
  severity: ErrorSeverityType
  timestamp: string
  context?: ErrorContext
  error?: Error
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  error(message: string, context?: ErrorContext) {
    this.log(ErrorSeverity.ERROR, message, context)
  }

  warning(message: string, context?: ErrorContext) {
    this.log(ErrorSeverity.WARN, message, context)
  }

  info(message: string, context?: ErrorContext) {
    this.log(ErrorSeverity.INFO, message, context)
  }

  debug(message: string, context?: ErrorContext) {
    this.log(ErrorSeverity.DEBUG, message, context)
  }

  private log(severity: ErrorSeverityType, message: string, context?: ErrorContext) {
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