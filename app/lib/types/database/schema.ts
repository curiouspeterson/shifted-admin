/**
 * Database Schema Types
 * Last Updated: 2025-03-19
 * 
 * Re-exports the Supabase generated database types.
 * This is the source of truth for database table schemas.
 */

import type { Database as GeneratedDatabase } from '@/lib/supabase/database.types'
import type { Json } from '@/lib/types/utils/json'

// Re-export the base Database type
export type { Database } from '@/lib/supabase/database.types'

// Schema Types
export type Schema = GeneratedDatabase['public']
export type Tables = Schema['Tables']
export type TableName = keyof Tables
export type Enums = Schema['Enums']

// Table Types
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

// Type Utilities
export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K]
}

export type UndefinedToNull<T> = {
  [K in keyof T]: T[K] extends undefined ? null : T[K]
}

export type OptionalFields<T> = {
  [K in keyof T]: T[K] extends null ? T[K] | undefined : T[K]
}

// Base Record Type
export interface DatabaseRecord {
  id: string
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  metadata?: Json | null
}

// Runtime list of table names for type checking
export const TABLE_NAMES = [
  'employees',
  'schedules',
  'shifts',
  'schedule_assignments',
  'rate_limits',
  'cache_entries'
] as const

// Type guard for checking if a string is a valid table name
export function isTableName(value: string): value is TableName {
  return TABLE_NAMES.includes(value as typeof TABLE_NAMES[number])
} 