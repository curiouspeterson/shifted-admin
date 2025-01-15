/**
 * Base Repository
 * Last Updated: 2024-03-20
 * 
 * This class provides a base implementation for database repositories.
 * It includes improved error handling, logging, and transaction support.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { DatabaseError, ErrorCode, ErrorContext, mapDatabaseError } from './errors'
import { TransactionManager } from './transaction'
import { errorLogger } from '@/lib/logging/error-logger'
import { performance } from '@/lib/utils/performance'

export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseListResult<T> {
  data: T[]
  error: DatabaseError | null
}

export interface BaseFilters {
  limit?: number
  offset?: number
  orderBy?: {
    column: string
    ascending?: boolean
  }
}

interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 1000,
  backoffFactor: 2
}

export abstract class BaseRepository<T extends Record<string, any>> {
  protected readonly tableName: string
  protected readonly transactionManager: TransactionManager

  constructor(
    protected readonly supabase: SupabaseClient<Database>,
    tableName: string
  ) {
    this.tableName = tableName
    this.transactionManager = new TransactionManager(supabase)
  }

  /**
   * Execute operation with retry logic
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    context: Partial<ErrorContext>,
    options: RetryOptions = DEFAULT_RETRY_OPTIONS
  ): Promise<R> {
    const { maxAttempts = 3, initialDelay = 100, maxDelay = 1000, backoffFactor = 2 } = options
    let attempt = 1
    let delay = initialDelay

    while (true) {
      const start = performance.now()
      try {
        const result = await operation()
        return result
      } catch (err) {
        const duration = performance.now() - start
        const error = mapDatabaseError(err, {
          ...context,
          attempt,
          duration,
          timestamp: new Date().toISOString()
        })

        if (!error.isRetryable() || attempt >= maxAttempts) {
          throw error
        }

        // Log retry attempt
        errorLogger.warn('Retrying database operation', {
          tableName: this.tableName,
          attempt,
          maxAttempts,
          delay,
          error: error.toJSON()
        })

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Increase delay for next attempt
        delay = Math.min(delay * backoffFactor, maxDelay)
        attempt++
      }
    }
  }

  /**
   * Find a record by ID
   */
  async findById(id: string | number): Promise<DatabaseResult<T>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single()

          if (error) throw error
          if (!data) throw new Error(`Record not found: ${id}`)

          return data
        },
        {
          tableName: this.tableName,
          operation: 'findById',
          id,
          requestId: crypto.randomUUID()
        }
      )

      return { data: result, error: null }
    } catch (err) {
      const error = err instanceof DatabaseError ? err : mapDatabaseError(err)
      return { data: null, error }
    }
  }

  /**
   * Find multiple records with optional filters
   */
  async findMany(filters: BaseFilters = {}): Promise<DatabaseListResult<T>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          let query = this.supabase
            .from(this.tableName)
            .select('*')

          if (filters.limit) {
            query = query.limit(filters.limit)
          }

          if (filters.offset) {
            query = query.range(
              filters.offset,
              filters.offset + (filters.limit || 10) - 1
            )
          }

          if (filters.orderBy) {
            query = query.order(
              filters.orderBy.column,
              { ascending: filters.orderBy.ascending ?? true }
            )
          }

          const { data, error } = await query
          if (error) throw error

          return data || []
        },
        {
          tableName: this.tableName,
          operation: 'findMany',
          requestId: crypto.randomUUID(),
          metadata: { filters }
        }
      )

      return { data: result, error: null }
    } catch (err) {
      const error = err instanceof DatabaseError ? err : mapDatabaseError(err)
      return { data: [], error }
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<DatabaseResult<T>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const { data: created, error } = await this.supabase
            .from(this.tableName)
            .insert(data)
            .select()
            .single()

          if (error) throw error
          if (!created) throw new Error('Failed to create record')

          return created
        },
        {
          tableName: this.tableName,
          operation: 'create',
          requestId: crypto.randomUUID(),
          metadata: { data }
        }
      )

      return { data: result, error: null }
    } catch (err) {
      const error = err instanceof DatabaseError ? err : mapDatabaseError(err)
      return { data: null, error }
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string | number, data: Partial<T>): Promise<DatabaseResult<T>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const { data: updated, error } = await this.supabase
            .from(this.tableName)
            .update(data)
            .eq('id', id)
            .select()
            .single()

          if (error) throw error
          if (!updated) throw new Error(`Record not found: ${id}`)

          return updated
        },
        {
          tableName: this.tableName,
          operation: 'update',
          id,
          requestId: crypto.randomUUID(),
          metadata: { data }
        }
      )

      return { data: result, error: null }
    } catch (err) {
      const error = err instanceof DatabaseError ? err : mapDatabaseError(err)
      return { data: null, error }
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string | number): Promise<DatabaseResult<T>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const { data: deleted, error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id)
            .select()
            .single()

          if (error) throw error
          if (!deleted) throw new Error(`Record not found: ${id}`)

          return deleted
        },
        {
          tableName: this.tableName,
          operation: 'delete',
          id,
          requestId: crypto.randomUUID()
        }
      )

      return { data: result, error: null }
    } catch (err) {
      const error = err instanceof DatabaseError ? err : mapDatabaseError(err)
      return { data: null, error }
    }
  }
} 