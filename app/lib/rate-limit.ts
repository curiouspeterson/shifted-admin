/**
 * Rate Limiting Utility
 * Last Updated: 2024-03
 * 
 * Implements rate limiting using Supabase Redis FDW.
 * Features:
 * - Supabase Redis integration
 * - Auth-specific rate limits
 * - Performance monitoring
 * - Connection pooling
 */

import { createClient } from '@supabase/supabase-js';
import { errorLogger } from '@/lib/logging/error-logger';

interface RateLimitConfig {
  windowSize: number;  // in seconds
  maxRequests: number;
  burstSize?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  analytics?: {
    routeType: string;
    timestamp: number;
    identifier: string;
    performance?: {
      latency: number;
      cacheHit: boolean;
    };
  };
}

// Rate limit configurations aligned with Supabase's defaults
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints
  'auth:email': { windowSize: 3600, maxRequests: 2 },  // 2 emails per hour
  'auth:otp': { windowSize: 3600, maxRequests: 30 },   // 30 OTPs per hour
  'auth:verify': { windowSize: 3600, maxRequests: 360, burstSize: 30 }, // 360/hr with bursts
  'auth:token': { windowSize: 3600, maxRequests: 1800, burstSize: 30 }, // 1800/hr with bursts
  'auth:mfa': { windowSize: 3600, maxRequests: 15, burstSize: 5 },     // 15/hr with bursts
  
  // API endpoints
  'api': { windowSize: 60, maxRequests: 1000, burstSize: 50 },  // 1000/minute with bursts
  
  // Default for other routes
  'default': { windowSize: 60, maxRequests: 2000, burstSize: 100 }, // 2000/minute with bursts
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Rate limit implementation using Supabase Redis
 */
export async function rateLimit(
  identifier: string,
  routeType: keyof typeof RATE_LIMITS = 'default'
): Promise<RateLimitResult> {
  const startTime = performance.now();
  
  try {
    const config = RATE_LIMITS[routeType] || RATE_LIMITS.default;
    const { windowSize, maxRequests, burstSize = maxRequests } = config;
    
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${identifier}:${Math.floor(now / windowSize)}`;
    
    // Use Supabase's Redis FDW for atomic operations
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      key: windowKey,
      max_requests: maxRequests,
      burst_size: burstSize,
      window_size: windowSize
    });
    
    if (error) throw error;
    
    const { count, expires_at } = data;
    const remaining = Math.max(0, maxRequests - count);
    
    // Calculate performance metrics
    const latency = performance.now() - startTime;
    
    // Track analytics
    const analytics = {
      routeType,
      timestamp: now,
      identifier,
      performance: {
        latency,
        cacheHit: latency < 10, // Consider it a cache hit if latency is under 10ms
      },
    };
    
    // Log performance metrics if they exceed thresholds
    if (latency > 100) {
      errorLogger.warn('High rate limit latency', {
        latency,
        routeType,
        identifier,
      });
    }
    
    return {
      success: count <= maxRequests,
      limit: maxRequests,
      remaining,
      reset: expires_at,
      analytics,
    };
  } catch (error) {
    errorLogger.error('Rate limit error:', { error, identifier, routeType });
    // Fail open - allow request in case of rate limit errors
    return {
      success: true,
      limit: RATE_LIMITS.default.maxRequests,
      remaining: 1,
      reset: Math.floor(Date.now() / 1000) + RATE_LIMITS.default.windowSize,
    };
  }
} 