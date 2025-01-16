/**
 * Base Repository Class
 * Last Updated: 2024-01-15
 * 
 * Provides base database operations with proper typing and error handling.
 * Uses type mappers for safe conversions between domain and database types.
 */

import { 
  SupabaseClient, 
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse
} from '@supabase/supabase-js'
import { Database } from '@/lib/database/database.types'
import { DatabaseError, ErrorCode } from './errors'
import { 
  DatabaseResult, 
  DatabaseListResult, 
  BaseFilters,
  TableName,
  Row,
  Insert,
  Update
} from './types'
import { mapDatabaseError } from './error-mapper'
import { 
  TypeMapper, 
  TableWithId, 
  ColumnKey,
  asFilterValue,
  asRow
} from './type-mapping'

export abstract class BaseRepository<
  T extends TableWithId<TableName>,
  D,
  I,
  U = Partial<I>
> {
  constructor(
    protected readonly supabase: SupabaseClient<Database>,
    protected readonly tableName: T,
    protected readonly typeMapper: TypeMapper<T, D, I, U>
  ) {}

  /**
   * Find a record by ID with proper type safety
   */
  async findById(id: Row<T>['id']): Promise<DatabaseResult<D>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const response = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', asFilterValue(id))
            .single()

          if (response.error) throw response.error
          if (!response.data) throw new Error('Record not found')

          return this.typeMapper.toRow(asRow<T>(response.data))
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
  async findMany(filters: BaseFilters = {}): Promise<DatabaseListResult<D>> {
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
            const column = filters.orderBy.column as ColumnKey<T>
            query = query.order(column, {
              ascending: filters.orderBy.ascending ?? true
            })
          }

          const response = await query
          if (response.error) throw response.error
          if (!response.data) return []

          return response.data.map(row => 
            this.typeMapper.toRow(asRow<T>(row))
          )
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
   * Create a new record with runtime validation
   */
  async create(data: I): Promise<DatabaseResult<D>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const dbData = this.typeMapper.toDbInsert(data)
          
          // Validate mapped data before insert
          if (!this.typeMapper.validateDbData(dbData)) {
            throw new Error('Invalid database data structure')
          }
          
          const response = await this.supabase
            .from(this.tableName)
            .insert(dbData)
            .select()
            .single()

          if (response.error) throw response.error
          if (!response.data) throw new Error('Failed to create record')

          return this.typeMapper.toRow(asRow<T>(response.data))
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
   * Update an existing record with runtime validation
   */
  async update(id: Row<T>['id'], data: U): Promise<DatabaseResult<D>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const dbData = this.typeMapper.toDbUpdate(data)
          
          // Validate mapped data before update
          if (!this.typeMapper.validateDbData(dbData)) {
            throw new Error('Invalid database data structure')
          }
          
          const response = await this.supabase
            .from(this.tableName)
            .update(dbData)
            .eq('id', asFilterValue(id))
            .select()
            .single()

          if (response.error) throw response.error
          if (!response.data) throw new Error('Failed to update record')

          return this.typeMapper.toRow(asRow<T>(response.data))
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
   * Delete a record by ID
   */
  async delete(id: Row<T>['id']): Promise<DatabaseResult<D>> {
    try {
      const result = await this.executeWithRetry(
        async () => {
          const response = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', asFilterValue(id))
            .select()
            .single()

          if (response.error) throw response.error
          if (!response.data) throw new Error('Failed to delete record')

          return this.typeMapper.toRow(asRow<T>(response.data))
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

  /**
   * Execute an operation with retry logic and proper error handling
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    context: {
      tableName: string
      operation: string
      id?: Row<T>['id']
      requestId: string
      metadata?: Record<string, unknown>
    }
  ): Promise<R> {
    let attempt = 1
    const maxAttempts = 3
    const baseDelay = 100

    while (attempt <= maxAttempts) {
      const start = Date.now()
      try {
        return await operation()
      } catch (err) {
        const duration = Date.now() - start
        const error = err instanceof DatabaseError ? err : mapDatabaseError(err, {
          ...context,
          attempt,
          duration
        })

        if (!error.isRetryable() || attempt === maxAttempts) {
          throw error
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        attempt++
      }
    }

    throw new DatabaseError({
      code: ErrorCode.UNKNOWN,
      message: 'Max retry attempts exceeded',
      context: {
        ...context,
        attempt: maxAttempts
      }
    })
  }
} 