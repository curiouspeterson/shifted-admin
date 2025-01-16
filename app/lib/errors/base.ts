/**
 * Base Error Classes
 * Last Updated: 2024-01-16
 * 
 * Core error classes for the application.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    statusCode = 500,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(message: string, options: { cause?: unknown; details?: unknown } = {}) {
    super(message, 'DATABASE_ERROR', 500, options.details)
    this.name = 'DatabaseError'
    if (options.cause) this.cause = options.cause
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', 401, details)
    this.name = 'AuthError'
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', 404, details)
    this.name = 'NotFoundError'
  }
}

/**
 * Permission error
 */
export class PermissionError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'PERMISSION_ERROR', 403, details)
    this.name = 'PermissionError'
  }
} 