/**
 * Rate Limiter
 * Last Updated: 2025-01-15
 * 
 * This module provides rate limiting functionality for API endpoints.
 */

import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  private createKey(req: NextRequest): string {
    // Create a key based on IP address and route
    const ip = req.ip || 'unknown';
    const url = new URL(req.url);
    return `ratelimit:${ip}:${url.pathname}`;
  }

  async check(req: NextRequest, limit: number, window: number): Promise<boolean> {
    const key = this.createKey(req);
    const now = Date.now();
    const windowStart = now - (window * 1000);

    // Add the current request timestamp and remove old entries
    const multi = this.redis.multi();
    multi.zadd(key, { score: now, member: now.toString() });
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zcard(key);
    multi.expire(key, window);

    const [,, count] = await multi.exec();
    
    return (count as number) > limit;
  }

  async reset(req: NextRequest): Promise<void> {
    const key = this.createKey(req);
    await this.redis.del(key);
  }
}

export const rateLimiter = new RateLimiter(); 