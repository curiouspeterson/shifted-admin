/**
 * Rate Limiting Core
 * Last Updated: 2024-01-16
 * 
 * Core rate limiting functionality for middleware and edge functions.
 * Uses Supabase Postgres for distributed rate limiting.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { errorLogger } from '@/lib/logging/error-logger'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  analytics?: {
    total: number
    window: number
  }
}

interface RateLimitConfig {
  limit: number
  window: number // in seconds
}

// Default rate limits
const defaultLimits: Record<string, RateLimitConfig> = {
  auth: { limit: 5, window: 60 }, // 5 requests per minute
  api: { limit: 100, window: 60 }, // 100 requests per minute
  protected: { limit: 1000, window: 60 }, // 1000 requests per minute
  public: { limit: 500, window: 60 }, // 500 requests per minute
}

/**
 * Check if a request should be rate limited
 */
export async function rateLimit(
  ip: string,
  routeType: keyof typeof defaultLimits
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const config = defaultLimits[routeType]
  const identifier = `${routeType}:${ip}`
  
  if (!config) {
    errorLogger.warn('Unknown route type for rate limiting', { routeType })
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: now
    }
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
  
  try {
    // Clean up old rate limit entries
    await supabase.rpc('cleanup_rate_limits', {
      window_seconds: config.window
    })

    // Get current count and check limit
    const { data: rateLimits, error: countError } = await supabase
      .from('rate_limits')
      .select('timestamp')
      .eq('ip', ip)
      .eq('identifier', identifier)
      .gte('timestamp', new Date(now - config.window).toISOString())

    if (countError) {
      throw countError
    }

    const count = rateLimits?.length ?? 0
    
    if (count >= config.limit) {
      const oldestRequest = rateLimits?.[0]?.timestamp
      const reset = oldestRequest 
        ? Math.floor(new Date(oldestRequest).getTime() / 1000) + config.window
        : now + config.window

      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset,
        analytics: {
          total: count,
          window: config.window
        }
      }
    }
    
    // Add new rate limit entry
    const timestamp = new Date(now * 1000).toISOString()
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        ip,
        identifier,
        timestamp
      })

    if (insertError) {
      throw insertError
    }
    
    return {
      success: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - (count + 1)),
      reset: now + config.window,
      analytics: {
        total: count + 1,
        window: config.window
      }
    }
  } catch (error) {
    errorLogger.error('Rate limit check failed', { error, ip, routeType })
    // Fail open if database is down
    return {
      success: true,
      limit: config.limit,
      remaining: 1,
      reset: now + config.window
    }
  }
} 