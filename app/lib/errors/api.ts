/**
 * API Error Types
 * Last Updated: 2025-01-17
 */

import { AppError } from './base';
import { 
  HTTP_STATUS_BAD_REQUEST, 
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_NOT_FOUND
} from '@/lib/constants/http';

export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ApiErrorDetail extends Record<string, unknown> {
  path: string;
  method: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export class ApiError extends AppError {
  constructor(message: string, details: ApiErrorDetail) {
    super({
      message,
      status: HTTP_STATUS_BAD_REQUEST,
      code: 'API_ERROR',
      details
    });
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, details: ApiErrorDetail) {
    super(message, {
      ...details,
      status: HTTP_STATUS_TOO_MANY_REQUESTS,
      code: 'RATE_LIMIT_ERROR'
    });
  }
}

export class InvalidRequestError extends ApiError {
  constructor(message: string, details: ApiErrorDetail) {
    super(message, {
      ...details,
      code: 'INVALID_REQUEST_ERROR'
    });
  }
}

export class EndpointNotFoundError extends ApiError {
  constructor(path: string, method: string) {
    super(`Endpoint not found: ${method} ${path}`, {
      path,
      method,
      status: HTTP_STATUS_NOT_FOUND,
      code: 'ENDPOINT_NOT_FOUND_ERROR'
    });
  }
}

export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError {
  return new AppError({
    message,
    code,
    details
  });
}

export function formatApiError(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }

  // Handle unknown errors
  const genericError = new AppError({
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: ApiErrorCode.INTERNAL_ERROR
  });

  return formatApiError(genericError);
}