/**
 * Rate Limiting System
 * Last Updated: 2025-01-17
 * 
 * Unified rate limiting system that supports both in-memory (development) 
 * and distributed (production) rate limiting.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export interface RateLimiterOptions {
  points: number
  duration: number // in seconds
  blockDuration: number // in seconds
  keyPrefix: string
}

interface RateLimitRecord {
  points: number
  lastReset: number
  blockedUntil: number | null
}

export class RateLimiter {
  private options: RateLimiterOptions
  private store: Map<string, RateLimitRecord>
  private isDevelopment: boolean

  constructor(options: RateLimiterOptions) {
    this.options = options
    this.store = new Map()
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private getKey(identifier: string): string {
    return `${this.options.keyPrefix}:${identifier}`
  }

  private getRecord(key: string): RateLimitRecord {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record) {
      return {
        points: this.options.points,
        lastReset: now,
        blockedUntil: null
      }
    }

    // Check if we should reset points
    const timeSinceReset = now - record.lastReset
    if (timeSinceReset >= this.options.duration * 1000) {
      return {
        points: this.options.points,
        lastReset: now,
        blockedUntil: null
      }
    }

    return record
  }

  private async checkMemoryLimit(identifier: string): Promise<RateLimitResult> {
    if (!identifier || identifier === 'unknown') {
      return {
        success: true,
        limit: this.options.points,
        remaining: this.options.points,
        reset: Math.floor(Date.now() / 1000) + this.options.duration
      }
    }

    const key = this.getKey(identifier)
    const record = this.getRecord(key)
    const now = Date.now()

    // Check if currently blocked
    if (record.blockedUntil !== null && now < record.blockedUntil) {
      return {
        success: false,
        limit: this.options.points,
        remaining: 0,
        reset: Math.floor(record.blockedUntil / 1000)
      }
    }

    // Reset block if duration has passed
    if (record.blockedUntil !== null && now >= record.blockedUntil) {
      record.blockedUntil = null
      record.points = this.options.points
    }

    // Check if out of points
    if (record.points <= 0) {
      record.blockedUntil = now + (this.options.blockDuration * 1000)
      this.store.set(key, record)
      return {
        success: false,
        limit: this.options.points,
        remaining: 0,
        reset: Math.floor(record.blockedUntil / 1000)
      }
    }

    // Consume a point
    record.points--
    this.store.set(key, record)
    
    return {
      success: true,
      limit: this.options.points,
      remaining: record.points,
      reset: Math.floor((record.lastReset + this.options.duration * 1000) / 1000)
    }
  }

  private async checkDistributedLimit(identifier: string): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000)
    
    if (!identifier || identifier === 'unknown') {
      return {
        success: true,
        limit: this.options.points,
        remaining: this.options.points,
        reset: now + this.options.duration
      }
    }

    const cookieStore = cookies()
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    if (typeof supabaseUrl !== 'string' || supabaseUrl === '' || 
        typeof supabaseKey !== 'string' || supabaseKey === '') {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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
        window_seconds: this.options.duration
      })

      // Get current count and check limit
      const { data: rateLimits, error: countError } = await supabase
        .from('rate_limits')
        .select('timestamp')
        .eq('ip', identifier)
        .eq('identifier', this.options.keyPrefix)
        .gte('timestamp', new Date(now - this.options.duration).toISOString())

      if (countError) {
        throw countError
      }

      const count = rateLimits?.length ?? 0
      
      if (count >= this.options.points) {
        const oldestRequest = rateLimits?.[0]?.timestamp
        const reset = typeof oldestRequest === 'string'
          ? Math.floor(new Date(oldestRequest).getTime() / 1000) + this.options.duration
          : now + this.options.duration

        return {
          success: false,
          limit: this.options.points,
          remaining: 0,
          reset,
          analytics: {
            total: count,
            window: this.options.duration
          }
        }
      }
      
      // Add new rate limit entry
      const timestamp = new Date(now * 1000).toISOString()
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          ip: identifier,
          identifier: this.options.keyPrefix,
          timestamp
        })

      if (insertError) {
        throw insertError
      }
      
      return {
        success: true,
        limit: this.options.points,
        remaining: Math.max(0, this.options.points - (count + 1)),
        reset: now + this.options.duration,
        analytics: {
          total: count + 1,
          window: this.options.duration
        }
      }
    } catch (error) {
      console.error('Rate limit check failed', { error, identifier })
      // Fail open if database is down
      return {
        success: true,
        limit: this.options.points,
        remaining: 1,
        reset: now + this.options.duration
      }
    }
  }

  async check(identifier: string): Promise<RateLimitResult> {
    return this.isDevelopment
      ? this.checkMemoryLimit(identifier)
      : this.checkDistributedLimit(identifier)
  }
} 