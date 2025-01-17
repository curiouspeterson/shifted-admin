/**
 * API Route Handler Utilities
 * Last Updated: 2024-03-21
 * 
 * Utilities for handling API routes with rate limiting and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';

// Create rate limiter for API endpoints
const rateLimiter = createRateLimiter(defaultRateLimits.api);

interface RouteHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimit?: boolean;
}

/**
 * Creates a route handler with rate limiting and error handling
 */
export function createRouteHandler<T>(
  handler: (req: NextRequest) => Promise<T>,
  options: RouteHandlerOptions = {}
) {
  return async function routeHandler(req: NextRequest) {
    try {
      // Check rate limit if enabled
      if (options.rateLimit) {
        const identifier = req.ip || 'unknown';
        const isAllowed = await rateLimiter(identifier);
        
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      }
      
      // Execute handler
      const result = await handler(req);
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Route handler error:', error);
      
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  };
} 