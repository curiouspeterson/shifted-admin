/**
 * Error Logger Module
 * Last Updated: 2024-01-16
 * 
 * Provides structured error logging with proper formatting
 * for different types of errors.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface ErrorDetails {
  name: string
  message: string
  stack?: string
  cause?: unknown
  code?: string
  digest?: string
  [key: string]: unknown
}

interface LogContext {
  [key: string]: unknown
}

class ErrorLogger {
  private static instance: ErrorLogger
  
  private constructor() {}
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Format an error into a structured object
   */
  formatError(error: unknown): ErrorDetails {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        ...(error as any)
      }
    }
    
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error
      }
    }
    
    return {
      name: 'UnknownError',
      message: 'An unknown error occurred',
      raw: error
    }
  }

  /**
   * Format Next.js errors with additional context
   */
  formatNextError(error: Error & { digest?: string }): ErrorDetails {
    return {
      ...this.formatError(error),
      digest: error.digest
    }
  }

  /**
   * Log an error message with context
   */
  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }

  /**
   * Log a warning message with context
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  /**
   * Log an info message with context
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  /**
   * Log a debug message with context
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  /**
   * Internal logging implementation
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...context
    }

    // In development, pretty print to console
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${timestamp}] ${message}`, context)
      return
    }

    // In production, you might want to send to a logging service
    // For now, just stringify and log
    console[level](JSON.stringify(logData))
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance()
export const { formatNextError } = errorLogger 