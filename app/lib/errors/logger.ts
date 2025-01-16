/**
 * Error Logger
 * Last Updated: 2025-01-16
 * 
 * Error logging utility that works in both client and server environments.
 */

import { AppError } from './base'

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  error?: unknown
  context?: Record<string, unknown>
}

/**
 * Format error details
 */
function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }

  return { error }
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(error && { error: formatError(error) }),
    ...(context && { context })
  }
}

/**
 * Error logger class
 */
class ErrorLogger {
  private static instance: ErrorLogger

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, undefined, context)
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, undefined, context)
  }

  /**
   * Log a warning message
   */
  warn(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log('warn', message, error, context)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log('error', message, error, context)
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, error?: unknown, context?: Record<string, unknown>) {
    const entry = createLogEntry(level, message, error, context)

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console[level](entry)
      return
    }

    // In production, could send to logging service
    // TODO: Implement production logging
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Sentry, LogRocket, etc.)
    }
  }
}

// Export singleton instance
export const logger = ErrorLogger.getInstance() 