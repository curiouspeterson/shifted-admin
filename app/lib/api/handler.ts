/**
 * API Handler Module
 * Last Updated: 2024-01-16
 * 
 * Provides utilities for handling API routes with proper error handling
 * and type safety. Follows Next.js 14 best practices for API routes.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors/base';
import { logger } from './logger';

// Valid HTTP methods for API routes
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// HTTP status codes mapped to error codes
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Structured error response type
export type ApiErrorResponse = {
  message: string;
  code: string;
  details?: z.ZodError | Record<string, unknown>;
};

// Type-safe API response
export type ApiResponse<T> = {
  data?: T | null;
  error?: ApiErrorResponse;
};

// Options for route handler configuration
type RouteHandlerOptions<T> = {
  methods: HttpMethod[];
  requireAuth?: boolean;
  bodySchema?: z.Schema<T>;
  handler: (params: {
    request: NextRequest;
    body?: T;
  }) => Promise<ApiResponse<T>>;
};

/**
 * Creates a type-safe route handler for Next.js API routes
 * @param options Configuration options for the route handler
 * @returns A Next.js route handler function
 */
export function createRouteHandler<T>({
  methods,
  requireAuth = true,
  bodySchema,
  handler
}: RouteHandlerOptions<T>) {
  return async function routeHandler(
    request: NextRequest
  ): Promise<NextResponse> {
    try {
      // Method validation
      if (!methods.includes(request.method as HttpMethod)) {
        logger.warn(`Method ${request.method} not allowed for this route`);
        return NextResponse.json(
          {
            error: {
              message: `Method ${request.method} not allowed`,
              code: 'METHOD_NOT_ALLOWED'
            }
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      // Parse and validate body if schema provided
      let body: T | undefined;
      if (bodySchema && request.method !== 'GET') {
        try {
          const json = await request.json();
          body = await bodySchema.parseAsync(json);
        } catch (error) {
          if (error instanceof z.ZodError) {
            logger.warn('Validation error in request body', { error: error.errors });
            return NextResponse.json(
              {
                error: {
                  message: 'Validation error',
                  code: 'VALIDATION_ERROR',
                  details: error.errors
                }
              },
              { status: HTTP_STATUS.BAD_REQUEST }
            );
          }
          throw error;
        }
      }

      // Handle the request
      const result = await handler({ request, body });

      // Return success response
      if (!result.error) {
        return NextResponse.json(result);
      }

      // Return error response with appropriate status code
      const status = getErrorStatus(result.error.code);
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    } catch (error) {
      logger.error('Unhandled API error:', { error });

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              message: error.message,
              code: error.code
            }
          },
          { status: getErrorStatus(error.code) }
        );
      }

      return NextResponse.json(
        {
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR'
          }
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

/**
 * Maps error codes to HTTP status codes
 */
function getErrorStatus(code: string): number {
  switch (code) {
    case 'NOT_FOUND':
      return HTTP_STATUS.NOT_FOUND;
    case 'UNAUTHORIZED':
      return HTTP_STATUS.UNAUTHORIZED;
    case 'FORBIDDEN':
      return HTTP_STATUS.FORBIDDEN;
    case 'VALIDATION_ERROR':
      return HTTP_STATUS.BAD_REQUEST;
    case 'CONFLICT':
      return HTTP_STATUS.CONFLICT;
    case 'INTERNAL_SERVER_ERROR':
      return HTTP_STATUS.INTERNAL_SERVER_ERROR;
    default:
      return HTTP_STATUS.BAD_REQUEST;
  }
} 