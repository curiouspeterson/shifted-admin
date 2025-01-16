/**
 * Base Error Types
 * Last Updated: 2024-01-16
 * 
 * Base error classes and types for the application.
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'APP_ERROR',
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
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