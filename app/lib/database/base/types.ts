/**
 * Database Types and Guards
 * Last Updated: January 16, 2025
 */

import type { Database as GeneratedDatabase } from '../../../types/supabase'

// Helper types for easier table access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Override types for views and specific columns
export type Database = {
  public: {
    Tables: {
      teams: GeneratedDatabase['public']['Tables']['teams'] & {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
      }
      team_members: GeneratedDatabase['public']['Tables']['team_members'] & {
        Row: {
          id: string
          team_id: string
          user_id: string
          status: Enums<'team_member_status'>
          created_at: string
          updated_at: string
        }
      }
      projects: GeneratedDatabase['public']['Tables']['projects']
      tasks: GeneratedDatabase['public']['Tables']['tasks']
      comments: GeneratedDatabase['public']['Tables']['comments']
    }
    Views: GeneratedDatabase['public']['Views']
    Functions: GeneratedDatabase['public']['Functions']
    Enums: GeneratedDatabase['public']['Enums']
  }
}

// Type guard for DatabaseRecord
export function isDatabaseRecord(value: unknown): value is DatabaseRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as DatabaseRecord).id === 'string'
  )
}

// Base interface for all database records
export interface DatabaseRecord {
  id: string
  created_at: string
  updated_at: string
}

// Type-safe query options
export interface QueryOptions<T extends DatabaseRecord> {
  select?: (keyof T)[]
  order?: {
    column: keyof T
    ascending?: boolean
  }
  limit?: number
  offset?: number
  filter?: {
    column: keyof T
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: unknown
  }[]
}

// Type-safe database result
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
  count: number | null
  status: number
  statusText: string
}

// Database error type
export interface DatabaseError {
  code: string
  message: string
  details?: unknown
}

// Type guard for database errors
export function isDatabaseError(error: unknown): error is DatabaseError {
  if (!error || typeof error !== 'object') return false
  
  const err = error as DatabaseError
  return (
    typeof err.code === 'string' &&
    typeof err.message === 'string'
  )
}

// Helper type for insert operations
export type InsertParams<T extends DatabaseRecord> = Omit<T, 'id' | 'created_at' | 'updated_at'>

// Helper type for update operations
export type UpdateParams<T extends DatabaseRecord> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>

// Helper type for database joins
export type JoinedTable<T extends DatabaseRecord, U extends DatabaseRecord> = T & {
  [K in keyof U as `${string & K}_${string}`]: U[K]
}

// Type-safe response for complex queries
export type QueryData<T> = T extends PromiseLike<{ data: infer U }> ? U : never
export type QueryError<T> = T extends PromiseLike<{ error: infer U }> ? U : never

// RLS-specific types
export interface RLSContext {
  user_id: string
  roles: string[]
  team_id?: string
}

// Type guard for RLS context
export function isRLSContext(value: unknown): value is RLSContext {
  if (!value || typeof value !== 'object') return false
  
  const ctx = value as RLSContext
  return (
    typeof ctx.user_id === 'string' &&
    Array.isArray(ctx.roles) &&
    ctx.roles.every(role => typeof role === 'string') &&
    (ctx.team_id === undefined || typeof ctx.team_id === 'string')
  )
} 