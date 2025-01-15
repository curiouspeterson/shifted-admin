/**
 * Route Handler Module
 * Last Updated: 2025-01-15
 * 
 * This module provides a factory function for creating API route handlers with
 * built-in validation, caching, rate limiting, and error handling.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cacheService } from './cache';
import { ApiError } from './errors';
import { logger } from './logger';
import { rateLimiter } from './rate-limit';

export type RouteContext = {
  params?: Record<string, string>;
  auth?: {
    id: string;
    roles: string[];
  };
};

type RouteConfig<TBody = unknown, TQuery = unknown> = {
  auth?: {
    required?: boolean;
    roles?: string[];
  };
  validation?: {
    body?: z.Schema<TBody>;
    query?: z.Schema<TQuery>;
  };
  cache?: {
    enabled: boolean;
    tags?: string[];
    ttl?: number;
  };
  rateLimit?: {
    enabled: boolean;
    requests: number;
    window: number; // in seconds
  };
};

type HandlerContext<TBody = unknown, TQuery = unknown> = RouteContext & {
  validatedBody?: TBody;
  validatedQuery?: TQuery;
};

type ApiResponse<T = unknown> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  metadata: {
    timestamp: string;
    requestId: string;
    cached?: boolean;
    duration?: number;
  };
};

export function createRouteHandler<TResponse = unknown, TBody = unknown, TQuery = unknown>(
  config: RouteConfig<TBody, TQuery>,
  handler: (req: NextRequest, ctx: HandlerContext<TBody, TQuery>) => Promise<TResponse>
) {
  return async function routeHandler(
    req: NextRequest,
    context: RouteContext = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Rate limiting check
      if (config.rateLimit?.enabled) {
        const { requests, window } = config.rateLimit;
        const isAllowed = await rateLimiter.check(req, requests, window);
        if (!isAllowed) {
          throw new ApiError(
            'RATE_LIMIT_EXCEEDED',
            'Too many requests',
            429
          );
        }
      }

      // Cache check
      if (config.cache?.enabled) {
        const cached = await cacheService.get(req);
        if (cached) {
          return NextResponse.json(cached);
        }
      }

      // Validation
      let validatedBody: TBody | undefined;
      let validatedQuery: TQuery | undefined;

      if (config.validation?.body) {
        const body = await req.json().catch(() => ({}));
        validatedBody = await config.validation.body.parseAsync(body);
      }

      if (config.validation?.query) {
        const query = Object.fromEntries(new URL(req.url).searchParams);
        validatedQuery = await config.validation.query.parseAsync(query);
      }

      // Execute handler
      const result = await handler(req, {
        ...context,
        validatedBody,
        validatedQuery,
      });

      // Prepare response
      const response: ApiResponse<TResponse> = {
        data: result,
        error: null,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          duration: Date.now() - startTime,
        },
      };

      // Cache response if enabled
      if (config.cache?.enabled) {
        await cacheService.set(req, response);
      }

      return NextResponse.json(response);

    } catch (error) {
      logger.error('Route handler error', {
        path: new URL(req.url).pathname,
        error,
        requestId,
      });

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.errors,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
              duration: Date.now() - startTime,
            },
          },
          { status: 400 }
        );
      }

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
              duration: Date.now() - startTime,
            },
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            duration: Date.now() - startTime,
          },
        },
        { status: 500 }
      );
    }
  };
} 