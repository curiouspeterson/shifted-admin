/**
 * API Cache Utility
 * Last Updated: 2024-03
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

/**
 * Default cache configurations
 */
export const defaultCacheConfig: CacheConfig = {
  ttl: 300, // 5 minutes
  prefix: 'api:cache',
  includeQuery: true,
  excludeParams: ['_t', 'token'],
  cacheControl: 'public, max-age=300',
  staleWhileRevalidate: true,
};

/**
 * Cache key generation options
 */
interface CacheKeyOptions {
  method: string;
  path: string;
  query?: URLSearchParams;
  prefix?: string;
  includeQuery?: boolean;
  excludeParams?: string[];
}

/**
 * Generate a cache key from request
 */
export function generateCacheKey({
  method,
  path,
  query,
  prefix = defaultCacheConfig.prefix,
  includeQuery = defaultCacheConfig.includeQuery,
  excludeParams = defaultCacheConfig.excludeParams,
}: CacheKeyOptions): string {
  const parts = [prefix, method, path];

  if (includeQuery && query) {
    const params = new URLSearchParams(query);
    excludeParams?.forEach(param => params.delete(param));
    if (params.toString()) {
      parts.push(params.toString());
    }
  }

  return parts.join(':');
}

/**
 * Cache wrapper for API responses
 */
export class ApiCache {
  constructor(private config: CacheConfig = defaultCacheConfig) {}

  /**
   * Get cached response
   */
  async get(req: NextRequest): Promise<ApiResponse | null> {
    const key = generateCacheKey({
      method: req.method,
      path: req.nextUrl.pathname,
      query: req.nextUrl.searchParams,
      prefix: this.config.prefix,
      includeQuery: this.config.includeQuery,
      excludeParams: this.config.excludeParams,
    });

    const cached = await redis.get<ApiResponse>(key);
    return cached;
  }

  /**
   * Set response in cache
   */
  async set(req: NextRequest, response: ApiResponse): Promise<void> {
    const key = generateCacheKey({
      method: req.method,
      path: req.nextUrl.pathname,
      query: req.nextUrl.searchParams,
      prefix: this.config.prefix,
      includeQuery: this.config.includeQuery,
      excludeParams: this.config.excludeParams,
    });

    await redis.set(key, response, {
      ex: this.config.ttl,
    });
  }

  /**
   * Invalidate cache entries by pattern
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
      headers.append(
        'Cache-Control',
        `stale-while-revalidate=${Math.floor(this.config.ttl / 2)}`
      );
    }

    return headers;
  }
}

/**
 * Create a cache instance with the given configuration
 */
export function createCache(config?: Partial<CacheConfig>) {
  return new ApiCache({
    ...defaultCacheConfig,
    ...config,
  });
}

/**
 * Predefined cache configurations for different use cases
 */
export const cacheConfigs = {
  // Short-lived cache for frequently updated data (1 minute)
  short: {
    ttl: 60,
    cacheControl: 'public, max-age=60',
    staleWhileRevalidate: true,
  },

  // Medium-lived cache for semi-static data (5 minutes)
  medium: {
    ttl: 300,
    cacheControl: 'public, max-age=300',
    staleWhileRevalidate: true,
  },

  // Long-lived cache for static data (1 hour)
  long: {
    ttl: 3600,
    cacheControl: 'public, max-age=3600',
    staleWhileRevalidate: true,
  },

  // Cache for authenticated responses (private, 5 minutes)
  private: {
    ttl: 300,
    cacheControl: 'private, max-age=300',
    staleWhileRevalidate: true,
  },
} as const; 