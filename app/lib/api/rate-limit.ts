/**
 * API Rate Limiting
 * Last Updated: 2025-01-17
 * 
 * Rate limiting configurations and defaults for API routes.
 */

import { RateLimitOptions } from './rate-limiter';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { RateLimiterOpts } from './types';

/**
 * Rate Limiter Types
 * Last Updated: 2025-01-17
 */

export interface RateLimiterOpts {
  points?: number;
  duration?: number;
  blockDuration?: number;
  keyPrefix?: string;
}

/**
 * Default rate limit configurations for different API endpoints
 */
export const defaultRateLimits = {
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,     // 60 requests per minute
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 requests per 15 minutes
  },
  public: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 120,     // 120 requests per minute
  }
} as const;

/**
 * Rate limit configurations for specific endpoints
 */
export const rateLimitConfigs: Record<string, RateLimitOptions> = {
  // Authentication endpoints
  'auth:login': {
    ...defaultRateLimits.auth,
    identifier: 'auth:login'
  },
  'auth:register': {
    ...defaultRateLimits.auth,
    identifier: 'auth:register'
  },
  'auth:reset-password': {
    ...defaultRateLimits.auth,
    identifier: 'auth:reset-password'
  },

  // Public API endpoints
  'api:public': {
    ...defaultRateLimits.public,
    identifier: 'api:public'
  },

  // Protected API endpoints
  'api:protected': {
    ...defaultRateLimits.api,
    identifier: 'api:protected'
  },

  // Admin API endpoints
  'api:admin': {
    ...defaultRateLimits.api,
    maxRequests: 30, // Lower limit for admin endpoints
    identifier: 'api:admin'
  }
} as const; 

/**
 * Rate Limiter Configuration
 * Last Updated: 2025-01-17
 */

export const createRateLimiter = (options: RateLimiterOpts) => {
  const { points = 10, duration = 1, blockDuration = 60 } = options;
  
  return new RateLimiterMemory({
    points,
    duration,
    blockDuration,
  });
}; 