/**
 * Error Handling Middleware
 * Last Updated: 2024-03-19 23:00 PST
 * 
 * This file provides middleware for handling errors in API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ErrorCodes } from '@/lib/errors/types';
import { AppError } from '@/lib/errors/base';
import { createError, isRetryableError } from '@/lib/errors/utils';

// Types
export type RouteHandler = (
  req: NextRequest,
  context?: { params: Record<string, string | string[]> }
) => Promise<NextResponse>;

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100, // ms
  maxDelay: 1000, // ms
  backoffFactor: 2,
};

/**
 * Wraps a route handler with error handling and retry logic
 */
export function withErrorHandler(
  handler: RouteHandler,
  retryConfig: Partial<RetryConfig> = {}
): RouteHandler {
  return async (req: NextRequest, context?: { params: Record<string, string | string[]> }) => {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: Error | AppError | unknown;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await handler(req, context);
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's not a retryable error or if it's not an AppError
        if (!(error instanceof AppError) || !isRetryableError(error)) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return handleError(lastError);
  };
}

/**
 * Handles errors and returns appropriate responses
 */
function handleError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for debugging
  console.error('Error in API route:', error);

  // Handle validation errors
  if (error instanceof z.ZodError) {
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      error.errors
    );
  }

  // Handle known AppError types
  if (error instanceof AppError) {
    return createErrorResponse(
      error.code,
      error.message,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }

  // Handle other Error types
  if (error instanceof Error) {
    return createErrorResponse(
      'INTERNAL_ERROR',
      error.message || 'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }

  // Handle unknown errors
  return createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred'
  );
}

/**
 * Creates an error response with the given details
 */
function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  const status = getStatusCode(code);
  const response: ErrorResponse = {
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Gets the HTTP status code for an error code
 */
function getStatusCode(code: string): number {
  switch (code) {
    case 'NOT_FOUND':
      return 404;
    case 'INVALID_INPUT':
    case 'VALIDATION_ERROR':
      return 400;
    case 'CONFLICT':
      return 409;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    default:
      return 500;
  }
}

/**
 * Validates a request body against a schema
 */
export async function validateRequest<T>(
  req: NextRequest,
  schema: z.Schema<T>
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError(
        'VALIDATION_ERROR',
        'Invalid request data',
        error.errors
      );
    }
    throw createError(
      'INVALID_INPUT',
      'Invalid request body'
    );
  }
} 