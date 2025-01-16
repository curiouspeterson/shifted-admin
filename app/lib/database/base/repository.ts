/**
 * Base Repository Class
 * Last Updated: January 16, 2025
 * 
 * Provides type-safe database operations with RLS support
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '../../../types/supabase'

type Tables = Database['public']['Tables']
type TableName = keyof Tables
type Row<T extends TableName> = Tables[T]['Row']
type Insert<T extends TableName> = Tables[T]['Insert']
type Update<T extends TableName> = Tables[T]['Update']

export interface DatabaseResult<T> {
  data: T | null
  error: PostgrestError | null
  count: number | null
  status: number
  statusText: string
}

export interface QueryOptions<T extends TableName> {
  select?: Array<keyof Row<T>>
  filter?: {
    column: keyof Row<T>
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: unknown
  }[]
  order?: {
    column: keyof Row<T>
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

export class BaseRepository<T extends TableName> {
  constructor(
    protected readonly client: SupabaseClient<Database>,
    protected readonly table: T
  ) {}

  /**
   * Find a record by ID with RLS validation
   */
  async findById(id: string): Promise<DatabaseResult<Row<T>>> {
    const { data, error, status, statusText } = await this.client
      .from(this.table)
      .select()
      .match({ id })
      .single()

    if (error) {
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    return {
      data: data as unknown as Row<T>,
      error: null,
      count: 1,
      status,
      statusText
    }
  }

  /**
   * Find records with options and RLS validation
   */
  async find(options?: QueryOptions<T>): Promise<DatabaseResult<Row<T>[]>> {
    let query = this.client
      .from(this.table)
      .select(options?.select ? options.select.join(',') : '*')

    if (options?.filter) {
      for (const filter of options.filter) {
        const column = String(filter.column)
        const value = filter.value
        
        switch (filter.operator) {
          case 'eq':
            query = query.match({ [column]: value })
            break
          case 'neq':
            query = query.not(column, 'eq', value)
            break
          case 'gt':
            query = query.gt(column, value)
            break
          case 'gte':
            query = query.gte(column, value)
            break
          case 'lt':
            query = query.lt(column, value)
            break
          case 'lte':
            query = query.lte(column, value)
            break
          case 'like':
            query = query.like(column, String(value))
            break
          case 'ilike':
            query = query.ilike(column, String(value))
            break
          case 'in':
            query = query.in(column, Array.isArray(value) ? value : [value])
            break
        }
      }
    }

    if (options?.order) {
      query = query.order(String(options.order.column), {
        ascending: options.order.ascending
      })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      )
    }

    const { data, error, count, status, statusText } = await query

    if (error) {
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    return {
      data: data as unknown as Row<T>[],
      error: null,
      count: count || null,
      status,
      statusText
    }
  }

  /**
   * Create a new record
   * Note: This should be called from a server context with appropriate service role
   */
  async create(params: Insert<T>): Promise<DatabaseResult<Row<T>>> {
    const { data, error, status, statusText } = await this.client
      .from(this.table)
      .insert(params as any)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    return {
      data: data as unknown as Row<T>,
      error: null,
      count: 1,
      status,
      statusText
    }
  }

  /**
   * Update a record
   * Note: This should be called from a server context with appropriate service role
   */
  async update(id: string, params: Update<T>): Promise<DatabaseResult<Row<T>>> {
    const { data, error, status, statusText } = await this.client
      .from(this.table)
      .update(params as any)
      .match({ id })
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    return {
      data: data as unknown as Row<T>,
      error: null,
      count: 1,
      status,
      statusText
    }
  }

  /**
   * Delete a record
   * Note: This should be called from a server context with appropriate service role
   */
  async delete(id: string): Promise<DatabaseResult<Row<T>>> {
    const { data, error, status, statusText } = await this.client
      .from(this.table)
      .delete()
      .match({ id })
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    return {
      data: data as unknown as Row<T>,
      error: null,
      count: 1,
      status,
      statusText
    }
  }
} 