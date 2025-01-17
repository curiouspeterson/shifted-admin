/**
 * API Route Handler
 * Last Updated: 2025-01-17
 * 
 * Utility for creating type-safe Next.js 14+ route handlers with built-in
 * error handling, validation, rate limiting, and caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimiter } from './rate-limiter';
import { CacheControl } from './cache';
import { ValidationError } from '@/lib/errors';
import type { 
  ApiHandlerOptions, 
  ApiResponse, 
  ResponseMetadata,
  CacheInfo,
  RateLimit
} from './types';

export type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Get base metadata for API responses
 */
function getBaseMetadata(
  cache?: CacheInfo | null,
  rateLimit?: RateLimit
): ResponseMetadata {
  return {
    requestId: crypto.randomUUID(),
    processingTime: 0,
    version: '1.0',
    timestamp: new Date().toISOString(),
    cache: cache ?? null,
    rateLimit: rateLimit ?? {
      limit: 0,
      remaining: 0,
      reset: 0
    }
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
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now();
    let rateLimitState: RateLimit | undefined;
    let cacheInfo: CacheInfo | undefined;

    try {
      // Initialize rate limiter if configured
      let rateLimiter: RateLimiter | null = null;
      if (options.rateLimit) {
        rateLimiter = new RateLimiter(options.rateLimit);
      }

      // Check rate limit if enabled
      if (rateLimiter) {
        const key = options.rateLimit?.identifier || req.ip || 'unknown';
        const { success, limit, remaining, reset } = await rateLimiter.check(key);
        
        rateLimitState = { limit, remaining, reset };
        
        if (!success) {
          throw new ValidationError('Rate limit exceeded', {
            rateLimit: rateLimitState
          });
        }
      }

      // Validate request components if configured
      if (options.validate) {
        // Validate query parameters
        if (options.validate.query) {
          const query = Object.fromEntries(new URL(req.url).searchParams);
          const result = await options.validate.query.safeParseAsync(query);
          if (!result.success) {
            throw new ValidationError('Invalid query parameters', {
              validation: result.error.errors
            });
          }
        }

        // Validate request body for non-GET requests
        if (options.validate.body && req.method !== 'GET') {
          const body = await req.json();
          const result = await options.validate.body.safeParseAsync(body);
          if (!result.success) {
            throw new ValidationError('Invalid request body', {
              validation: result.error.errors
            });
          }
        }

        // Validate URL parameters
        if (options.validate.params && context?.params) {
          const result = await options.validate.params.safeParseAsync(context.params);
          if (!result.success) {
            throw new ValidationError('Invalid URL parameters', {
              validation: result.error.errors
            });
          }
        }
      }

      // Execute handler
      const response = await handler(req, context);

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
        const key = options.rateLimit?.identifier || req.ip || 'unknown';
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
          
          return NextResponse.json(enrichedData, {
            status: response.status,
            headers: response.headers
          });
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
} 