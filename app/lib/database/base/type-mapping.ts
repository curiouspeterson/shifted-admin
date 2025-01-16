/**
 * Type Mapping Layer
 * Last Updated: 2024-01-15
 * 
 * Provides type-safe conversions between domain types and database types.
 * Handles Supabase's complex type system and ensures proper type safety.
 */

import { Database } from '@/lib/database/database.types'

// Database schema types
export type Schema = Database['public']
export type Tables = Schema['Tables']
export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

// Type guard for tables with ID column
export type TableWithId<T extends TableName> = T extends any
  ? 'id' extends keyof Tables[T]['Row']
    ? T
    : never
  : never

// Type mapper interface for converting between domain and database types
export interface TypeMapper<
  T extends TableName,
  D, // Domain type
  I, // Insert type
  U = Partial<I> // Update type
> {
  /**
   * Convert database row to domain type
   */
  toRow(data: Row<T>): D

  /**
   * Convert domain insert type to database insert type
   */
  toDbInsert(data: I): Insert<T>

  /**
   * Convert domain update type to database update type
   */
  toDbUpdate(data: U): Update<T>

  /**
   * Validate database data structure
   */
  validateDbData(data: unknown): data is Row<T> | Insert<T> | Update<T>
}

/**
 * Base type mapper implementation with common validation logic
 */
export abstract class BaseTypeMapper<
  T extends TableName,
  D,
  I,
  U = Partial<I>
> implements TypeMapper<T, D, I, U> {
  abstract toRow(data: Row<T>): D
  abstract toDbInsert(data: I): Insert<T>
  abstract toDbUpdate(data: U): Update<T>

  /**
   * Default validation implementation
   * Override in specific mappers for more precise validation
   */
  validateDbData(data: unknown): data is Row<T> | Insert<T> | Update<T> {
    if (!data || typeof data !== 'object') {
      return false
    }

    // Basic structure validation
    const keys = Object.keys(data)
    if (keys.length === 0) {
      return false
    }

    // Check for required fields based on operation type
    if ('id' in data) {
      // Row type validation
      return typeof (data as Row<T>).id === 'string'
    }

    // Insert/Update validation
    return true
  }
}

/**
 * Helper type for extracting valid column names
 */
export type ColumnKey<T extends TableName> = keyof Row<T> & string

/**
 * Helper type for resolving filter values
 */
export type FilterValue = string | number | boolean | null

/**
 * Helper function to safely cast a value to a filter value
 */
export function asFilterValue(value: unknown): FilterValue {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value
  }
  throw new Error(`Invalid filter value: ${value}`)
}

/**
 * Helper function to safely cast database response to row type
 */
export function asRow<T extends TableName>(data: unknown): Row<T> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid database row')
  }
  return data as Row<T>
}

/**
 * Helper type for database operations
 */
export type { Tables } 