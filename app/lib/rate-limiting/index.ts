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

export interface RateLimitOptions {
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
  private options: RateLimitOptions
  private store: Map<string, RateLimitRecord>
  private isDevelopment: boolean

  constructor(options: RateLimitOptions) {
    this.options = {
      points: options.points || 100,
      duration: options.duration || 60,
      blockDuration: options.blockDuration || 300,
      keyPrefix: options.keyPrefix || 'rate-limit'
    }
    this.store = new Map()
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private getKey(identifier: string): string {
    return `${this.options.keyPrefix}:${identifier}`
  }

  private getRecord(key: string): RateLimitRecord {
    const now = Date.now()
    let record = this.store.get(key)

    if (!record) {
      record = {
        points: this.options.points,
        lastReset: now,
        blockedUntil: null
      }
      this.store.set(key, record)
    }

    // Reset points if duration has passed
    const timeSinceLastReset = now - record.lastReset
    if (timeSinceLastReset >= this.options.duration * 1000) {
      record.points = this.options.points
      record.lastReset = now
      record.blockedUntil = null
    }

    return record
  }

  async isRateLimited(identifier: string): Promise<boolean> {
    const result = await this.check(identifier)
    return !result.success
  }

  async check(identifier: string): Promise<RateLimitResult> {
    if (this.isDevelopment) {
      return this.checkMemoryLimit(identifier)
    }
    return this.checkDistributedLimit(identifier)
  }

  private async checkMemoryLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier)
    const record = this.getRecord(key)
    const now = Date.now()

    // Check if currently blocked
    if (record.blockedUntil !== null && now < record.blockedUntil) {
      return {
        success: false,
        limit: this.options.points,
        remaining: 0,
        reset: Math.ceil((record.blockedUntil - now) / 1000)
      }
    }

    // Decrement points
    record.points--

    // Block if out of points
    if (record.points <= 0) {
      record.blockedUntil = now + (this.options.blockDuration * 1000)
      return {
        success: false,
        limit: this.options.points,
        remaining: 0,
        reset: this.options.blockDuration
      }
    }

    return {
      success: true,
      limit: this.options.points,
      remaining: record.points,
      reset: Math.ceil((record.lastReset + (this.options.duration * 1000) - now) / 1000)
    }
  }

  private async checkDistributedLimit(identifier: string): Promise<RateLimitResult> {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const key = this.getKey(identifier)
    const now = Math.floor(Date.now() / 1000)

    const { data, error } = await supabase
      .from('rate_limits')
      .select('points, last_reset, blocked_until')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Rate limit check failed: ${error.message}`)
    }

    let record = data || {
      points: this.options.points,
      last_reset: now,
      blocked_until: null
    }

    // Reset points if duration has passed
    const timeSinceLastReset = now - record.last_reset
    if (timeSinceLastReset >= this.options.duration) {
      record = {
        points: this.options.points,
        last_reset: now,
        blocked_until: null
      }
    }

    // Check if currently blocked
    if (record.blocked_until !== null && now < record.blocked_until) {
      return {
        success: false,
        limit: this.options.points,
        remaining: 0,
        reset: record.blocked_until - now
      }
    }

    // Decrement points
    record.points--

    // Block if out of points
    if (record.points <= 0) {
      record.blocked_until = now + this.options.blockDuration
    }

    // Update record
    await supabase
      .from('rate_limits')
      .upsert({
        key,
        ...record,
        updated_at: new Date().toISOString()
      })

    if (record.points <= 0) {
      return {
        success: false,
        limit: this.options.points,
        remaining: 0,
        reset: this.options.blockDuration
      }
    }

    return {
      success: true,
      limit: this.options.points,
      remaining: record.points,
      reset: Math.ceil(record.last_reset + this.options.duration - now)
    }
  }
} 