/**
 * Rate Limiter
 * Last Updated: 2025-01-17
 * 
 * Implements a simple in-memory rate limiter using the token bucket algorithm.
 */

interface RateLimiterOptions {
  points: number
  duration: number
  blockDuration: number
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

  constructor(options: RateLimiterOptions) {
    this.options = options
    this.store = new Map()
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

  async isRateLimited(identifier: string): Promise<boolean> {
    if (!identifier || identifier === 'unknown') {
      return false // Don't rate limit if we can't identify the client
    }

    const key = this.getKey(identifier)
    const record = this.getRecord(key)
    const now = Date.now()

    // Check if currently blocked
    if (record.blockedUntil !== null && now < record.blockedUntil) {
      return true
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
      return true
    }

    // Consume a point
    record.points--
    this.store.set(key, record)
    return false
  }
} 