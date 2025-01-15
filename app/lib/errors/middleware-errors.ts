/**
 * Middleware Error Types
 * Last Updated: 2024-03-20
 * 
 * This module defines custom error types for middleware-related errors.
 * It provides proper error handling and type safety for different error scenarios.
 */

export type MiddlewareErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR'

export type MiddlewareErrorName = 
  | 'AuthenticationError'
  | 'RateLimitError'
  | 'ValidationError'
  | 'ConfigurationError'
  | 'UnknownError'

export class MiddlewareError extends Error {
  constructor(
    name: MiddlewareErrorName,
    message: string,
    public readonly code: MiddlewareErrorCode,
    public readonly details?: unknown,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = name
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Safely serialize the error for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : this.cause
    }
  }
}

/**
 * Create an authentication error
 */
export function createAuthError(message: string, cause?: Error): MiddlewareError {
  return new MiddlewareError(
    'AuthenticationError',
    message,
    'UNAUTHORIZED',
    undefined,
    cause
  )
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(message: string, details?: unknown): MiddlewareError {
  return new MiddlewareError(
    'RateLimitError',
    message,
    'RATE_LIMIT_EXCEEDED',
    details
  )
}

/**
 * Create a validation error
 */
export function createValidationError(message: string, details?: unknown): MiddlewareError {
  return new MiddlewareError(
    'ValidationError',
    message,
    'VALIDATION_ERROR',
    details
  )
}

/**
 * Create a configuration error
 */
export function createConfigurationError(message: string, details?: unknown): MiddlewareError {
  return new MiddlewareError(
    'ConfigurationError',
    message,
    'CONFIGURATION_ERROR',
    details
  )
}

/**
 * Create a generic error
 */
export function createError(message: string, cause?: Error): MiddlewareError {
  return new MiddlewareError(
    'UnknownError',
    message,
    'UNKNOWN_ERROR',
    undefined,
    cause
  )
} 