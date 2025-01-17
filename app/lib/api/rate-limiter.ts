/**
 * API Rate Limiter
 * Last Updated: 2025-01-17
 * 
 * Simple in-memory rate limiting implementation for API routes.
 * Uses a sliding window algorithm to track request counts.
 */

import { NextRequest } from 'next/server';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  identifier?: string;
  keyGenerator?: (req: NextRequest) => string;
}

export interface RateLimitState {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RequestWindow {
  timestamps: number[];
  reset: number;
}

export class RateLimiter {
  private windows: Map<string, RequestWindow>;
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
    this.windows = new Map();
  }

  /**
   * Clean up expired timestamps from a window
   */
  private cleanWindow(window: RequestWindow, now: number): void {
    const windowStart = now - this.options.windowMs;
    window.timestamps = window.timestamps.filter(timestamp => timestamp > windowStart);
    window.reset = window.timestamps.length > 0 
      ? Math.min(...window.timestamps) + this.options.windowMs
      : now + this.options.windowMs;
  }

  /**
   * Check if a request is allowed based on rate limiting rules
   */
  async check(key: string): Promise<RateLimitState> {
    const now = Date.now();
    let window = this.windows.get(key);

    if (!window) {
      window = { timestamps: [], reset: now + this.options.windowMs };
      this.windows.set(key, window);
    }

    this.cleanWindow(window, now);

    if (window.timestamps.length >= this.options.maxRequests) {
      return {
        success: false,
        limit: this.options.maxRequests,
        remaining: 0,
        reset: window.reset
      };
    }

    window.timestamps.push(now);
    window.reset = now + this.options.windowMs;

    return {
      success: true,
      limit: this.options.maxRequests,
      remaining: this.options.maxRequests - window.timestamps.length,
      reset: window.reset
    };
  }

  /**
   * Get current rate limit state for a key
   */
  async getState(key: string): Promise<Omit<RateLimitState, 'success'>> {
    const now = Date.now();
    let window = this.windows.get(key);

    if (!window) {
      return {
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests,
        reset: now + this.options.windowMs
      };
    }

    this.cleanWindow(window, now);

    return {
      limit: this.options.maxRequests,
      remaining: Math.max(0, this.options.maxRequests - window.timestamps.length),
      reset: window.reset
    };
  }

  /**
   * Clean up all expired windows
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    Array.from(this.windows.keys()).forEach(key => {
      const window = this.windows.get(key);
      if (window && Math.max(...window.timestamps) < windowStart) {
        this.windows.delete(key);
      }
    });
  }
} 