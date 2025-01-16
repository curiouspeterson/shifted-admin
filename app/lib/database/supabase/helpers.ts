/**
 * Supabase Helpers
 * Last Updated: 2024-01-15
 * 
 * Provides type-safe helper functions for interacting with Supabase.
 * Uses a combination of compile-time type checking and runtime validation
 * to ensure type safety when working with Supabase's query builder.
 * 
 * Note on Type Safety:
 * Due to Supabase's complex conditional types, we use strategic type assertions
 * in specific places. These assertions are always paired with runtime validation
 * to ensure type safety. The trade-off here is between perfect type inference
 * and practical usability.
 */

import { SupabaseClient, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js'
import { Database } from '@/lib/database/database.types'
import { DatabaseError, ErrorCode } from '../base/errors'

// Type aliases for database schema
export type Schema = Database['public']
export type Tables = Schema['Tables']
export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

// Type-safe response types
export type QueryResponse<T> = PostgrestResponse<T>
export type SingleQueryResponse<T> = PostgrestSingleResponse<T>

// Column type helpers
export type ColumnKey<T extends TableName> = keyof Row<T> & string
export type ColumnValue<T extends TableName, K extends ColumnKey<T>> = Row<T>[K]

// Runtime type validation
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasId(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === 'string'
}

/**
 * Type guard to validate database row data
 */
export function isValidRow<T extends TableName>(value: unknown): value is Row<T> {
  return isRecord(value) && hasId(value)
}

/**
 * Type guard to validate an array of database rows
 */
export function isValidRowArray<T extends TableName>(value: unknown): value is Row<T>[] {
  return Array.isArray(value) && value.every(item => isValidRow<T>(item))
}

/**
 * Helper function to safely cast database response to row type
 */
export function asRow<T extends TableName>(data: unknown): Row<T> {
  if (!isValidRow<T>(data)) {
    throw new DatabaseError(
      ErrorCode.VALIDATION_FAILED,
      'Invalid database row data',
      { data }
    )
  }
  return data
}

/**
 * Helper function to safely cast database response to row array
 */
export function asRowArray<T extends TableName>(data: unknown): Row<T>[] {
  if (!isValidRowArray<T>(data)) {
    throw new DatabaseError(
      ErrorCode.VALIDATION_FAILED,
      'Invalid database row array data',
      { data }
    )
  }
  return data
}

/**
 * Create a type-safe query builder for a table
 */
export function createQueryBuilder<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T
) {
  return client.from(table).select('*')
}

/**
 * Type-safe function to insert a row
 */
export async function insertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Insert<T>
): Promise<Row<T>> {
  // Note: We use a type assertion here due to Supabase's complex types.
  // Runtime validation ensures type safety.
  const { data: result, error } = await client
    .from(table)
    .insert(data as any)
    .select()
    .single()

  if (error) {
    throw new DatabaseError(
      ErrorCode.INSERT_FAILED,
      `Failed to insert row in table ${table}`,
      { table, data, originalError: error }
    )
  }

  return asRow<T>(result)
}

/**
 * Type-safe function to update a row
 */
export async function updateRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string,
  data: Update<T>
): Promise<Row<T>> {
  // Note: We use type assertions here due to Supabase's complex types.
  // Runtime validation ensures type safety.
  const { data: result, error } = await client
    .from(table)
    .update(data as any)
    .eq('id' as any, id)
    .select()
    .single()

  if (error) {
    throw new DatabaseError(
      ErrorCode.UPDATE_FAILED,
      `Failed to update row in table ${table}`,
      { table, id, data, originalError: error }
    )
  }

  return asRow<T>(result)
}

/**
 * Type-safe function to delete a row
 */
export async function deleteRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string
): Promise<void> {
  const { error } = await client
    .from(table)
    .delete()
    .eq('id' as any, id)

  if (error) {
    throw new DatabaseError(
      ErrorCode.DELETE_FAILED,
      `Failed to delete row in table ${table}`,
      { table, id, originalError: error }
    )
  }
}

/**
 * Type-safe function to get a row by ID
 */
export async function getRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string
): Promise<Row<T>> {
  const { data: result, error } = await client
    .from(table)
    .select()
    .eq('id' as any, id)
    .single()

  if (error) {
    throw new DatabaseError(
      ErrorCode.NOT_FOUND,
      `Failed to get row from table ${table}`,
      { table, id, originalError: error }
    )
  }

  return asRow<T>(result)
}

// Type-safe filter operations
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'
export type FilterValue = string | number | boolean | null

export interface Filter<T extends TableName> {
  column: ColumnKey<T>
  operator: FilterOperator
  value: FilterValue
}

/**
 * Type guard to check if a value is a valid filter value
 */
function isValidFilterValue(value: unknown): value is FilterValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  )
}

/**
 * Apply a filter to a query
 */
export function applyFilter<T extends TableName>(
  query: ReturnType<typeof createQueryBuilder<T>>,
  filter: Filter<T>
) {
  if (!isValidFilterValue(filter.value)) {
    throw new Error(`Invalid filter value: ${filter.value}`)
  }

  // Note: We use type assertions here due to Supabase's complex types.
  // Runtime validation ensures type safety.
  const column = filter.column as any
  const value = filter.value as any

  switch (filter.operator) {
    case 'eq':
      return query.eq(column, value)
    case 'neq':
      return query.neq(column, value)
    case 'gt':
      return query.gt(column, value)
    case 'gte':
      return query.gte(column, value)
    case 'lt':
      return query.lt(column, value)
    case 'lte':
      return query.lte(column, value)
    case 'like':
      return query.like(column, value)
    case 'ilike':
      return query.ilike(column, value)
    default:
      throw new Error(`Unsupported filter operator: ${filter.operator}`)
  }
}

/**
 * Apply multiple filters to a query
 */
export function applyFilters<T extends TableName>(
  query: ReturnType<typeof createQueryBuilder<T>>,
  filters: Filter<T>[]
) {
  return filters.reduce((q, filter) => applyFilter(q, filter), query)
}

/**
 * Apply pagination to a query
 */
export function applyPagination<T extends TableName>(
  query: ReturnType<typeof createQueryBuilder<T>>,
  page: number,
  perPage: number
) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  return query.range(from, to)
}

/**
 * Apply ordering to a query
 */
export function applyOrdering<T extends TableName>(
  query: ReturnType<typeof createQueryBuilder<T>>,
  column: ColumnKey<T>,
  ascending: boolean = true
) {
  return query.order(column as any, { ascending })
} 