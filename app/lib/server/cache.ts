/**
 * Server-Side Cache Utilities
 * Last Updated: 2025-01-16
 * 
 * Implements Next.js 14 caching best practices with Supabase integration.
 * Provides utilities for data caching, revalidation, and cache management.
 */

import { unstable_cache } from 'next/cache'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database/database.types'

/**
 * Cache configuration
 */
interface CacheConfig {
  defaultRevalidate: number
  longRevalidate: number
  maxAge: number
  staleWhileRevalidate: number
}

const CACHE_CONFIG: CacheConfig = {
  defaultRevalidate: 60, // 1 minute
  longRevalidate: 3600, // 1 hour
  maxAge: 86400, // 24 hours
  staleWhileRevalidate: 300, // 5 minutes
}

/**
 * Cache tag types
 */
type CacheTag = 
  | `table:${keyof Database['public']['Tables']}`
  | `user:${string}`
  | `team:${string}`
  | 'global'

/**
 * Create cache key from parts
 */
function createCacheKey(...parts: string[]): string {
  return parts.join(':')
}

/**
 * Cache data with tags
 */
export async function cacheData<T>(
  key: string,
  fn: () => Promise<T>,
  tags: CacheTag[],
  revalidate: number = CACHE_CONFIG.defaultRevalidate
): Promise<T> {
  return unstable_cache(
    fn,
    [key],
    {
      tags,
      revalidate,
    }
  )()
}

/**
 * Cache table data with proper tags
 */
export async function cacheTableData<T extends keyof Database['public']['Tables']>(
  table: T,
  fn: () => Promise<Database['public']['Tables'][T]['Row'][]>,
  additionalTags: CacheTag[] = []
): Promise<Database['public']['Tables'][T]['Row'][]> {
  return cacheData(
    createCacheKey('table', table),
    fn,
    [`table:${table}`, ...additionalTags]
  )
}

/**
 * Revalidate table data
 */
export async function revalidateTable(
  table: keyof Database['public']['Tables']
): Promise<void> {
  // Revalidate all pages that might show this table's data
  revalidatePath('/dashboard', 'page')
  revalidatePath(`/${table}`, 'page')
}

/**
 * Revalidate user data
 */
export async function revalidateUser(userId: string): Promise<void> {
  // Revalidate all pages that might show user data
  revalidatePath('/dashboard', 'page')
  revalidatePath('/profile', 'page')
  revalidatePath(`/users/${userId}`, 'page')
}

/**
 * Revalidate team data
 */
export async function revalidateTeam(teamId: string): Promise<void> {
  // Revalidate all pages that might show team data
  revalidatePath('/dashboard', 'page')
  revalidatePath('/teams', 'page')
  revalidatePath(`/teams/${teamId}`, 'page')
}

/**
 * Cache helpers for common queries
 */
export const cacheHelpers = {
  /**
   * Cache user data
   */
  async user(userId: string) {
    const supabase = createClient()
    return cacheData(
      createCacheKey('user', userId),
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) throw error
        return data
      },
      [`user:${userId}`],
      CACHE_CONFIG.longRevalidate
    )
  },

  /**
   * Cache team data
   */
  async team(teamId: string) {
    const supabase = createClient()
    return cacheData(
      createCacheKey('team', teamId),
      async () => {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single()
        
        if (error) throw error
        return data
      },
      [`team:${teamId}`],
      CACHE_CONFIG.longRevalidate
    )
  },

  /**
   * Cache team members
   */
  async teamMembers(teamId: string) {
    const supabase = createClient()
    return cacheData(
      createCacheKey('team', teamId, 'members'),
      async () => {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
        
        if (error) throw error
        return data
      },
      [`team:${teamId}`],
      CACHE_CONFIG.defaultRevalidate
    )
  }
} 