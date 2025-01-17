/**
 * Database Operations Types
 * Last Updated: 2025-03-19
 * 
 * Defines types for database operations like queries, mutations,
 * and results. These types provide a consistent interface for
 * database interactions.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './schema'
import type { DatabaseRecord } from './schema'

/**
 * Database operation result
 */
export interface DatabaseResult<T> {
  data: T | null
  error: Error | null
  count?: number
  status?: number
}

/**
 * Query options for database operations
 */
export interface QueryOptions<T extends DatabaseRecord> {
  select?: (keyof T)[]
  filter?: Partial<Record<keyof T, unknown>>
  orderBy?: {
    column: keyof T
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

/**
 * Database error details
 */
export interface DatabaseErrorDetail {
  code: string
  table?: string
  column?: string
  constraint?: string
  message: string
}

/**
 * Base database operations interface
 */
export interface DatabaseOperations<T extends DatabaseRecord> {
  findById(id: string): Promise<DatabaseResult<T>>
  findMany(options?: QueryOptions<T>): Promise<DatabaseResult<T[]>>
  create(data: Omit<T, keyof DatabaseRecord>): Promise<DatabaseResult<T>>
  update(id: string, data: Partial<Omit<T, keyof DatabaseRecord>>): Promise<DatabaseResult<T>>
  delete(id: string): Promise<DatabaseResult<T>>
}

/**
 * Type for database operation context
 */
export interface DatabaseContext {
  client: SupabaseClient<Database>
  table: keyof Database['public']['Tables']
  schema?: string
}

/**
 * Type guard for database operation results
 */
export function isDatabaseResult<T>(value: unknown): value is DatabaseResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'error' in value
  )
}

/**
 * Type guard for database errors
 */
export function isDatabaseError(error: unknown): error is DatabaseErrorDetail {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
} 