/**
 * API Types
 * Last Updated: 2024-01-16
 * 
 * This module defines common types used across API endpoints.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database/database.types'

/**
 * API response format
 */
export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
  metadata?: Record<string, any>
}

/**
 * Route context passed to handlers
 */
export interface RouteContext<TBody = any, TQuery = any> {
  supabase?: SupabaseClient<Database>
  session?: any
  body?: TBody
  query?: TQuery
  requestId?: string
  rateLimit?: {
    limit: number
    remaining: number
    reset: number
  }
  cache?: {
    hit: boolean
    ttl: number
  }
} 