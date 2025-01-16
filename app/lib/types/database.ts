/**
 * Database Types
 * Last Updated: 2024-03-21
 * 
 * Types for database operations and results.
 */

import { Database } from '@/lib/database/database.types'

/**
 * Generic database result type
 */
export interface DatabaseResult<T> {
  data: T | null
  error: string | null
}

/**
 * Base database record type
 */
export interface DatabaseRecord {
  id: string
  created_at: string
  updated_at: string
}

/**
 * Convert null to undefined for optional fields
 */
type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K]
}

/**
 * Convert undefined to null for database fields
 */
type UndefinedToNull<T> = {
  [K in keyof T]: T[K] extends undefined ? null : T[K]
}

/**
 * Make fields optional and convert null to undefined
 */
type OptionalFields<T> = {
  [K in keyof T]: T[K] extends null ? T[K] | undefined : T[K]
}

/**
 * Employee database types
 */
export type DbEmployee = {
  Row: Database['public']['Tables']['employees']['Row']
  Insert: OptionalFields<Database['public']['Tables']['employees']['Insert']>
  Update: OptionalFields<Database['public']['Tables']['employees']['Update']>
}

/**
 * Schedule database types
 */
export type DbSchedule = {
  Row: Database['public']['Tables']['schedules']['Row']
  Insert: OptionalFields<Database['public']['Tables']['schedules']['Insert']>
  Update: OptionalFields<Database['public']['Tables']['schedules']['Update']>
}

/**
 * Assignment database types
 */
export type DbAssignment = {
  Row: Database['public']['Tables']['assignments']['Row']
  Insert: OptionalFields<Database['public']['Tables']['assignments']['Insert']>
  Update: OptionalFields<Database['public']['Tables']['assignments']['Update']>
}

/**
 * Rate limit database types
 */
export type DbRateLimit = {
  Row: Database['public']['Tables']['rate_limits']['Row']
  Insert: OptionalFields<Database['public']['Tables']['rate_limits']['Insert']>
  Update: OptionalFields<Database['public']['Tables']['rate_limits']['Update']>
}

/**
 * Helper function to create a successful database result
 */
export function createSuccessResult<T>(data: T): DatabaseResult<T> {
  return { data, error: null }
}

/**
 * Helper function to create an error database result
 */
export function createErrorResult<T>(error: string): DatabaseResult<T> {
  return { data: null, error }
}

/**
 * Helper function to handle database errors
 */
export function handleDatabaseError<T>(error: unknown): DatabaseResult<T> {
  console.error('Database error:', error)
  return createErrorResult(
    error instanceof Error ? error.message : 'An unexpected database error occurred'
  )
}

/**
 * Helper function to convert undefined to null for database operations
 */
export function toDbNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

/**
 * Helper function to convert null to undefined for application use
 */
export function fromDbNull<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
} 