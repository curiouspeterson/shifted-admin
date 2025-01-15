/**
 * API Cache Utility
 * Last Updated: 2025-01-15
 * 
 * This module provides caching functionality for API responses
 * using Redis as the cache store.
 */

import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { ApiResponse } from './types';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Default cache configuration
 */
const defaultConfig: CacheConfig = {
  ttl: 60 * 60, // 1 hour
  prefix: 'api:',
  includeQuery: true,
  excludeParams: ['_t', 'timestamp'],
  cacheControl: 'public, max-age=3600',
  staleWhileRevalidate: true,
};

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Time-to-live in seconds
   */
  ttl: number;

  /**
   * Cache key prefix
   */
  prefix?: string;

  /**
   * Whether to include query parameters in cache key
   */
  includeQuery?: boolean;

  /**
   * Query parameters to exclude from cache key
   */
  excludeParams?: string[];

  /**
   * Cache-Control header value
   */
  cacheControl?: string;

  /**
   * Whether to use stale-while-revalidate
   */
  staleWhileRevalidate?: boolean;
}

interface CacheKeyOptions {
  method: string;
  path: string;
  query?: URLSearchParams;
  prefix?: string;
  includeQuery?: boolean;
  excludeParams?: string[];
}

/**
 * Generate a cache key from request parameters
 */
function generateCacheKey({
  method,
  path,
  query,
  prefix = defaultConfig.prefix,
  includeQuery = defaultConfig.includeQuery,
  excludeParams = defaultConfig.excludeParams ?? [],
}: CacheKeyOptions): string {
  const parts = [prefix, method, path];

  if (includeQuery && query) {
    const filteredParams = new URLSearchParams();
    query.forEach((value, key) => {
      if (!excludeParams.includes(key)) {
        filteredParams.append(key, value);
      }
    });
    if (filteredParams.toString()) {
      parts.push(filteredParams.toString());
    }
  }

  return parts.join(':');
}

class CacheService {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get a cached response
   */
  async get(req: NextRequest): Promise<ApiResponse | null> {
    const url = new URL(req.url);
    const key = generateCacheKey({
      method: req.method,
      path: url.pathname,
      query: url.searchParams,
      prefix: this.config.prefix,
      includeQuery: this.config.includeQuery,
      excludeParams: this.config.excludeParams,
    });

    const cached = await redis.get<ApiResponse>(key);
    return cached;
  }

  /**
   * Cache a response
   */
  async set(req: NextRequest, response: ApiResponse): Promise<void> {
    const url = new URL(req.url);
    const key = generateCacheKey({
      method: req.method,
      path: url.pathname,
      query: url.searchParams,
      prefix: this.config.prefix,
      includeQuery: this.config.includeQuery,
      excludeParams: this.config.excludeParams,
    });

    await redis.set(key, response, {
      ex: this.config.ttl,
    });
  }

  /**
   * Invalidate cached responses matching a pattern
   */
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(`${this.config.prefix}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Get cache control headers
   */
  getCacheControlHeaders(): Headers {
    const headers = new Headers();
    
    if (this.config.cacheControl) {
      headers.set('Cache-Control', this.config.cacheControl);
    }

    if (this.config.staleWhileRevalidate) {
      const value = headers.get('Cache-Control') || '';
      headers.set(
        'Cache-Control',
        value ? `${value}, stale-while-revalidate=60` : 'stale-while-revalidate=60'
      );
    }

    return headers;
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 