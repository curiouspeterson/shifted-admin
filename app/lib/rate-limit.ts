/**
 * Rate Limiting Utility
 * Last Updated: 2024-03
 * 
 * Implements a token bucket algorithm for rate limiting.
 * Uses an in-memory store with Redis-like interface for development,
 * can be replaced with actual Redis in production.
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
}

// In-memory store implementation
class MemoryStore implements RateLimitStore {
  private store: Map<string, { value: string; expires: number }>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }
}

// Configuration
const WINDOW_SIZE = 60; // 1 minute
const MAX_REQUESTS = 100; // requests per window
const store: RateLimitStore = new MemoryStore();

/**
 * Rate limit implementation using token bucket algorithm
 */
export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  
  // Get current bucket
  const bucket = await store.get(key);
  const currentBucket = bucket ? JSON.parse(bucket) : { tokens: MAX_REQUESTS, reset: now + WINDOW_SIZE };
  
  // Reset bucket if window has passed
  if (now > currentBucket.reset) {
    currentBucket.tokens = MAX_REQUESTS;
    currentBucket.reset = now + WINDOW_SIZE;
  }

  // Check if we have tokens
  const success = currentBucket.tokens > 0;
  if (success) {
    currentBucket.tokens--;
  }

  // Save bucket
  await store.set(key, JSON.stringify(currentBucket), WINDOW_SIZE);

  return {
    success,
    limit: MAX_REQUESTS,
    remaining: currentBucket.tokens,
    reset: currentBucket.reset,
  };
} 