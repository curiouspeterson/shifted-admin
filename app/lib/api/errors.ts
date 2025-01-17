/**
 * API Error Handler
 * Last Updated: 2024-01-17
 * 
 * This module provides error handling utilities for API routes.
 */

import { NextResponse } from 'next/server';
import { AppError } from '../errors/base';
import { errorLogger } from '../logging/error-logger';

export class ApiError extends AppError {
  constructor(message: string, code = 'API_ERROR', status = 500, details?: Record<string, unknown>) {
    super(message, code, status, details);
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error
  errorLogger.error('API Error', { error });

  // Handle AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      },
      { status: error.status }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'UNKNOWN_ERROR'
        }
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      }
    },
    { status: 500 }
  );
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  code = 'API_ERROR',
  status = 500,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        code,
        details
      }
    },
    { status }
  );
}