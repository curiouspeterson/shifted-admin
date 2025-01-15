/**
 * Cache Service
 * Last Updated: 2025-01-15
 * 
 * This service handles caching of API responses using Redis.
 */

import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import type { ApiResponse } from '../types';

export interface CacheHeaders {
  'Cache-Control': string;
  'X-Cache'?: string;
  'X-Cache-Hit'?: string;
  'X-Cache-TTL'?: string;
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class CacheService {
  constructor(private readonly redis: Redis) {}

  async get(req: NextRequest): Promise<ApiResponse | null> {
    const key = this.createKey(req);
    const data = await this.redis.get(key);
    return data ? (data as ApiResponse) : null;
  }

  async set(req: NextRequest, response: ApiResponse): Promise<void> {
    const key = this.createKey(req);
    await this.redis.set(key, response, {
      ex: 60, // 60 seconds default TTL
    });
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    // Get all keys for the given tags
    const keysByTag = await Promise.all(
      tags.map(tag => this.redis.smembers(`tag:${tag}`))
    );

    // Flatten and deduplicate keys
    const keys = Array.from(new Set(keysByTag.flat()));

    if (keys.length > 0) {
      // Delete all keys and tag sets
      await Promise.all([
        ...keys.map(key => this.redis.del(key)),
        ...tags.map(tag => this.redis.del(`tag:${tag}`))
      ]);
    }
  }

  getCacheHeaders(req: NextRequest): CacheHeaders {
    return {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      'X-Cache': 'MISS',
    };
  }

  private createKey(req: NextRequest): string {
    const url = new URL(req.url);
    return `api:${url.pathname}${url.search}`;
  }

  private async addToTagSets(key: string, tags: string[]): Promise<void> {
    await Promise.all(
      tags.map(tag => this.redis.sadd(`tag:${tag}`, key))
    );
  }
}

// Export singleton instance
export const cacheService = new CacheService(redis); 