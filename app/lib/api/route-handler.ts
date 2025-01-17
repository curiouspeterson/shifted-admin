/**
 * API Route Handler
 * Last Updated: 2025-01-17
 * 
 * Modern route handler implementation with proper error handling,
 * validation, rate limiting, and caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimiter } from './rate-limiter';
import { CacheControl } from './cache';
import { Errors, isAppError, type AppError } from '@/lib/errors/types';
import { withSupabase } from './middleware';
import { logger } from '@/lib/logging/logger';
import type { 
  ApiHandlerOptions, 
  ApiResponse, 
  ResponseMetadata,
  CacheInfo,
  RateLimit,
  ExtendedNextRequest,
  RouteContext
} from './types';

export type RouteHandler = (
  req: ExtendedNextRequest,
  context?: RouteContext
) => Promise<NextResponse>;

/**
 * Get base metadata for API responses
 */
function getBaseMetadata(
  cache?: CacheInfo | undefined,
  rateLimit?: RateLimit | undefined
): ResponseMetadata {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    duration: 0
  };
}

/**
 * Creates a type-safe route handler with built-in error handling,
 * validation, rate limiting, and caching.
 */
export function createRouteHandler<T = unknown>(
  handler: RouteHandler,
  options: ApiHandlerOptions<T> = {}
): RouteHandler {
  return async (req: NextRequest, context?: { params?: Record<string, string> }): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    let rateLimitState: RateLimit | undefined;
    let cacheInfo: CacheInfo | undefined;

    // Create request-scoped logger
    const requestLogger = logger.child({
      requestId,
      method: req.method,
      path: new URL(req.url).pathname,
    });

    try {
      // Extend request with Supabase client and session
      const extendedReq = await withSupabase(req);

      // Initialize rate limiter if configured
      let rateLimiter: RateLimiter | null = null;
      if (options.rateLimit) {
        rateLimiter = new RateLimiter(options.rateLimit);
        requestLogger.debug('Rate limiter initialized', { 
          config: options.rateLimit 
        });
      }

      // Check rate limit if enabled
      if (rateLimiter) {
        const key = options.rateLimit?.identifier || extendedReq.ip || 'unknown';
        const { success, limit, remaining, reset } = await rateLimiter.check(key);
        
        rateLimitState = { limit, remaining, reset };
        requestLogger.debug('Rate limit checked', { rateLimitState });
        
        if (!success) {
          throw Errors.rateLimit('Rate limit exceeded', rateLimitState);
        }
      }

      // Validate request components if configured
      if (options.validate) {
        requestLogger.debug('Validating request');

        // Validate query parameters
        if (options.validate.query) {
          const query = Object.fromEntries(new URL(extendedReq.url).searchParams);
          const result = await options.validate.query.safeParseAsync(query);
          if (!result.success) {
            throw Errors.validation('Invalid query parameters', {
              errors: result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: 'INVALID_QUERY',
                path: err.path.map(p => p.toString())
              }))
            });
          }
        }

        // Validate request body for non-GET requests
        if (options.validate.body && extendedReq.method !== 'GET') {
          const body = await extendedReq.json();
          const result = await options.validate.body.safeParseAsync(body);
          if (!result.success) {
            throw Errors.validation('Invalid request body', {
              errors: result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: 'INVALID_BODY',
                path: err.path.map(p => p.toString())
              }))
            });
          }
        }

        // Validate URL parameters
        if (options.validate.params && context?.params) {
          const result = await options.validate.params.safeParseAsync(context.params);
          if (!result.success) {
            throw Errors.validation('Invalid URL parameters', {
              errors: result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: 'INVALID_PARAMS',
                path: err.path.map(p => p.toString())
              }))
            });
          }
        }

        requestLogger.debug('Request validation successful');
      }

      // Execute handler with extended request
      const response = await handler(extendedReq, context);

      // Add cache headers if configured
      if (options.cache) {
        response.headers.set('Cache-Control', options.cache.control);
        
        if (options.cache.tags?.length) {
          response.headers.set('x-next-cache-tags', options.cache.tags.join(','));
        }

        if (options.cache.revalidate) {
          response.headers.set('x-next-revalidate', options.cache.revalidate.toString());
        }

        cacheInfo = {
          hit: false,
          ttl: options.cache.revalidate || 0
        };
      }

      // Add rate limit headers if enabled
      if (rateLimiter) {
        const key = options.rateLimit?.identifier || extendedReq.ip || 'unknown';
        const state = await rateLimiter.getState(key);
        rateLimitState = state;
        
        response.headers.set('X-RateLimit-Limit', state.limit.toString());
        response.headers.set('X-RateLimit-Remaining', state.remaining.toString());
        response.headers.set('X-RateLimit-Reset', state.reset.toString());
      }

      // Add metadata to successful responses
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        if (data && typeof data === 'object' && !data.error) {
          const metadata = getBaseMetadata(cacheInfo, rateLimitState);
          metadata.processingTime = Date.now() - startTime;

          const enrichedData: ApiResponse = {
            data: data.data,
            error: null,
            metadata
          };
          
          requestLogger.info('Request successful', {
            status: response.status,
            processingTime: metadata.processingTime
          });

          return NextResponse.json(enrichedData, {
            status: response.status,
            headers: response.headers
          });
        }
      }

      return response;
    } catch (error) {
      const apiError = isAppError(error) ? error : Errors.database(
        'Internal server error',
        { 
          operation: 'read',
          table: 'unknown'
        }
      );

      requestLogger.error('Request failed', apiError);

      return NextResponse.json({
        data: null,
        error: apiError,
        metadata: getBaseMetadata(cacheInfo, rateLimitState)
      }, {
        status: getErrorStatus(apiError),
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
  };
}

/**
 * Get HTTP status code for error type
 */
function getErrorStatus(error: AppError): number {
  switch (error.type) {
    case 'validation':
      return 400;
    case 'authentication':
      return 401;
    case 'authorization':
      return 403;
    case 'notFound':
      return 404;
    case 'rateLimit':
      return 429;
    default:
      return 500;
  }
} 