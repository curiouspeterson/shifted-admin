/**
 * API Cache Configuration
 * Last Updated: 2025-01-15
 * 
 * This module provides configuration for API response caching.
 * It defines cache rules, TTLs, and invalidation patterns.
 */

import { Redis } from '@upstash/redis';

// Cache storage configuration
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache key prefixes for different resource types
export const CACHE_KEYS = {
  SCHEDULES: 'schedules',
  ASSIGNMENTS: 'assignments',
  EMPLOYEES: 'employees',
  SHIFTS: 'shifts',
  TIME_REQUIREMENTS: 'time-requirements',
} as const;

// Cache TTL configuration (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Cache configuration by route pattern
export interface CacheConfig {
  ttl: number;
  tags?: string[];
  revalidate?: boolean;
  staleWhileRevalidate?: number;
}

export const cacheConfigs: Record<string, CacheConfig> = {
  // Schedule endpoints
  '/api/schedules': {
    ttl: CACHE_TTL.SHORT,
    tags: [CACHE_KEYS.SCHEDULES],
    staleWhileRevalidate: CACHE_TTL.MEDIUM,
  },
  '/api/schedules/:id': {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_KEYS.SCHEDULES],
  },

  // Assignment endpoints
  '/api/assignments': {
    ttl: CACHE_TTL.SHORT,
    tags: [CACHE_KEYS.ASSIGNMENTS, CACHE_KEYS.SCHEDULES],
  },
  '/api/assignments/:id': {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_KEYS.ASSIGNMENTS],
  },

  // Employee endpoints
  '/api/employees': {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_KEYS.EMPLOYEES],
  },
  '/api/employees/:id': {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_KEYS.EMPLOYEES],
  },

  // Shift endpoints
  '/api/shifts': {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_KEYS.SHIFTS],
  },
  '/api/shifts/:id': {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_KEYS.SHIFTS],
  },

  // Time requirement endpoints
  '/api/time-requirements': {
    ttl: CACHE_TTL.LONG,
    tags: [CACHE_KEYS.TIME_REQUIREMENTS],
  },
  '/api/time-requirements/:id': {
    ttl: CACHE_TTL.LONG,
    tags: [CACHE_KEYS.TIME_REQUIREMENTS],
  },
};

/**
 * Generates a cache key for a request
 */
export function generateCacheKey(
  path: string,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
): string {
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const sortedQuery = Object.entries(query).sort(([a], [b]) => a.localeCompare(b));

  return [
    normalizedPath,
    sortedParams.map(([k, v]) => `${k}=${v}`).join('&'),
    sortedQuery.map(([k, v]) => `${k}=${v}`).join('&'),
  ]
    .filter(Boolean)
    .join(':');
}

/**
 * Gets cache configuration for a route
 */
export function getCacheConfig(path: string): CacheConfig | undefined {
  // Remove trailing slash for consistency
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  // First try exact match
  if (cacheConfigs[normalizedPath]) {
    return cacheConfigs[normalizedPath];
  }

  // Then try pattern match
  const patterns = Object.keys(cacheConfigs);
  for (const pattern of patterns) {
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '/?$'
    );
    if (regex.test(normalizedPath)) {
      return cacheConfigs[pattern];
    }
  }

  return undefined;
}

/**
 * Generates cache control header value
 */
export function generateCacheControl(config: CacheConfig): string {
  const directives: string[] = ['public'];

  if (config.ttl) {
    directives.push(`max-age=${config.ttl}`);
  }

  if (config.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  if (config.revalidate) {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
} 