/**
 * Error Logger Module
 * Last Updated: 2024-03-20
 * 
 * This module provides centralized error logging functionality with proper typing
 * and structured logging capabilities. It includes support for different log levels,
 * structured metadata, and error serialization.
 */

import { DatabaseError } from '../database/base/errors'

/**
 * Log level enumeration
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Base structure for log metadata
 */
export interface BaseLogMetadata {
  timestamp: string
  level: LogLevel
  context?: string
  duration?: number
  message: string
  [key: string]: unknown
}

/**
 * Error log metadata with error-specific fields
 */
export interface ErrorLogMetadata extends BaseLogMetadata {
  error: {
    name: string
    message: string
    stack?: string
    code?: string
    details?: unknown
    cause?: {
      name: string
      message: string
      stack?: string
    }
  }
}

/**
 * Type guard for DatabaseError
 */
function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

/**
 * Type guard for Error
 */
function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Format error details for logging
 */
function formatError(error: unknown): ErrorLogMetadata['error'] {
  if (isDatabaseError(error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      cause: error.cause && isError(error.cause) ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }

  if (isError(error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }

  return {
    name: 'UnknownError',
    message: String(error)
  }
}

/**
 * Format Next.js error for logging
 */
export function formatNextError(error: Error & { digest?: string }): ErrorLogMetadata['error'] {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    details: error.digest ? { digest: error.digest } : undefined,
    cause: error.cause instanceof Error ? {
      name: error.cause.name,
      message: error.cause.message,
      stack: error.cause.stack
    } : undefined
  }
}

/**
 * Error Logger class
 */
export class ErrorLogger {
  private static instance: ErrorLogger
  private readonly isDevelopment: boolean

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log an error message
   */
  error(message: string, metadata: Partial<ErrorLogMetadata> = {}): void {
    this.log(LogLevel.ERROR, message, metadata)
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata: Partial<BaseLogMetadata> = {}): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  /**
   * Log an info message
   */
  info(message: string, metadata: Partial<BaseLogMetadata> = {}): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, metadata: Partial<BaseLogMetadata> = {}): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, metadata)
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, metadata: Partial<BaseLogMetadata | ErrorLogMetadata> = {}): void {
    const timestamp = new Date().toISOString()
    const logData: BaseLogMetadata = {
      timestamp,
      level,
      message,
      ...metadata
    }

    // Format error if present
    if ('error' in metadata && metadata.error) {
      (logData as ErrorLogMetadata).error = formatError(metadata.error)
    }

    // Log to console with appropriate level
    switch (level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(logData, null, 2))
        break
      case LogLevel.WARN:
        console.warn(JSON.stringify(logData, null, 2))
        break
      case LogLevel.INFO:
        console.info(JSON.stringify(logData, null, 2))
        break
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logData, null, 2))
        break
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance() 