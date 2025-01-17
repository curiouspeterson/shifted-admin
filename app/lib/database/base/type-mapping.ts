/**
 * Type Mapping Layer
 * Last Updated: 2024-01-16
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
 * Enhanced type guard for database row validation
 */
function isValidDatabaseRow<T extends TableName>(data: unknown): data is Row<T> {
  if (!data || typeof data !== 'object') {
    return false
  }

  const row = data as Record<string, unknown>
  
  // Validate ID field for row type
  if ('id' in row) {
    return typeof row.id === 'string' && row.id.length > 0
  }

  return false
}

/**
 * Helper function to safely cast database response to row type with validation
 */
export function asRow<T extends TableName>(data: unknown): Row<T> {
  if (!isValidDatabaseRow<T>(data)) {
    throw new Error(
      `Invalid database row: ${
        !data
          ? 'data is null or undefined'
          : typeof data !== 'object'
          ? `expected object, got ${typeof data}`
          : 'missing or invalid id field'
      }`
    )
  }
  return data
}

/**
 * Helper function to safely cast a value to a filter value with detailed errors
 */
export function asFilterValue(value: unknown): FilterValue {
  if (value === null) return value
  
  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value as FilterValue
  }
  
  throw new Error(
    `Invalid filter value: expected string, number, boolean, or null; got ${type}`
  )
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
 * Base type mapper implementation with enhanced validation logic
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
   * Enhanced validation implementation with better type checking
   */
  validateDbData(data: unknown): data is Row<T> | Insert<T> | Update<T> {
    if (!data || typeof data !== 'object') {
      return false
    }

    const record = data as Record<string, unknown>

    // Validate basic structure
    if (Object.keys(record).length === 0) {
      return false
    }

    // Row type validation
    if ('id' in record) {
      return isValidDatabaseRow<T>(record)
    }

    // Insert/Update validation - ensure all values are valid database types
    return Object.values(record).every(value => 
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.every(v => 
        v === null ||
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean'
      )) ||
      (typeof value === 'object' && value !== null)
    )
  }
}

/**
 * Helper type for database operations
 */ 