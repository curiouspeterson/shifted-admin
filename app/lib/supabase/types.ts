/**
 * Supabase Types
 * Last Updated: 2025-01-16
 * 
 * Type definitions and utilities for Supabase database.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Database type from Supabase CLI
 */
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Enums: {
      [key: string]: string[]
    }
  }
}

/**
 * Type-safe database types
 */
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']
export type TablesInsert = {
  [K in keyof Tables]: Tables[K]['Insert']
}
export type TablesUpdate = {
  [K in keyof Tables]: Tables[K]['Update']
}
export type TablesRow = {
  [K in keyof Tables]: Tables[K]['Row']
}

/**
 * Type-safe table names
 */
export type TableName = keyof Tables

/**
 * Type-safe enum types
 */
export type EnumType = keyof Enums

/**
 * Get row type for a specific table
 */
export type Row<T extends TableName> = Tables[T]['Row']

/**
 * Get insert type for a specific table
 */
export type Insert<T extends TableName> = Tables[T]['Insert']

/**
 * Get update type for a specific table
 */
export type Update<T extends TableName> = Tables[T]['Update']

/**
 * Create type-safe Supabase client
 */
export const createTypedClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

/**
 * Type helper for table operations
 */
export function table<T extends TableName>(name: T) {
  return {
    name,
    row: {} as Row<T>,
    insert: {} as Insert<T>,
    update: {} as Update<T>
  }
}

/**
 * Type helper for enum values
 */
export function enumValues<T extends EnumType>(name: T): Enums[T] {
  return {} as Enums[T]
} 