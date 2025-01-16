/**
 * API Cache Configuration
 * Last Updated: 2024-01-16
 * 
 * This module provides caching utilities for API responses
 * using Postgres as the cache backend.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Default cache configuration
export const defaultCacheConfig = {
  ttl: 60, // 1 minute
  tags: ['api'],
  staleWhileRevalidate: 30, // 30 seconds
}

interface CacheConfig {
  ttl?: number
  tags?: string[]
  staleWhileRevalidate?: number
}

/**
 * Creates a cache instance with the specified configuration
 */
export function createCache(config: CacheConfig = {}) {
  const {
    ttl = defaultCacheConfig.ttl,
    tags = defaultCacheConfig.tags,
    staleWhileRevalidate = defaultCacheConfig.staleWhileRevalidate,
  } = config

  // Create cache key from request
  function createKey(req: NextRequest): string {
    const url = new URL(req.url)
    return `${url.pathname}${url.search}`
  }

  return {
    /**
     * Gets a cached response
     */
    async get(req: NextRequest) {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const key = createKey(req)
      const now = new Date()

      const { data, error } = await supabase
        .from('cache_entries')
        .select('value, created_at')
        .eq('key', key)
        .single()

      if (error || !data) return null

      const age = Math.floor((now.getTime() - new Date(data.created_at).getTime()) / 1000)
      const isStale = age > ttl

      // Return stale data if within stale-while-revalidate window
      if (isStale && age > ttl + staleWhileRevalidate) {
        return null
      }

      return {
        data: JSON.parse(data.value),
        isStale
      }
    },

    /**
     * Sets a cached response
     */
    async set(req: NextRequest, value: any) {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const key = createKey(req)
      const now = new Date().toISOString()

      // Store the cache entry
      await supabase
        .from('cache_entries')
        .upsert({
          key,
          value: JSON.stringify(value),
          created_at: now,
          tags: tags
        }, {
          onConflict: 'key'
        })

      // Clean up old entries
      await supabase.rpc('cleanup_cache_entries')
    },

    /**
     * Invalidates cache by tags
     */
    async invalidate(invalidateTags: string[]) {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      
      await supabase
        .from('cache_entries')
        .delete()
        .overlaps('tags', invalidateTags)
    },

    /**
     * Gets cache control headers
     */
    getCacheControlHeaders() {
      const headers = new Headers()
      headers.set(
        'Cache-Control',
        `s-maxage=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`
      )
      return headers
    }
  }
} 