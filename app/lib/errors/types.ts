/**
 * Error Types
 * Last Updated: 2025-01-17
 * 
 * Modern error handling system using discriminated unions and proper type safety.
 */

/**
 * Base error interface with discriminated union
 */
export interface BaseError {
  code: string;
  message: string;
  timestamp: string;
  correlationId: string;
  path?: string[];
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  path: string[];
}

/**
 * Error types using discriminated unions
 */
export type AppError =
  | {
      type: 'validation';
      errors: ValidationErrorDetail[];
    } & BaseError
  | {
      type: 'authentication';
      requiredPermissions?: string[];
    } & BaseError
  | {
      type: 'authorization';
      requiredRoles?: string[];
    } & BaseError
  | {
      type: 'notFound';
      resource: string;
      identifier?: string;
    } & BaseError
  | {
      type: 'database';
      operation: 'create' | 'read' | 'update' | 'delete';
      table: string;
    } & BaseError
  | {
      type: 'rateLimit';
      limit: number;
      remaining: number;
      reset: number;
    } & BaseError
  | {
      type: 'timeRange';
      start?: string;
      end?: string;
    } & BaseError;

/**
 * Error factory type
 */
export type ErrorFactory<T extends AppError['type']> = (
  message: string,
  details: Omit<Extract<AppError, { type: T }>, keyof BaseError | 'type'>
) => AppError;

/**
 * Create an error with proper typing and metadata
 */
export function createError<T extends AppError['type']>(
  type: T,
  message: string,
  details: Omit<Extract<AppError, { type: T }>, keyof BaseError | 'type'>
): AppError {
  return {
    type,
    message,
    code: `ERR_${type.toUpperCase()}`,
    timestamp: new Date().toISOString(),
    correlationId: crypto.randomUUID(),
    ...details,
  } as AppError;
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error &&
    'correlationId' in error
  );
}

/**
 * Error factories for each error type
 */
export const Errors = {
  validation: ((message, details) =>
    createError('validation', message, details)) as ErrorFactory<'validation'>,

  authentication: ((message, details) =>
    createError('authentication', message, details)) as ErrorFactory<'authentication'>,

  authorization: ((message, details) =>
    createError('authorization', message, details)) as ErrorFactory<'authorization'>,

  notFound: ((message, details) =>
    createError('notFound', message, details)) as ErrorFactory<'notFound'>,

  database: ((message, details) =>
    createError('database', message, details)) as ErrorFactory<'database'>,

  rateLimit: ((message, details) =>
    createError('rateLimit', message, details)) as ErrorFactory<'rateLimit'>,

  timeRange: ((message, details) =>
    createError('timeRange', message, details)) as ErrorFactory<'timeRange'>,
} as const; 

export interface ErrorDetails {
  [key: string]: unknown | undefined;
}

export interface ErrorContext {
  code: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  source: string;
  details?: ErrorDetails;
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
} 