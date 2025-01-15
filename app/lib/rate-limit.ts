/**
 * Rate Limiting Utility
 * Last Updated: 2024-03-20
 * 
 * Implements rate limiting using an in-memory store.
 * Note: This is a simple implementation for development.
 * For production, use a distributed rate limiter (e.g., Redis).
 */

import { errorLogger } from '@/lib/logging/error-logger';
import { createRateLimitError, createError } from '@/lib/errors/middleware-errors';
import { measurePerformance, type PerformanceMetrics } from '@/lib/utils/performance';

interface RateLimitConfig {
  windowSize: number;  // in seconds
  maxRequests: number;
  burstSize?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  analytics?: {
    routeType: string;
    timestamp: string;
    identifier: string;
    performance?: {
      latency: number;
      cacheHit: boolean;
    };
  };
}

// Rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints
  auth: { windowSize: 60, maxRequests: 30 },  // 30 requests per minute
  
  // API endpoints
  api: { windowSize: 60, maxRequests: 100 },  // 100 requests per minute
  
  // Default for other routes
  default: { windowSize: 60, maxRequests: 200 }, // 200 requests per minute
  
  // Public routes
  public: { windowSize: 60, maxRequests: 300 }, // 300 requests per minute
  
  // Protected routes
  protected: { windowSize: 60, maxRequests: 150 }, // 150 requests per minute
};

// In-memory store for rate limits
const rateStore = new Map<string, { count: number; expires: number }>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now() / 1000;
  Array.from(rateStore.entries()).forEach(([key, value]) => {
    if (value.expires <= now) {
      rateStore.delete(key);
    }
  });
}, 60 * 1000);

/**
 * Format error for logging
 */
function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

/**
 * Check rate limit for a request
 */
export async function rateLimit(
  identifier: string,
  routeType: keyof typeof RATE_LIMITS | string
): Promise<RateLimitResult> {
  const startTime = Date.now();
  const config = RATE_LIMITS[routeType] || RATE_LIMITS.default;
  const now = Math.floor(Date.now() / 1000);
  const key = `${identifier}:${routeType}`;
  
  try {
    // Get current state
    const current = rateStore.get(key);
    const windowExpires = now + config.windowSize;
    
    if (!current || current.expires <= now) {
      // First request in window
      rateStore.set(key, {
        count: 1,
        expires: windowExpires
      });
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: windowExpires,
        analytics: {
          routeType,
          timestamp: new Date().toISOString(),
          identifier,
          performance: {
            latency: Date.now() - startTime,
            cacheHit: false
          }
        }
      };
    }
    
    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: current.expires,
        analytics: {
          routeType,
          timestamp: new Date().toISOString(),
          identifier,
          performance: {
            latency: Date.now() - startTime,
            cacheHit: true
          }
        }
      };
    }
    
    // Increment counter
    current.count++;
    rateStore.set(key, current);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      reset: current.expires,
      analytics: {
        routeType,
        timestamp: new Date().toISOString(),
        identifier,
        performance: {
          latency: Date.now() - startTime,
          cacheHit: true
        }
      }
    };
  } catch (err) {
    errorLogger.error('Rate limit check failed', {
      error: formatError(err),
      identifier,
      routeType,
      duration: Date.now() - startTime
    });
    
    // Fail open if rate limiting fails
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.windowSize,
      analytics: {
        routeType,
        timestamp: new Date().toISOString(),
        identifier,
        performance: {
          latency: Date.now() - startTime,
          cacheHit: false
        }
      }
    };
  }
} 