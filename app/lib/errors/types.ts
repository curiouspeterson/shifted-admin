/**
 * Error Types and Utilities
 * Last Updated: 2025-01-17
 * 
 * Provides type-safe error handling utilities for the application.
 */

export type ErrorType = 
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'notFound'
  | 'rateLimit'
  | 'database'
  | 'unknown';

export interface BaseError {
  type: ErrorType;
  message: string;
  code: string;
  status: number;
  details?: unknown;
}

export class AppError extends Error implements BaseError {
  constructor(
    public type: ErrorType,
    public override message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details
    };
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const Errors = {
  validation: (message: string, details?: unknown) => new AppError(
    'validation',
    message,
    'VALIDATION_ERROR',
    400,
    details
  ),
  
  authentication: (message: string, details?: unknown) => new AppError(
    'authentication',
    message,
    'AUTHENTICATION_ERROR',
    401,
    details
  ),
  
  authorization: (message: string, details?: unknown) => new AppError(
    'authorization',
    message,
    'AUTHORIZATION_ERROR',
    403,
    details
  ),
  
  notFound: (message: string, details?: unknown) => new AppError(
    'notFound',
    message,
    'NOT_FOUND',
    404,
    details
  ),
  
  rateLimit: (message: string, details?: unknown) => new AppError(
    'rateLimit',
    message,
    'RATE_LIMIT_EXCEEDED',
    429,
    details
  ),
  
  database: (message: string, details?: unknown) => new AppError(
    'database',
    message,
    'DATABASE_ERROR',
    500,
    details
  ),
  
  unknown: (message: string, details?: unknown) => new AppError(
    'unknown',
    message,
    'INTERNAL_SERVER_ERROR',
    500,
    details
  )
}; 