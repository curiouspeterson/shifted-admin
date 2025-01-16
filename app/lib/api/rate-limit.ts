/**
 * API Rate Limiting Configuration
 * Last Updated: 2024-01-16
 * 
 * Provides rate limiting configuration for API routes.
 * Uses the core rate limiting functionality from @/lib/rate-limit.
 */

import { rateLimit, type RateLimitResult } from '@/lib/rate-limit'

interface RateLimitConfig {
  limit: number
  window: number // in seconds
}

// Default rate limits for API routes
export const defaultRateLimits: Record<string, RateLimitConfig> = {
  auth: { limit: 5, window: 60 }, // 5 requests per minute
  api: { limit: 100, window: 60 }, // 100 requests per minute
  protected: { limit: 1000, window: 60 }, // 1000 requests per minute
  public: { limit: 500, window: 60 }, // 500 requests per minute
}

// Re-export the core rate limiting functionality
export { rateLimit, type RateLimitResult } 