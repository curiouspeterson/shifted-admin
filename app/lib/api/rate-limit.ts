/**
 * Rate Limiting Utilities
 * Last Updated: 2024-03-21
 * 
 * Rate limiting implementation using Supabase for distributed rate limiting.
 * Supports different limits for various API endpoints and authentication.
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface RateLimitConfig {
  window: number;  // Time window in seconds
  max: number;     // Maximum requests in window
}

export const defaultRateLimits = {
  api: {
    window: 60,    // 1 minute
    max: 100       // 100 requests per minute
  },
  auth: {
    window: 300,   // 5 minutes
    max: 10        // 10 requests per 5 minutes
  }
} as const;

/**
 * Creates a rate limiter with the specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function checkRateLimit(identifier: string): Promise<boolean> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.window;
    
    try {
      // Clean up old entries and get current count
      const { data, error } = await supabase
        .from('rate_limits')
        .select('count')
        .eq('identifier', identifier)
        .gte('timestamp', new Date(windowStart * 1000).toISOString())
        .limit(1)
        .single();
      
      if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Default to allowing the request if the check fails
      }
      
      return (data?.count || 0) < config.max;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Default to allowing the request if the check fails
    }
  };
}

/**
 * Gets rate limit metrics for monitoring
 */
export async function getRateLimitMetrics(identifier: string): Promise<{
  remaining: number;
  reset: number;
} | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const now = Math.floor(Date.now() / 1000);
  
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('timestamp')
      .eq('identifier', identifier)
      .gte('timestamp', now - defaultRateLimits.api.window)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Failed to get rate limit metrics:', error);
      return null;
    }
    
    const used = data?.length || 0;
    const remaining = defaultRateLimits.api.max - used;
    const oldestTimestamp = data?.[0]?.timestamp || now;
    const reset = oldestTimestamp + defaultRateLimits.api.window;
    
    return {
      remaining: Math.max(0, remaining),
      reset
    };
  } catch (error) {
    console.error('Failed to get rate limit metrics:', error);
    return null;
  }
} 