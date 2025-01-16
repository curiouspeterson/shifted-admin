/**
 * Database Types
 * Last Updated: 2024-01-15
 * 
 * This module defines base types for database operations.
 */

import { Database } from '@/lib/database/database.types'
import { DatabaseError } from './errors'

export type Tables = Database['public']['Tables']
export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

/**
 * Column names for a table
 */
export type ColumnName<T extends TableName> = keyof Row<T>

/**
 * Result type for single record operations
 */
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
}

/**
 * Result type for operations returning multiple records
 */
export interface DatabaseListResult<T> {
  data: T[]
  error: DatabaseError | null
}

/**
 * Base filter options for queries
 */
export interface BaseFilters {
  limit?: number
  offset?: number
  orderBy?: {
    column: string
    ascending?: boolean
  }
}

/**
 * Filter operator types
 */
export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'like' 
  | 'ilike' 
  | 'in' 
  | 'is'

/**
 * Filter value types
 */
export type FilterValue = string | number | boolean | null | Date | Array<string | number>

/**
 * Query filter
 */
export interface Filter<T extends TableName> {
  field: keyof Row<T>
  operator: FilterOperator
  value: FilterValue
}

/**
 * Query options
 */
export interface QueryOptions<T extends TableName> {
  select?: Array<keyof Row<T>>
  filters?: Filter<T>[]
  pagination?: {
    page: number
    perPage: number
  }
  sorting?: {
    column: keyof Row<T>
    direction: 'asc' | 'desc'
  }
}

/**
 * Type guard to check if a value is a valid database row
 */
export function isValidRow<T extends TableName>(value: unknown): value is Row<T> {
  return value !== null && typeof value === 'object' && 'id' in value
}

/**
 * Type guard to check if a value is an array of valid database rows
 */
export function isValidRowArray<T extends TableName>(value: unknown): value is Row<T>[] {
  return Array.isArray(value) && value.every(item => isValidRow<T>(item))
}

/**
 * Helper type for Supabase query responses
 */
export type QueryResponse<T> = {
  data: T | null
  error: Error | null
} 