/**
 * Base Error Classes
 * Last Updated: 2024-01-17
 * 
 * This module defines the base error classes used throughout the application.
 */

import { ErrorSeverity } from '../logging/error-logger';

/**
 * Base application error class
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    status = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(message = 'Network operation failed', details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, details);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * Time range error class
 */
export class TimeRangeError extends AppError {
  constructor(message = 'Invalid time range', details?: Record<string, unknown>) {
    super(message, 'TIME_RANGE_ERROR', 400, details);
  }
}

/**
 * Error utility functions
 */

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

export function isOfflineError(error: unknown): boolean {
  return error instanceof NetworkError && error.code === 'NETWORK_ERROR';
} 