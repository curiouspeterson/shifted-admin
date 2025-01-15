/**
 * Application Error Classes
 * Last Updated: 2025-01-15
 * 
 * This module provides custom error classes for different types of errors
 * in the application.
 */

export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'API_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'TOO_MANY_REQUESTS';

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: any;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = this.constructor.name;
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.details = details.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  constructor(code: 'UNAUTHORIZED' | 'FORBIDDEN', message: string, details?: any) {
    super({
      code,
      message,
      details,
      statusCode: code === 'UNAUTHORIZED' ? 401 : 403,
    });
  }
}

/**
 * Database related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super({
      code: 'DATABASE_ERROR',
      message,
      details,
      statusCode: 500,
    });
  }
}

/**
 * API related errors
 */
export class ApiError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    const statusCode = 
      code === 'NOT_FOUND' ? 404 :
      code === 'VALIDATION_ERROR' ? 400 :
      code === 'TOO_MANY_REQUESTS' ? 429 :
      500;

    super({
      code,
      message,
      details,
      statusCode,
    });
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      details,
      statusCode: 400,
    });
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super({
      code: 'NOT_FOUND',
      message,
      details,
      statusCode: 404,
    });
  }
} 