/**
 * Error Handling Module
 * Last Updated: 2024-01-15
 * 
 * Provides comprehensive error handling utilities for the application,
 * including custom error classes and helper functions for consistent
 * error handling across different layers.
 */

import { toast } from 'sonner';

/**
 * Base API Error class
 * Extends the base Error class with additional properties
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Validation Error class
 * Used for input validation errors
 */
export class ValidationError extends APIError {
  constructor(
    message: string,
    public fields: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR', { fields });
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error class
 * Used for authentication-related errors
 */
export class AuthError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

/**
 * Permission Error class
 * Used for authorization-related errors
 */
export class PermissionError extends APIError {
  constructor(
    message: string = 'Insufficient permissions',
    public resource?: string,
    public action?: string
  ) {
    super(message, 403, 'PERMISSION_ERROR', { resource, action });
    this.name = 'PermissionError';
  }
}

/**
 * Not Found Error class
 * Used when a requested resource is not found
 */
export class NotFoundError extends APIError {
  constructor(
    resource: string,
    id?: string | number
  ) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND_ERROR', { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error class
 * Used for resource conflicts
 */
export class ConflictError extends APIError {
  constructor(
    message: string,
    public conflictDetails?: Record<string, any>
  ) {
    super(message, 409, 'CONFLICT_ERROR', { details: conflictDetails });
    this.name = 'ConflictError';
  }
}

/**
 * Type guards for error classes
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Error Handler Function
 * Processes errors and returns a consistent error response format
 * Also shows appropriate toast notifications
 */
export function handleError(error: unknown): { 
  message: string; 
  status: number;
  code?: string;
  details?: Record<string, any>;
} {
  // Handle known error types
  if (isAPIError(error)) {
    // Show appropriate toast notification based on error type
    if (isValidationError(error)) {
      toast.error('Please check your input');
    } else if (isAuthError(error)) {
      toast.error('Authentication required');
    } else if (isPermissionError(error)) {
      toast.error('Access denied');
    } else if (isNotFoundError(error)) {
      toast.error('Resource not found');
    } else if (isConflictError(error)) {
      toast.error('Resource conflict detected');
    } else {
      toast.error('An error occurred');
    }

    return {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    toast.error('An unexpected error occurred');
    return {
      message: error.message,
      status: 500,
      code: 'INTERNAL_ERROR',
    };
  }

  // Handle unknown error types
  toast.error('Something went wrong');
  return {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Async error handler wrapper
 * Wraps an async function with error handling
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    rethrow?: boolean;
    onError?: (error: unknown) => void;
  }
): Promise<T | null> {
  return fn().catch((error) => {
    handleError(error);
    if (options?.onError) {
      options.onError(error);
    }
    if (options?.rethrow) {
      throw error;
    }
    return null;
  });
} 