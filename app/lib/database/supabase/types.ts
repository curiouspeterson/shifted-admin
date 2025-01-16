/**
 * Supabase Type Helpers
 * Last Updated: 2024-01-15
 * 
 * Provides type-safe helpers for working with Supabase's query builder.
 * Handles complex conditional types and type conversions.
 */

import { Database } from '@/lib/database/database.types'
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'

// Database schema types
export type Schema = Database['public']
export type Tables = Schema['Tables']
export type TableName = keyof Tables

// Table-specific types
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']
export type Relationships<T extends TableName> = Tables[T]['Relationships']

// Query builder types
export type QueryFilter<T extends TableName> = PostgrestFilterBuilder<
  Schema,
  Row<T>,
  Row<T>,
  keyof Relationships<T>,
  Relationships<T>
>

// Type-safe filter operations
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'
export type FilterValue = string | number | boolean | null

export interface Filter<T extends TableName> {
  column: keyof Row<T>
  operator: FilterOperator
  value: FilterValue
}

// Type guard for database rows
export function isDbRow<T extends TableName>(value: unknown): value is Row<T> {
  return value !== null && 
         typeof value === 'object' && 
         'id' in value &&
         Object.keys(value).every(key => typeof key === 'string')
}

// Safe type conversion helpers
export function asDbRow<T extends TableName>(data: unknown): Row<T> {
  if (!isDbRow<T>(data)) {
    throw new Error('Invalid database row structure')
  }
  return data
}

export function asDbRowArray<T extends TableName>(data: unknown[]): Row<T>[] {
  return data.map(item => asDbRow<T>(item))
}

// Type-safe filter value conversion
export function asFilterValue(value: unknown): FilterValue {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

// Type-safe column operations
export type ColumnKey<T extends TableName> = keyof Row<T> & string
export type ColumnValue<T extends TableName, K extends ColumnKey<T>> = Row<T>[K]

// Helper type to ensure table has required columns
export type TableWithId<T extends TableName> = T extends keyof Tables 
  ? Row<T> extends { id: any } 
    ? T 
    : never 
  : never

// Type-safe database operation results
export type DbResult<T> = {
  data: T | null
  error: Error | null
}

export type DbListResult<T> = {
  data: T[]
  error: Error | null
}

// Query builder type helpers
export type QueryBuilder<T extends TableName> = {
  select: () => QueryFilter<T>
  insert: (value: Insert<T>) => QueryFilter<T>
  update: (value: Update<T>) => QueryFilter<T>
  delete: () => QueryFilter<T>
  eq: <K extends ColumnKey<T>>(column: K, value: ColumnValue<T, K>) => QueryFilter<T>
  neq: <K extends ColumnKey<T>>(column: K, value: ColumnValue<T, K>) => QueryFilter<T>
  gt: <K extends ColumnKey<T>>(column: K, value: ColumnValue<T, K>) => QueryFilter<T>
  gte: <K extends ColumnKey<T>>(column: K, value: ColumnValue<T, K>) => QueryFilter<T>
  lt: <K extends ColumnKey<T>>(column: K, value: ColumnValue<T, K>) => QueryFilter<T>
  lte: <K extends ColumnKey<T>>(column: K, value: ColumnValue<T, K>) => QueryFilter<T>
  like: <K extends ColumnKey<T>>(column: K, value: string) => QueryFilter<T>
  ilike: <K extends ColumnKey<T>>(column: K, value: string) => QueryFilter<T>
} 