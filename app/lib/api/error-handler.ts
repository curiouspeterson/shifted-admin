/**
 * API Error Handler
 * Last Updated: 2024-03-20
 * 
 * This module provides centralized error handling for API routes.
 * It includes error mapping, validation, and response formatting.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DatabaseError, ErrorCodes } from '../database/base/errors';
import { ErrorLogger } from '../logging/error-logger';

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = typeof HttpStatus[keyof typeof HttpStatus];

/**
 * Base API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Maps database errors to HTTP status codes
 */
function mapDatabaseErrorToStatus(error: DatabaseError): HttpStatus {
  switch (error.code) {
    case ErrorCodes.NOT_FOUND:
      return HttpStatus.NOT_FOUND;
    case ErrorCodes.DUPLICATE:
    case ErrorCodes.CONFLICT:
      return HttpStatus.CONFLICT;
    case ErrorCodes.FOREIGN_KEY:
      return HttpStatus.UNPROCESSABLE_ENTITY;
    case ErrorCodes.SERIALIZATION_FAILURE:
    case ErrorCodes.DEADLOCK_DETECTED:
    case ErrorCodes.TRANSACTION_FAILED:
    case ErrorCodes.UNKNOWN:
      return HttpStatus.INTERNAL_SERVER_ERROR;
    default:
      const _exhaustiveCheck: never = error.code;
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Formats validation errors
 */
function formatValidationError(error: ZodError): ApiError {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Formats database errors
 */
function formatDatabaseError(error: DatabaseError): ApiError {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
  };
}

/**
 * Formats unknown errors
 */
function formatUnknownError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      details: {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }

  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details: String(error),
  };
}

/**
 * API error handler class
 */
export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private readonly logger: ErrorLogger;

  private constructor() {
    this.logger = ErrorLogger.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  /**
   * Handle API errors and return appropriate response
   */
  public handleError(error: unknown): NextResponse<ApiErrorResponse> {
    let status: HttpStatus;
    let apiError: ApiError;

    // Handle different error types
    if (error instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      apiError = formatValidationError(error);
      this.logger.warn('Validation error', { error: apiError });
    } else if (error instanceof DatabaseError) {
      status = mapDatabaseErrorToStatus(error);
      apiError = formatDatabaseError(error);
      this.logger.error('Database error', error);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      apiError = formatUnknownError(error);
      this.logger.error('Unexpected error', error);
    }

    return NextResponse.json({ error: apiError }, { status });
  }

  /**
   * Create a validation error response
   */
  public validationError(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
    const apiError: ApiError = {
      code: 'VALIDATION_ERROR',
      message,
      details,
    };

    this.logger.warn('Validation error', { error: apiError });
    return NextResponse.json({ error: apiError }, { status: HttpStatus.BAD_REQUEST });
  }

  /**
   * Create an unauthorized error response
   */
  public unauthorizedError(message = 'Unauthorized'): NextResponse<ApiErrorResponse> {
    const apiError: ApiError = {
      code: 'UNAUTHORIZED',
      message,
    };

    this.logger.warn('Unauthorized access attempt', { error: apiError });
    return NextResponse.json({ error: apiError }, { status: HttpStatus.UNAUTHORIZED });
  }

  /**
   * Create a forbidden error response
   */
  public forbiddenError(message = 'Forbidden'): NextResponse<ApiErrorResponse> {
    const apiError: ApiError = {
      code: 'FORBIDDEN',
      message,
    };

    this.logger.warn('Forbidden access attempt', { error: apiError });
    return NextResponse.json({ error: apiError }, { status: HttpStatus.FORBIDDEN });
  }

  /**
   * Create a not found error response
   */
  public notFoundError(message: string): NextResponse<ApiErrorResponse> {
    const apiError: ApiError = {
      code: 'NOT_FOUND',
      message,
    };

    this.logger.warn('Resource not found', { error: apiError });
    return NextResponse.json({ error: apiError }, { status: HttpStatus.NOT_FOUND });
  }
} 