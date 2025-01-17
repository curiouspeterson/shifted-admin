/**
 * Base Repository Class
 * Last Updated: 2024-01-16
 * 
 * Generic base repository for handling common database operations
 * Provides type-safe CRUD operations and query building
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import { Database } from "@/lib/database/database.types"
import { DatabaseError } from "@/lib/utils/error"

// Type helpers
type Tables = Database["public"]["Tables"]
type TableName = keyof Tables
type Row<T extends TableName> = Tables[T]["Row"]
type Insert<T extends TableName> = Tables[T]["Insert"]
type Update<T extends TableName> = Tables[T]["Update"]

// Query options type
export interface QueryOptions<T extends TableName> {
  select?: string
  filters?: {
    column: keyof Row<T>
    operator: string
    value: any
  }[]
  orderBy?: {
    column: keyof Row<T>
    ascending?: boolean
  }[]
  page?: number
  pageSize?: number
  relationships?: string[]
}

export class BaseRepository<T extends TableName> {
  protected supabase
  protected tableName: T

  constructor(tableName: T) {
    this.supabase = createClientComponentClient<Database>()
    this.tableName = tableName
  }

  /**
   * Create a new record
   */
  async create(data: Insert<T>): Promise<Row<T>> {
    try {
      const { data: record, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return record
    } catch (error) {
      throw new DatabaseError(
        `Failed to create ${this.tableName} record`,
        { cause: error }
      )
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string | number, data: Update<T>): Promise<Row<T>> {
    try {
      const { data: record, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return record
    } catch (error) {
      throw new DatabaseError(
        `Failed to update ${this.tableName} record`,
        { cause: error }
      )
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string | number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete ${this.tableName} record`,
        { cause: error }
      )
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string | number, select?: string): Promise<Row<T> | null> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(select || '*')
        .eq('id', id)
        .single()

      const { data: record, error } = await query

      if (error) throw error
      return record
    } catch (error) {
      throw new DatabaseError(
        `Failed to find ${this.tableName} record`,
        { cause: error }
      )
    }
  }

  /**
   * Find multiple records with filtering, pagination, and relationships
   */
  async findMany(options: QueryOptions<T> = {}): Promise<Row<T>[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(this.buildSelect(options))

      // Apply filters
      query = this.applyFilters(query, options.filters)

      // Apply ordering
      if (options.orderBy) {
        for (const order of options.orderBy) {
          query = query.order(order.column as string, {
            ascending: order.ascending ?? true
          })
        }
      }

      // Apply pagination
      if (options.page && options.pageSize) {
        const from = (options.page - 1) * options.pageSize
        const to = from + options.pageSize - 1
        query = query.range(from, to)
      }

      const { data: records, error } = await query

      if (error) throw error
      return records
    } catch (error) {
      throw new DatabaseError(
        `Failed to find ${this.tableName} records`,
        { cause: error }
      )
    }
  }

  /**
   * Build the select statement including relationships
   */
  protected buildSelect(options: QueryOptions<T>): string {
    let select = options.select || '*'
    
    if (options.relationships?.length) {
      select += ',' + options.relationships.join(',')
    }

    return select
  }

  /**
   * Apply filters to the query
   */
  protected applyFilters(
    query: PostgrestFilterBuilder<Database["public"], Row<T>, Row<T>[]>,
    filters?: QueryOptions<T>["filters"]
  ) {
    if (!filters?.length) return query

    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.column as string, filter.value)
          break
        case 'neq':
          query = query.neq(filter.column as string, filter.value)
          break
        case 'gt':
          query = query.gt(filter.column as string, filter.value)
          break
        case 'gte':
          query = query.gte(filter.column as string, filter.value)
          break
        case 'lt':
          query = query.lt(filter.column as string, filter.value)
          break
        case 'lte':
          query = query.lte(filter.column as string, filter.value)
          break
        case 'like':
          query = query.like(filter.column as string, filter.value)
          break
        case 'ilike':
          query = query.ilike(filter.column as string, filter.value)
          break
        case 'in':
          query = query.in(filter.column as string, filter.value)
          break
      }
    }

    return query
  }
} 