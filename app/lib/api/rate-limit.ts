/**
 * Rate Limiting Configuration
 * Last Updated: 2024-01-16
 * 
 * This module provides rate limiting configuration and utilities
 * for API endpoints using Postgres as the storage backend.
 */

import { createClient } from '@/lib/supabase/server'
import { RateLimitError } from '../errors'
import { cookies } from 'next/headers'

// Default rate limit configurations
export const defaultRateLimits = {
  api: {
    limit: 100, // requests
    window: 60, // seconds
    identifier: 'api:default',
  },
  auth: {
    limit: 5, // requests
    window: 60, // seconds
    identifier: 'auth:default',
  }
}

interface RateLimitConfig {
  limit: number
  window: number
  identifier: string
}

interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

/**
 * Creates a rate limiter with the specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { limit, window: windowSeconds, identifier } = config

  return {
    /**
     * Checks if the request is within rate limits using Postgres
     */
    async check(ip: string): Promise<RateLimitInfo> {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const now = Math.floor(Date.now() / 1000)
      const windowStart = now - windowSeconds

      // Use a transaction to ensure atomic operations
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_ip: ip,
        p_identifier: identifier,
        p_window_start: new Date(windowStart * 1000).toISOString(),
        p_window: windowSeconds,
        p_limit: limit
      })

      if (error) {
        console.error('Rate limit check failed:', error)
        // If rate limiting fails, allow the request but log the error
        return {
          limit,
          remaining: limit,
          reset: now + windowSeconds
        }
      }

      const { count, is_limited } = data

      if (is_limited) {
        throw new RateLimitError()
      }

      return {
        limit,
        remaining: Math.max(0, limit - count),
        reset: now + windowSeconds
      }
    }
  }
} 