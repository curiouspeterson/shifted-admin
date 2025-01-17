/**
 * Cache Configuration
 * Last Updated: 2024-03-21
 * 
 * Cache configuration and utilities for API endpoints.
 * Implements caching strategies with TypeScript support.
 */

export interface CacheConfig {
  enabled: boolean;
  ttl: number;  // Time to live in seconds
  staleWhileRevalidate?: number;  // Time in seconds to serve stale content while revalidating
  tags?: string[];  // Cache tags for invalidation
}

export const cacheConfigs = {
  api: {
    enabled: true,
    ttl: 60,  // 1 minute
    staleWhileRevalidate: 30,  // 30 seconds
    tags: ['api']
  },
  schedules: {
    enabled: true,
    ttl: 300,  // 5 minutes
    staleWhileRevalidate: 60,  // 1 minute
    tags: ['schedules']
  },
  employees: {
    enabled: true,
    ttl: 600,  // 10 minutes
    staleWhileRevalidate: 120,  // 2 minutes
    tags: ['employees']
  },
  shifts: {
    enabled: true,
    ttl: 300,  // 5 minutes
    staleWhileRevalidate: 60,  // 1 minute
    tags: ['shifts']
  }
} as const;

/**
 * Generates cache key for a request
 */
export function generateCacheKey(request: Request): string {
  const url = new URL(request.url);
  const key = `${request.method}:${url.pathname}${url.search}`;
  return key.toLowerCase();
}

/**
 * Checks if a request is cacheable
 */
export function isCacheable(request: Request): boolean {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // Don't cache requests with authorization headers
  if (request.headers.has('authorization')) {
    return false;
  }

  return true;
}

/**
 * Gets cache config for a request
 */
export function getCacheConfig(request: Request): CacheConfig | null {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();

  if (path.includes('/api/schedules')) {
    return cacheConfigs.schedules;
  }

  if (path.includes('/api/employees')) {
    return cacheConfigs.employees;
  }

  if (path.includes('/api/shifts')) {
    return cacheConfigs.shifts;
  }

  // Default to API config
  return cacheConfigs.api;
}

/**
 * Invalidates cache for given tags
 */
export async function invalidateCache(tags: string[]): Promise<void> {
  // TODO: Implement cache invalidation
  console.log('Cache invalidation not implemented', { tags });
} 