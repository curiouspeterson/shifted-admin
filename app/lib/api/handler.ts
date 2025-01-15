/**
 * API Route Handler Utility
 * Last Updated: 2024-03
 * 
 * This module provides utilities for creating API route handlers with consistent
 * error handling, response formatting, and request validation.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ZodError } from 'zod';
import { 
  HTTP_STATUS_OK,
  HTTP_STATUS_BAD_REQUEST, 
  HTTP_STATUS_UNAUTHORIZED, 
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_METHOD_NOT_ALLOWED,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_INTERNAL_SERVER_ERROR
} from '../constants/http';
import { 
  ValidationError, 
  AuthError, 
  ForbiddenError, 
  NotFoundError, 
  DatabaseError,
  AppError 
} from '../errors';
import { errorLogger, ErrorSeverity } from '../logging/error-logger';
import type { ApiResponse, RouteContext, RouteHandler, RouteHandlerConfig } from './types';
import { createRateLimiter, defaultRateLimits } from './rate-limit';
import { createMiddleware, applyCorsHeaders } from './middleware';
import { createCache, defaultCacheConfig } from './cache';

// Generate a unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get client IP address from request
const getClientIp = (req: NextRequest): string => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1';
};

/**
 * Creates a route handler with authentication, validation, and error handling.
 */
export const createRouteHandler: RouteHandler = <TQuery, TBody>(config: RouteHandlerConfig<TQuery, TBody>) => {
  // Create middleware if configured
  const middleware = config.middleware ? createMiddleware(config.middleware) : null;

  // Create cache if configured
  const cache = config.cache !== false ? createCache(config.cache) : null;
  const cacheConfig = config.cache && typeof config.cache === 'object' ? config.cache : defaultCacheConfig;

  return async (req: NextRequest) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const headers = new Headers();

    try {
      // Handle CORS if enabled
      if (config.cors !== false && applyCorsHeaders(req, headers)) {
        return new Response(null, { headers });
      }

      // Validate HTTP method
      if (config.methods && !config.methods.includes(req.method)) {
        throw new AppError(`Method ${req.method} not allowed`, HTTP_STATUS_METHOD_NOT_ALLOWED);
      }

      // Check cache if enabled and method is GET
      let cachedResponse = null;
      if (cache && req.method === 'GET') {
        cachedResponse = await cache.get(req);
        if (cachedResponse) {
          // Add cache headers
          const cacheHeaders = cache.getCacheControlHeaders();
          cacheHeaders.forEach((value, key) => headers.set(key, value));

          // Add cache metadata
          cachedResponse.metadata = {
            ...cachedResponse.metadata,
            cached: true,
            cacheHit: true,
            cacheTtl: cacheConfig.ttl,
          };

          return NextResponse.json(cachedResponse, { headers });
        }
      }

      // Apply middleware if configured
      let sanitizedQuery = undefined;
      if (middleware) {
        const middlewareResult = middleware.validateRequest(req);
        sanitizedQuery = middlewareResult.sanitizedQuery;
      }

      // Check rate limit if enabled
      let rateLimitInfo = undefined;
      if (config.rateLimit !== false) {
        const rateLimiter = createRateLimiter(config.rateLimit || defaultRateLimits.api);
        const clientIp = getClientIp(req);
        rateLimitInfo = await rateLimiter.check(clientIp);
      }

      // Create Supabase client
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      // Get session if authentication is required
      const { data: { session } } = await supabase.auth.getSession();
      if (config.requireAuth && !session) {
        throw new AuthError('Authentication required');
      }

      // Check supervisor role if required
      if (config.requireSupervisor && session?.user.user_metadata.role !== 'supervisor') {
        throw new ForbiddenError('Supervisor access required');
      }

      // Parse query parameters if schema provided
      let query = undefined;
      if (config.querySchema) {
        const searchParams = Object.fromEntries(req.nextUrl.searchParams);
        query = await config.querySchema.parseAsync(searchParams);
      }

      // Parse request body if schema provided
      let body = undefined;
      if (config.bodySchema && req.method !== 'GET') {
        const data = await req.json();
        body = await config.bodySchema.parseAsync(data);
      }

      // Create context
      const context: RouteContext<TQuery, TBody> = {
        supabase,
        session,
        query,
        body,
        requestId,
        rateLimit: rateLimitInfo,
        sanitizedQuery,
        cache: cache ? {
          hit: false,
          ttl: cacheConfig.ttl,
        } : undefined,
      };

      // Execute handler
      const response = await config.handler(context);

      // Add rate limit headers if available
      if (rateLimitInfo) {
        headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
        headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
        headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString());
      }

      // Add cache headers if enabled
      if (cache && req.method === 'GET') {
        const cacheHeaders = cache.getCacheControlHeaders();
        cacheHeaders.forEach((value, key) => headers.set(key, value));

        // Cache successful responses
        if (response.error === null) {
          await cache.set(req, {
            ...response,
            metadata: {
              ...response.metadata,
              cached: true,
              cacheHit: false,
              cacheTtl: cacheConfig.ttl,
            },
          });
        }
      }

      // Return success response
      return NextResponse.json({
        ...response,
        metadata: {
          ...response.metadata,
          requestId,
          duration: Date.now() - startTime,
          rateLimit: rateLimitInfo,
        }
      }, { 
        status: response.status || HTTP_STATUS_OK,
        headers,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      let response: ApiResponse;
      
      // Create base context for error logging
      const errorContext = {
        requestId,
        path: req.nextUrl.pathname,
        method: req.method,
        duration,
        query: req.nextUrl.searchParams.toString(),
      };

      // Handle validation errors
      if (error instanceof ZodError) {
        const validation: Record<string, string[]> = {};
        const { fieldErrors } = error.flatten();
        
        Object.entries(fieldErrors).forEach(([key, errors]) => {
          validation[key] = errors || [];
        });

        errorLogger.warn(error, {
          ...errorContext,
          validation,
          errorType: 'ValidationError',
        });

        response = {
          data: null,
          error: 'Validation failed',
          metadata: { 
            validation,
            requestId,
            duration,
            errorCode: 'VALIDATION_ERROR'
          },
        };
        return NextResponse.json(response, { status: HTTP_STATUS_BAD_REQUEST, headers });
      }

      // Handle known errors
      if (error instanceof AppError) {
        // Log based on error severity
        const severity = error instanceof ValidationError || error instanceof NotFoundError
          ? ErrorSeverity.WARN
          : error instanceof AuthError || error instanceof ForbiddenError
            ? ErrorSeverity.INFO
            : ErrorSeverity.ERROR;

        errorLogger.log(error, severity, {
          ...errorContext,
          errorType: error.constructor.name,
        });

        response = {
          data: null,
          error: error.message,
          metadata: {
            requestId,
            duration,
            errorCode: error.name.replace('Error', '').toUpperCase(),
          }
        };
        return NextResponse.json(response, { status: error.status, headers });
      }

      // Log unknown errors as critical
      errorLogger.critical(error, {
        ...errorContext,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      });

      // Return generic error response
      response = {
        data: null,
        error: 'Internal server error',
        metadata: {
          requestId,
          duration,
          errorCode: 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            originalError: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
      };

      return NextResponse.json(response, { 
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        headers,
      });
    }
  };
}; 