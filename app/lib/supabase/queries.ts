/**
 * Supabase Query Builders
 * Last Updated: 2025-01-16
 * 
 * Type-safe query builders for Supabase database operations.
 */

import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { Database } from './types'
import { DatabaseError } from '../errors/database'

type Tables = Database['public']['Tables']
type TableName = keyof Tables & string
type Row<T extends TableName> = Tables[T]['Row']
type Insert<T extends TableName> = Tables[T]['Insert']
type Update<T extends TableName> = Tables[T]['Update']

/**
 * Query options
 */
export interface QueryOptions {
  select?: string
  eq?: Record<string, unknown>
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
}

/**
 * Base query builder
 */
export class QueryBuilder<T extends TableName> {
  protected client: SupabaseClient<Database>
  protected table: T

  constructor(client: SupabaseClient<Database>, table: T) {
    this.client = client
    this.table = table
  }

  /**
   * Get all records
   */
  async getAll(options: QueryOptions = {}): Promise<Row<T>[]> {
    try {
      let query = this.client
        .from(this.table)
        .select(options.select || '*')

      if (options.eq) {
        for (const [key, value] of Object.entries(options.eq)) {
          query = query.eq(key, value)
        }
      }

      if (options.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true
        })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        )
      }

      const { data, error } = await query

      if (error) throw error
      if (!data) throw new DatabaseError('No data returned')

      return data as unknown as Row<T>[]
    } catch (error) {
      throw new DatabaseError(
        'Failed to fetch records',
        error as PostgrestError
      )
    }
  }

  /**
   * Get record by ID
   */
  async getById(id: string): Promise<Row<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select()
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new DatabaseError('Record not found')

      return data as unknown as Row<T>
    } catch (error) {
      throw new DatabaseError(
        'Failed to fetch record',
        error as PostgrestError
      )
    }
  }

  /**
   * Create record
   */
  async create(record: Insert<T>): Promise<Row<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert(record)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new DatabaseError('Failed to create record')

      return data as unknown as Row<T>
    } catch (error) {
      throw new DatabaseError(
        'Failed to create record',
        error as PostgrestError
      )
    }
  }

  /**
   * Update record
   */
  async update(id: string, record: Update<T>): Promise<Row<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(record)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new DatabaseError('Record not found')

      return data as unknown as Row<T>
    } catch (error) {
      throw new DatabaseError(
        'Failed to update record',
        error as PostgrestError
      )
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new DatabaseError(
        'Failed to delete record',
        error as PostgrestError
      )
    }
  }

  /**
   * Count records
   */
  async count(eq?: Record<string, unknown>): Promise<number> {
    try {
      let query = this.client
        .from(this.table)
        .select('*', { count: 'exact', head: true })

      if (eq) {
        for (const [key, value] of Object.entries(eq)) {
          query = query.eq(key, value)
        }
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    } catch (error) {
      throw new DatabaseError(
        'Failed to count records',
        error as PostgrestError
      )
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.count({ id })
    return count > 0
  }
}

/**
 * Create a query builder
 */
export function createQueryBuilder<T extends TableName>(
  table: T,
  client?: SupabaseClient<Database>
): QueryBuilder<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!client) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    client = createClient<Database>(supabaseUrl, supabaseKey)
  }

  return new QueryBuilder<T>(client, table)
} 