/**
 * Cache Configuration System
 * Last Updated: 2025-01-17
 * 
 * Defines cache strategies and configurations for different types of content.
 */

export const CacheControl = {
  NoCache: 'no-cache, no-store, must-revalidate',
  ShortTerm: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  MediumTerm: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=1800',
  LongTerm: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200'
} as const

export interface CacheConfig {
  control: string
  revalidate: number
  prefix: string
  includeQuery?: boolean
  excludeParams?: string[]
}

export const cacheConfigs = {
  api: {
    control: CacheControl.ShortTerm,
    revalidate: 60, // 1 minute
    prefix: 'api',
    includeQuery: false,
    excludeParams: ['page', 'limit', 'offset']
  },
  static: {
    control: CacheControl.LongTerm,
    revalidate: 86400, // 24 hours
    prefix: 'static',
    includeQuery: false
  },
  dynamic: {
    control: CacheControl.MediumTerm,
    revalidate: 3600, // 1 hour
    prefix: 'dynamic',
    includeQuery: true,
    excludeParams: ['_']
  }
} as const 