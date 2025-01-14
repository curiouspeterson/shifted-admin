/**
 * API Route Handler Module
 * Last Updated: 2024
 * 
 * This file provides a centralized way to create API route handlers with:
 * - Automatic authentication handling
 * - Supervisor permission checks
 * - Error handling and response formatting
 * - Type safety for request/response handling
 * - Consistent context injection
 * 
 * Features:
 * - Generic response types
 * - Request validation
 * - Database operations
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServer } from '../supabase';
import { AppError } from '../errors';
import { DatabaseError } from './database';
import { ValidationError } from './validation';
import { ApiResponse, ApiErrorResponse, ApiSuccessResponse, RouteContext, createErrorResponse, createSuccessResponse } from './types';
import type { Session } from '@supabase/supabase-js';

/**
 * Route Handler Type Definition
 * Defines the shape of route handler functions that can be wrapped by this utility
 */
type RouteHandler<T = unknown> = (
  req: NextRequest,
  context: RouteContext
) => Promise<ApiResponse<T>>;

/**
 * Handler Options Interface
 * Configuration options for route handler behavior
 */
interface HandlerOptions {
  requireAuth?: boolean;
  requireSupervisor?: boolean;
  validateBody?: z.ZodType;
  validateQuery?: z.ZodType;
  validateParams?: z.ZodType;
}

/**
 * Route Handler Factory
 * Creates a wrapped route handler with authentication and error handling
 * 
 * @param handler - The route handler function to wrap
 * @param options - Configuration options for authentication and validation
 * @returns A wrapped handler function with error handling and auth checks
 */
export function createRouteHandler<T = unknown>(
  handler: RouteHandler<T>,
  options: HandlerOptions = { requireAuth: true }
) {
  return async (req: NextRequest, context?: { params: { [key: string]: string } }) => {
    try {
      // Initialize Supabase client
      const supabase = createServer();

      // Handle authentication if required
      let session = null;
      if (options.requireAuth) {
        const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          return NextResponse.json(
            createErrorResponse('Authentication failed', {
              path: req.nextUrl.pathname,
            }),
            { status: 401 }
          );
        }
        
        if (!authSession) {
          return NextResponse.json(
            createErrorResponse('Unauthorized', {
              path: req.nextUrl.pathname,
            }),
            { status: 401 }
          );
        }

        session = authSession;
      }

      // Handle supervisor permission check if required
      if (options.requireSupervisor && session) {
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('position')
          .eq('user_id', session.user.id)
          .single();

        if (employeeError) {
          return NextResponse.json(
            createErrorResponse('Failed to verify permissions', {
              path: req.nextUrl.pathname,
            }),
            { status: 500 }
          );
        }

        if (!employee) {
          return NextResponse.json(
            createErrorResponse('Employee not found', {
              path: req.nextUrl.pathname,
            }),
            { status: 404 }
          );
        }

        if (!['shift_supervisor', 'management'].includes(employee.position)) {
          return NextResponse.json(
            createErrorResponse('Insufficient permissions', {
              path: req.nextUrl.pathname,
            }),
            { status: 403 }
          );
        }
      }

      // Validate request data if schemas are provided
      let validatedBody: unknown;
      let validatedQuery: unknown;
      let validatedParams: unknown;

      try {
        if (options.validateBody) {
          const body = await req.json();
          validatedBody = options.validateBody.parse(body);
        }

        if (options.validateQuery) {
          const searchParams = Object.fromEntries(req.nextUrl.searchParams);
          validatedQuery = options.validateQuery.parse(searchParams);
        }

        if (options.validateParams && context?.params) {
          validatedParams = options.validateParams.parse(context.params);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            createErrorResponse('Validation failed', {
              path: req.nextUrl.pathname,
              validation: error.errors,
            }),
            { status: 400 }
          );
        }
        throw error;
      }

      // Execute handler with context
      const response = await handler(req, {
        supabase,
        session,
        params: context?.params,
      });

      // Add metadata to response
      const metadata = {
        ...response.metadata,
        path: req.nextUrl.pathname,
      };

      // Return response with metadata
      return NextResponse.json(
        response.error
          ? createErrorResponse(response.error, metadata)
          : createSuccessResponse(response.data!, metadata)
      );
    } catch (error) {
      console.error('Route handler error:', error);

      // Handle known error types
      if (error instanceof ValidationError) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            path: req.nextUrl.pathname,
            validation: error.errors?.errors,
          }),
          { status: error.statusCode }
        );
      }

      if (error instanceof DatabaseError) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            path: req.nextUrl.pathname,
            originalError: error.originalError,
          }),
          { status: error.statusCode }
        );
      }

      if (error instanceof AppError) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            path: req.nextUrl.pathname,
          }),
          { status: error.statusCode }
        );
      }

      // Handle unknown errors
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : 'Internal server error',
          { path: req.nextUrl.pathname }
        ),
        { status: 500 }
      );
    }
  };
} 