/**
 * Base Error Classes
 * Last Updated: 2024-01-15
 * 
 * This module provides the base error classes used throughout the application.
 * All custom error types should extend from AppError.
 */

/**
 * Base application error class
 * All custom error types should extend this class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly status: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Safely converts error details to a string representation
   */
  public getDetails(): string {
    if (!this.details) return '';
    try {
      return JSON.stringify(this.details);
    } catch {
      return String(this.details);
    }
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', 401, details);
  }
}

/**
 * Error thrown when authorization fails
 */
export class ForbiddenError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'FORBIDDEN_ERROR', 403, details);
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
  }
}

/**
 * Error thrown when a database operation fails
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Error thrown when a request is rate limited
 */
export class RateLimitError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * Error thrown when there is a configuration issue
 */
export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIG_ERROR', 500, details);
  }
}

/**
 * Error thrown when an external service request fails
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, details);
  }
}

/**
 * Error thrown when a request times out
 */
export class TimeoutError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIMEOUT_ERROR', 504, details);
  }
}

/**
 * Error thrown when a service worker operation fails
 */
export class ServiceWorkerError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'SERVICE_WORKER_ERROR', 500, details);
  }
} 