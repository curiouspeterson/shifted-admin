/**
 * API Error Handling
 * Last Updated: 2025-01-17
 * 
 * Error handling utilities for API requests and responses.
 * Includes type-safe error codes and response structures.
 */

import { BaseError, ErrorSeverity, ErrorCategory, ErrorContext } from './base'
import { Json } from '@/lib/types/json'
import { z } from 'zod'

/**
 * API error codes
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  REQUEST_FAILED = 'REQUEST_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Extended error context for API errors
 */
export interface ApiErrorContext extends ErrorContext {
  statusCode: number;
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
  code: z.ZodIssueCode;
}

/**
 * API error details structure
 */
export interface ApiErrorDetails extends Record<string, unknown> {
  code?: ApiErrorCode;
  details?: Record<string, Json>;
  resource?: string;
  requestId?: string;
  cause?: unknown;
  stack?: string;
  validation?: ValidationErrorDetail[];
  component?: 'headers' | 'query' | 'params' | 'body';
  status?: number;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetails;
  timestamp: string;
}

/**
 * Format validation error details
 */
function formatValidationError(error: z.ZodError): ValidationErrorDetail[] {
  return error.errors.map(err => ({
    path: err.path,
    message: err.message,
    code: err.code
  }));
}

/**
 * Create an API error response
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetails
): ApiErrorResponse {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  }
}

/**
 * Format an error for API response
 */
export function formatApiError(error: unknown): ApiErrorResponse {
  if (error instanceof z.ZodError) {
    return createApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Validation error',
      { validation: formatValidationError(error) }
    );
  }

  if (error instanceof BaseError) {
    return createApiError(
      error.code as ApiErrorCode,
      error.message,
      error.details as ApiErrorDetails
    )
  }

  if (error instanceof Error) {
    return createApiError(
      ApiErrorCode.INTERNAL_ERROR,
      error.message,
      { stack: error.stack } as ApiErrorDetails
    )
  }
  
  return createApiError(
    ApiErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    error instanceof Object ? error as ApiErrorDetails : undefined
  )
}

/**
 * Parse an API error response
 */
export function parseApiError(response: Response): Promise<ApiErrorResponse> {
  return response.json().catch(() => ({
    code: ApiErrorCode.INTERNAL_ERROR,
    message: `HTTP error! status: ${response.status}`,
    timestamp: new Date().toISOString()
  }))
}

/**
 * API Error Class
 * 
 * Custom error class for API errors with status code and details.
 */
export class ApiError extends BaseError {
  constructor(
    message: string,
    public status: number,
    details?: ApiErrorDetails
  ) {
    super(message, {
      code: 'API_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.NETWORK,
      details,
      source: 'api',
      context: {
        statusCode: status
      },
      timestamp: new Date().toISOString()
    })
    this.name = 'ApiError'
  }
}