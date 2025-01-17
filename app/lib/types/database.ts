/**
 * Database Types and Utilities
 * Last Updated: 2025-03-19
 * 
 * Central definition of database types and type utilities.
 * Provides type-safe database operations and schema definitions.
 */

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import type {
  Database,
  Schema,
  Tables,
  TableName,
  Enums,
  Row,
  Insert,
  Update,
  DatabaseRecord
} from '@/lib/types/database/schema'

// Query Types
export type QueryFilter<T extends TableName> = PostgrestFilterBuilder<
  Schema,
  Row<T>,
  Row<T>
>

export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'like' 
  | 'ilike' 
  | 'is' 
  | 'in' 
  | 'cs' 
  | 'cd'

export type FilterValue = string | number | boolean | null | Array<string | number>

export interface Filter<T extends TableName> {
  column: keyof Row<T>
  operator: FilterOperator
  value: FilterValue
}

// Result Types
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseError {
  code: string
  message: string
  details?: unknown
}

// Type Guards
export function isDatabaseResult<T>(value: unknown): value is DatabaseResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'error' in value
  )
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  )
}

// Table Type Helpers
export type TableWithId<T extends TableName> = T extends TableName
  ? 'id' extends keyof Tables[T]['Row']
    ? T
    : never
  : never

// Type Mapper Interface
export interface TypeMapper<
  T extends TableName,
  D, // Domain type
  I, // Insert type
  U = Partial<I> // Update type
> {
  toRow(data: Row<T>): D
  toDbInsert(data: I): Insert<T>
  toDbUpdate(data: U): Update<T>
  validateDbData(data: unknown): data is Row<T> | Insert<T> | Update<T>
}

// Common Database Operations Interface
export interface DatabaseOperations<T> {
  findById(id: string): Promise<DatabaseResult<T>>
  findMany(filters?: Filter<TableName>[]): Promise<DatabaseResult<T[]>>
  create(data: Partial<T>): Promise<DatabaseResult<T>>
  update(id: string, data: Partial<T>): Promise<DatabaseResult<T>>
  delete(id: string): Promise<DatabaseResult<void>>
}

// Re-export types from schema
export type {
  Database,
  Schema,
  Tables,
  TableName,
  Enums,
  Row,
  Insert,
  Update,
  DatabaseRecord
} 