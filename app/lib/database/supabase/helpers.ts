/**
 * Supabase Helpers
 * Last Updated: 2025-01-16
 * 
 * Provides type-safe helper functions for interacting with Supabase.
 * Uses a combination of compile-time type checking and runtime validation
 * to ensure type safety when working with Supabase's query builder.
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
export type QueryBuilder<T extends TableName> = ReturnType<typeof createQueryBuilder<T>>

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
    throw new DatabaseError({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Invalid database row data',
      context: { data }
    })
  }
  return data
}

/**
 * Helper function to safely cast database response to row array
 */
export function asRowArray<T extends TableName>(data: unknown): Row<T>[] {
  if (!isValidRowArray<T>(data)) {
    throw new DatabaseError({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Invalid database row array data',
      context: { data }
    })
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
  const { data: result, error } = await client
    .from(table)
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new DatabaseError({
      code: ErrorCode.INSERT_FAILED,
      message: `Failed to insert row in table ${table}`,
      context: { 
        table, 
        data,
        operation: {
          type: 'insert',
          table,
          timestamp: new Date().toISOString()
        }
      },
      cause: error
    })
  }

  if (!result) {
    throw new DatabaseError({
      code: ErrorCode.NOT_FOUND,
      message: `No data returned after insert in table ${table}`,
      context: { 
        table, 
        data,
        operation: {
          type: 'insert',
          table,
          timestamp: new Date().toISOString()
        }
      }
    })
  }

  return result as Row<T>
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
  const { data: result, error } = await client
    .from(table)
    .update(data as any)
    .eq('id' as any, id)
    .select()
    .single()

  if (error) {
    throw new DatabaseError({
      code: ErrorCode.UPDATE_FAILED,
      message: `Failed to update row in table ${table}`,
      context: { 
        table, 
        id, 
        data,
        operation: {
          type: 'update',
          table,
          timestamp: new Date().toISOString()
        }
      },
      cause: error
    })
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
    throw new DatabaseError({
      code: ErrorCode.DELETE_FAILED,
      message: `Failed to delete row in table ${table}`,
      context: { 
        table, 
        id,
        operation: {
          type: 'delete',
          table,
          timestamp: new Date().toISOString()
        }
      },
      cause: error
    })
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
    throw new DatabaseError({
      code: ErrorCode.NOT_FOUND,
      message: `Failed to get row from table ${table}`,
      context: { 
        table, 
        id,
        operation: {
          type: 'query',
          table,
          timestamp: new Date().toISOString()
        }
      },
      cause: error
    })
  }

  return asRow<T>(result)
}

// Type-safe filter operations
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'
export type FilterValue<T> = T extends string ? string :
                           T extends number ? number :
                           T extends boolean ? boolean :
                           T extends null ? null :
                           never

export interface Filter<T extends TableName, K extends ColumnKey<T>> {
  column: K
  operator: FilterOperator
  value: FilterValue<ColumnValue<T, K>>
}

/**
 * Type guard to validate filter value
 */
function isValidFilterValue<T>(value: unknown, expectedType: string): value is FilterValue<T> {
  if (value === null) return true
  const type = typeof value
  return type === expectedType
}

/**
 * Apply a filter to a query
 */
export function applyFilter<T extends TableName, K extends ColumnKey<T>>(
  query: QueryBuilder<T>,
  filter: Filter<T, K>
): QueryBuilder<T> {
  const columnType = typeof filter.value === 'object' ? 'null' : typeof filter.value
  if (!isValidFilterValue(filter.value, columnType)) {
    throw new DatabaseError({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Invalid filter value',
      context: { 
        filters: [filter],
        value: filter.value,
        column: filter.column,
        operation: {
          type: 'query',
          table: filter.column.split('.')[0],
          timestamp: new Date().toISOString()
        }
      }
    })
  }

  switch (filter.operator) {
    case 'eq':
      return query.eq(filter.column, filter.value)
    case 'neq':
      return query.neq(filter.column, filter.value)
    case 'gt':
      return query.gt(filter.column, filter.value)
    case 'gte':
      return query.gte(filter.column, filter.value)
    case 'lt':
      return query.lt(filter.column, filter.value)
    case 'lte':
      return query.lte(filter.column, filter.value)
    case 'like':
      if (typeof filter.value !== 'string') {
        throw new DatabaseError({
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Like operator requires string value',
          context: { filters: [filter] }
        })
      }
      return query.like(filter.column, filter.value)
    case 'ilike':
      if (typeof filter.value !== 'string') {
        throw new DatabaseError({
          code: ErrorCode.VALIDATION_FAILED,
          message: 'ILike operator requires string value',
          context: { filters: [filter] }
        })
      }
      return query.ilike(filter.column, filter.value)
    default:
      throw new DatabaseError({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Invalid filter operator',
        context: { filters: [filter] }
      })
  }
}

/**
 * Apply multiple filters to a query
 */
export function applyFilters<T extends TableName>(
  query: QueryBuilder<T>,
  filters: Filter<T, ColumnKey<T>>[]
): QueryBuilder<T> {
  return filters.reduce((q, filter) => applyFilter(q, filter), query)
}

/**
 * Apply pagination to a query
 */
export function applyPagination<T extends TableName>(
  query: QueryBuilder<T>,
  page: number,
  perPage: number
): QueryBuilder<T> {
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  return query.range(from, to)
}

/**
 * Apply ordering to a query
 */
export function applyOrdering<T extends TableName, K extends ColumnKey<T>>(
  query: QueryBuilder<T>,
  column: K,
  ascending: boolean = true
): QueryBuilder<T> {
  return query.order(column, { ascending })
} 