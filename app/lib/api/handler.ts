/**
 * API Handler Module
 * Last Updated: 2024-01-17
 * 
 * Provides utilities for handling API routes with proper error handling
 * and type safety. Follows Next.js 14 best practices for API routes.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors/base';

export type ApiResponse<T = any> = {
  data?: T | null;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
};

type RouteHandlerOptions<T> = {
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  requireAuth?: boolean;
  bodySchema?: z.Schema<T>;
  handler: (params: {
    request: NextRequest;
    body?: T;
  }) => Promise<ApiResponse>;
};

export function createRouteHandler<T = any>({
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
      if (!methods.includes(request.method as any)) {
        return NextResponse.json(
          {
            error: {
              message: `Method ${request.method} not allowed`,
              code: 'METHOD_NOT_ALLOWED'
            }
          },
          { status: 405 }
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
            return NextResponse.json(
              {
                error: {
                  message: 'Validation error',
                  code: 'VALIDATION_ERROR',
                  details: error.errors
                }
              },
              { status: 400 }
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

      // Return error response
      return NextResponse.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
            details: result.error.details
          }
        },
        { status: result.error.code === 'NOT_FOUND' ? 404 : 400 }
      );
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              message: error.message,
              code: error.code
            }
          },
          { status: error.status || 400 }
        );
      }

      return NextResponse.json(
        {
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR'
          }
        },
        { status: 500 }
      );
    }
  };
} 