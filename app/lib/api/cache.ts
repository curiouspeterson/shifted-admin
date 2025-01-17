/**
 * API Cache Configuration
 * Last Updated: 2025-01-17
 * 
 * Cache configuration and utilities for API routes.
 */

/**
 * Cache control options for API responses
 */
export enum CacheControl {
  NoCache = 'no-cache, no-store, must-revalidate',
  Public = 'public, max-age=31536000, immutable',
  Private = 'private, no-cache, no-store, must-revalidate',
  ShortTerm = 'public, max-age=60, must-revalidate',
  LongTerm = 'public, max-age=31536000, immutable'
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  control: CacheControl;
  revalidate?: number;
  tags?: string[];
  prefix?: string;
  includeQuery?: boolean;
  excludeParams?: readonly string[];
}

/**
 * Default cache configurations for different API endpoints
 */
export const cacheConfigs = {
  api: {
    control: CacheControl.ShortTerm,
    revalidate: 60,
    prefix: 'api',
    includeQuery: false,
    excludeParams: ['page', 'limit', 'offset'] as const
  },
  static: {
    control: CacheControl.Public,
    revalidate: 31536000,
    prefix: 'static',
    includeQuery: false
  },
  dynamic: {
    control: CacheControl.Private,
    prefix: 'dynamic',
    includeQuery: true
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
export async function invalidateCache(tags: readonly string[]): Promise<void> {
  // TODO: Implement cache invalidation
  console.log('Cache invalidation not implemented', { tags });
} 