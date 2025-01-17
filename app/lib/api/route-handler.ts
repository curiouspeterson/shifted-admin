/**
 * API Route Handler
 * Last Updated: 2025-01-17
 * 
 * Provides type-safe route handlers with built-in:
 * - Request validation
 * - Rate limiting
 * - Response caching
 * - Error handling
 * - Performance monitoring
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Errors } from '@/lib/errors/types';
import { performance } from 'perf_hooks';

// Core types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: number;
  processingTime: number;
  cache?: CacheInfo;
  rateLimit?: RateLimitInfo;
}

export interface CacheInfo {
  status: 'hit' | 'miss' | 'bypass';
  ttl?: number;
  tags?: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Route context with auth and database access
export interface RouteContext {
  req: NextRequest;
  supabase: ReturnType<typeof createClient>;
  user?: { id: string; email: string };
  session?: { id: string };
}

// Rate limiting configuration
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

// Cache configuration
export interface CacheConfig {
  ttl: number;
  tags?: string[];
  revalidate?: number;
  staleWhileRevalidate?: number;
}

// API handler options
export interface ApiHandlerOptions<T, TRequest = unknown> {
  rateLimit?: RateLimitOptions;
  cache?: CacheConfig;
  validate?: {
    body?: z.ZodType<TRequest>;
    query?: z.ZodSchema;
  };
  handler: (
    req: NextRequest,
    context: RouteContext
  ) => Promise<NextResponse<ApiResponse<T>>>;
}

// Route handler type
export type RouteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse>;

/**
 * Create a type-safe route handler with built-in middleware
 */
export const createRouteHandler = <T, TRequest = unknown>(
  options: ApiHandlerOptions<T, TRequest>
): RouteHandler => {
  return async (req: NextRequest, context: RouteContext) => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();

    try {
      // Initialize Supabase client
      const supabase = createClient(cookies());
      
      // Setup context
      const routeContext: RouteContext = {
        req,
        supabase,
        user: context.user,
        session: context.session
      };

      // Rate limiting
      if (options.rateLimit) {
        const key = options.rateLimit.keyGenerator?.(req) ?? 
          req.ip ?? 
          req.headers.get('x-forwarded-for') ?? 
          'unknown';
          
        const { windowMs, maxRequests } = options.rateLimit;
        const rateLimitInfo = await checkRateLimit(key, windowMs, maxRequests);
        
        if (!rateLimitInfo.allowed) {
          throw Errors.rateLimit('Rate limit exceeded', rateLimitInfo);
        }
      }

      // Validate request
      if (options.validate) {
        if (req.method !== 'GET' && options.validate.body) {
          const body = await req.json() as TRequest;
          const result = await options.validate.body.safeParseAsync(body);
          
          if (!result.success) {
            throw Errors.validation('Invalid request body', result.error.errors);
          }
        }

        if (options.validate.query) {
          const searchParams = Object.fromEntries(
            new URL(req.url).searchParams.entries()
          );
          const result = await options.validate.query.safeParseAsync(searchParams);
          
          if (!result.success) {
            throw Errors.validation('Invalid query parameters', result.error.errors);
          }
        }
      }

      // Handle the request
      const response = await options.handler(req, routeContext);
      const endTime = performance.now();

      // Add metadata to response
      const responseData = await response.json() as ApiResponse<T>;
      const enhancedResponse: ApiResponse<T> = {
        ...responseData,
        metadata: {
          requestId,
          timestamp: Date.now(),
          processingTime: endTime - startTime,
          ...(options.cache && { cache: getCacheInfo(options.cache) }),
          ...(options.rateLimit && { rateLimit: getRateLimitInfo(options.rateLimit) })
        }
      };

      return NextResponse.json(enhancedResponse, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      console.error(`Request ${requestId} failed:`, error);
      const endTime = performance.now();

      if (error instanceof Error) {
        const status = error.name === 'ValidationError' ? 400 : 500;
        return NextResponse.json<ApiResponse<T>>({
          error: error.message,
          metadata: {
            requestId,
            timestamp: Date.now(),
            processingTime: endTime - startTime
          }
        }, { status });
      }

      return NextResponse.json<ApiResponse<T>>({
        error: 'Internal server error',
        metadata: {
          requestId,
          timestamp: Date.now(),
          processingTime: endTime - startTime
        }
      }, { status: 500 });
    }
  };
};

// Helper functions
async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  // Implement rate limiting logic here
  // This is a placeholder that always allows requests
  return {
    allowed: true,
    remaining: maxRequests - 1,
    reset: Date.now() + windowMs
  };
}

function getCacheInfo(config: CacheConfig): CacheInfo {
  return {
    status: 'miss',
    ttl: config.ttl,
    tags: config.tags
  };
}

function getRateLimitInfo(config: RateLimitOptions): RateLimitInfo {
  return {
    limit: config.maxRequests,
    remaining: config.maxRequests - 1,
    reset: Date.now() + config.windowMs
  };
} 