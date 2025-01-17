/**
 * API Request Handler
 * Last Updated: 2025-01-17
 * 
 * Common API request handling utilities for Next.js 14+ route handlers.
 * Implements proper error handling, logging, authentication checks,
 * response caching, rate limiting, and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from './logger';
import { 
  createApiError, 
  ApiErrorCode, 
  formatApiError, 
  ApiErrorResponse,
  ApiError 
} from '@/lib/errors/api';
import { headers } from 'next/headers';
import { z } from 'zod';
import { RateLimiter } from './rate-limiter';
import { AppError } from '@/lib/errors/base';
import { createRateLimiter } from './rate-limit';
import type { RouteHandlerConfig } from './types';

// HTTP Status codes
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,
} as const;

// Cache control options
export enum CacheControl {
  NoCache = 'no-cache, no-store, must-revalidate',
  Public = 'public, max-age=31536000, immutable',
  Private = 'private, no-cache, no-store, must-revalidate',
  ShortTerm = 'public, max-age=60, must-revalidate',
  LongTerm = 'public, max-age=31536000, immutable'
}

// Rate limit options
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

// Request validation options
export interface ValidationOptions {
  headers?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

export interface ApiHandlerOptions<T> {
  requireAuth?: boolean;
  allowedMethods?: string[];
  bodySchema?: z.Schema<T>;
  cache?: {
    control: CacheControl;
    revalidate?: number;
    tags?: string[];
  };
  rateLimit?: RateLimitOptions;
  validate?: ValidationOptions;
}

export interface ApiContext<T = unknown> {
  req: NextRequest;
  params?: Record<string, string>;
  headers: Headers;
  body?: T;
  query: URLSearchParams;
}

export type ApiResponse<T> = {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp?: string;
    requestId?: string;
  };
};

export type ApiHandler<T = unknown, R = unknown> = (
  context: ApiContext<T>
) => Promise<NextResponse<ApiResponse<R> | ApiErrorResponse>>;

/**
 * Creates a Next.js 14+ route handler with built-in error handling,
 * logging, authentication checks, response caching, rate limiting,
 * and request validation.
 */
export function createApiHandler<T = unknown, R = unknown>(
  handler: ApiHandler<T, R>, 
  options: ApiHandlerOptions<T> = {}
) {
  // Initialize rate limiter if configured
  const rateLimiter = options.rateLimit ? new RateLimiter(options.rateLimit) : null;

  // Clean up expired rate limit windows periodically
  if (rateLimiter) {
    setInterval(() => {
      rateLimiter.cleanup();
    }, 60000); // Clean up every minute
  }

  return async function apiHandler(
    req: NextRequest,
    params?: Record<string, string>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const headersList = headers();

    try {
      // Log request
      await apiLogger.info(`API Request: ${req.method} ${req.url}`, {
        requestId,
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(headersList.entries()),
      });

      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        throw createApiError(
          ApiErrorCode.BAD_REQUEST,
          `Method ${req.method} not allowed`,
          { status: 405 }
        );
      }

      // Rate limiting check
      if (rateLimiter) {
        const key = options.rateLimit?.keyGenerator?.(req) || req.ip || 'unknown';
        const { success, limit, remaining, reset } = await rateLimiter.check(key);
        
        if (!success) {
          throw createApiError(
            ApiErrorCode.RATE_LIMIT_EXCEEDED,
            'Too many requests',
            { 
              status: HTTP_STATUS.TOO_MANY_REQUESTS,
              details: { limit, remaining, reset }
            }
          );
        }
      }

      // Auth validation if required
      if (options.requireAuth) {
        const authHeader = headersList.get('authorization');
        if (!authHeader) {
          throw createApiError(
            ApiErrorCode.UNAUTHORIZED,
            'Missing authorization header',
            { status: HTTP_STATUS.UNAUTHORIZED }
          );
        }
        // Add your auth validation logic here
      }

      // Validate request components
      if (options.validate) {
        // Validate headers
        if (options.validate.headers) {
          try {
            await options.validate.headers.parseAsync(
              Object.fromEntries(headersList.entries())
            );
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw createApiError(
                ApiErrorCode.VALIDATION_ERROR,
                'Invalid headers',
                { 
                  status: 400,
                  validation: error.errors,
                  component: 'headers'
                }
              );
            }
            throw error;
          }
        }

        // Validate query parameters
        if (options.validate.query) {
          try {
            await options.validate.query.parseAsync(
              Object.fromEntries(req.nextUrl.searchParams.entries())
            );
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw createApiError(
                ApiErrorCode.VALIDATION_ERROR,
                'Invalid query parameters',
                { 
                  status: 400,
                  validation: error.errors,
                  component: 'query'
                }
              );
            }
            throw error;
          }
        }

        // Validate URL parameters
        if (options.validate.params && params) {
          try {
            await options.validate.params.parseAsync(params);
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw createApiError(
                ApiErrorCode.VALIDATION_ERROR,
                'Invalid URL parameters',
                { 
                  status: 400,
                  validation: error.errors,
                  component: 'params'
                }
              );
            }
            throw error;
          }
        }
      }

      // Parse and validate request body if schema provided
      let body: T | undefined;
      if (options.bodySchema && req.method !== 'GET') {
        try {
          const json = await req.json();
          body = await options.bodySchema.parseAsync(json);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw createApiError(
              ApiErrorCode.VALIDATION_ERROR,
              'Invalid request data',
              { 
                status: 400,
                validation: error.errors,
                component: 'body'
              }
            );
          }
          throw error;
        }
      }

      // Execute handler with context
      const response = await handler({ 
        req, 
        params, 
        headers: headersList,
        body,
        query: req.nextUrl.searchParams
      });

      // Add caching headers if configured
      if (options.cache) {
        response.headers.set('Cache-Control', options.cache.control);
        
        if (options.cache.tags) {
          response.headers.set('x-next-cache-tags', options.cache.tags.join(','));
        }
      }

      // Add rate limit headers if enabled
      if (rateLimiter) {
        const key = options.rateLimit?.keyGenerator?.(req) || req.ip || 'unknown';
        const { limit, remaining, reset } = await rateLimiter.getState(key);
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', reset.toString());
      }

      // Add metadata to successful responses
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        if (data && typeof data === 'object' && !data.error) {
          const enrichedData = {
            ...data,
            meta: {
              ...data.meta,
              timestamp: new Date().toISOString(),
              requestId
            }
          };
          
          const headers = new Headers(response.headers);
          headers.set('Content-Type', 'application/json');
          
          return NextResponse.json(enrichedData, {
            status: response.status,
            headers,
            ...options.cache?.revalidate ? { 
              revalidate: options.cache.revalidate 
            } : {}
          });
        }
      }

      // Log response
      const duration = Date.now() - startTime;
      await apiLogger.info(`API Response: ${req.method} ${req.url}`, {
        requestId,
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      await apiLogger.error(`API Error: ${req.method} ${req.url}`, {
        requestId,
        error,
        duration,
      });

      // Return error response
      if (error instanceof NextResponse) {
        return error;
      }

      // Format error response
      const errorResponse = formatApiError(error);
      return NextResponse.json(
        {
          ...errorResponse,
          meta: {
            timestamp: new Date().toISOString(),
            requestId
          }
        },
        { 
          status: errorResponse.details?.status as number || 500,
          headers: {
            'Cache-Control': CacheControl.NoCache
          }
        }
      );
    }
  };
}

/**
 * API Route Handler Factory
 * Last Updated: 2025-01-17
 */

export const createRouteHandler = <T extends z.ZodType>(config: RouteHandlerConfig<T>) => {
  const { schema, handler, rateLimit } = config;
  
  return async (req: NextRequest) => {
    try {
      if (rateLimit) {
        const limiter = createRateLimiter(rateLimit);
        await limiter.consume(req.ip);
      }

      const data = schema ? await schema.parseAsync(await req.json()) : undefined;
      const result = await handler(req, data);
      
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}; 