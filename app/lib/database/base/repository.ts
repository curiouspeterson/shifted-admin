/**
 * Base Repository Class
 * Last Updated: January 16, 2025
 * 
 * Provides type-safe database operations with RLS support.
 * This is an abstract base class - specific repositories should extend it
 * and provide their own type implementations and query builders.
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '../../supabase/generated-types'
import { errorLogger } from '../../logging/error-logger'

type Schema = Database['public']
type Tables = Schema['Tables']
type TableName = keyof Tables

type FilterValue = string | number | boolean | null | Array<string | number | boolean | null>

/**
 * Common response type for database operations
 */
interface QueryResponse<T> {
  data: T | null
  error: PostgrestError | null
  status: number
  statusText: string
}

/**
 * Response type for operations that return a single record
 */
interface SingleQueryResponse<T> extends QueryResponse<T> {
  count: null
}

/**
 * Response type for operations that return multiple records
 */
interface MultiQueryResponse<T> extends QueryResponse<T> {
  count: number | null
}

/**
 * Creates a standard error object matching PostgrestError shape
 */
function createError(message: string): PostgrestError {
  return {
    message,
    details: '',
    hint: '',
    code: 'INVALID_FORMAT',
    name: 'PostgrestError'
  }
}

/**
 * Type guard to check if a value is a PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return error !== null && 
         typeof error === 'object' && 
         'code' in error && 
         'name' in error && 
         'message' in error
}

export interface DatabaseResult<T> {
  data: T | null
  error: PostgrestError | null
  count: number | null
  status: number
  statusText: string
}

export interface QueryOptions {
  select?: string[]
  filter?: {
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: FilterValue
  }[]
  order?: {
    column: string
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

/**
 * Base repository class for database operations
 * @template T - The table name in the database
 * @template Row - The type of a row in the table (defaults to Tables[T]['Row'])
 * @template Insert - The type for inserting a new row (defaults to Tables[T]['Insert'])
 * @template Update - The type for updating an existing row (defaults to Tables[T]['Update'])
 */
export abstract class BaseRepository<
  T extends TableName,
  Row = Tables[T]['Row'],
  Insert = Tables[T]['Insert'],
  Update = Tables[T]['Update']
> {
  constructor(
    protected readonly client: SupabaseClient<Database>,
    protected readonly table: T
  ) {}

  /**
   * Type guard to check if a value matches the Row type
   */
  protected abstract isValidRow(data: unknown): data is Row

  /**
   * Build a query for finding a record by ID
   */
  protected abstract buildFindByIdQuery(id: string): Promise<SingleQueryResponse<Row>>

  /**
   * Build a query for finding records with options
   */
  protected abstract buildFindQuery(options?: QueryOptions): Promise<MultiQueryResponse<Row>>

  /**
   * Build a query for creating a record
   */
  protected abstract buildCreateQuery(params: Insert): Promise<SingleQueryResponse<Row>>

  /**
   * Build a query for updating a record
   */
  protected abstract buildUpdateQuery(id: string, params: Update): Promise<SingleQueryResponse<Row>>

  /**
   * Build a query for deleting a record
   */
  protected abstract buildDeleteQuery(id: string): Promise<SingleQueryResponse<Row>>

  /**
   * Find a record by ID with RLS validation
   */
  async findById(id: string): Promise<DatabaseResult<Row>> {
    const { data, error, status, statusText } = await this.buildFindByIdQuery(id)

    if (isPostgrestError(error)) {
      errorLogger.error('Database findById error', { error, table: this.table, id })
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    if (!this.isValidRow(data)) {
      const validationError = createError('Invalid data format')
      errorLogger.error('Database findById validation error', { 
        error: validationError, 
        table: this.table, 
        id,
        data 
      })
      return {
        data: null,
        error: validationError,
        count: null,
        status: 400,
        statusText: 'Bad Request'
      }
    }

    return {
      data,
      error: null,
      count: 1,
      status,
      statusText
    }
  }

  /**
   * Find records with options and RLS validation
   */
  async find(options?: QueryOptions): Promise<DatabaseResult<Row[]>> {
    const { data, error, count, status, statusText } = await this.buildFindQuery(options)

    if (isPostgrestError(error)) {
      errorLogger.error('Database find error', { error, table: this.table, options })
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    if (!Array.isArray(data) || !data.every(item => this.isValidRow(item))) {
      const validationError = createError('Invalid data format')
      errorLogger.error('Database find validation error', { 
        error: validationError, 
        table: this.table, 
        options,
        data 
      })
      return {
        data: null,
        error: validationError,
        count: null,
        status: 400,
        statusText: 'Bad Request'
      }
    }

    return {
      data,
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
  async create(params: Insert): Promise<DatabaseResult<Row>> {
    const { data, error, status, statusText } = await this.buildCreateQuery(params)

    if (isPostgrestError(error)) {
      errorLogger.error('Database create error', { error, table: this.table, params })
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    if (!this.isValidRow(data)) {
      const validationError = createError('Invalid data format')
      errorLogger.error('Database create validation error', { 
        error: validationError, 
        table: this.table, 
        params,
        data 
      })
      return {
        data: null,
        error: validationError,
        count: null,
        status: 400,
        statusText: 'Bad Request'
      }
    }

    return {
      data,
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
  async update(id: string, params: Update): Promise<DatabaseResult<Row>> {
    const { data, error, status, statusText } = await this.buildUpdateQuery(id, params)

    if (isPostgrestError(error)) {
      errorLogger.error('Database update error', { error, table: this.table, id, params })
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    if (!this.isValidRow(data)) {
      const validationError = createError('Invalid data format')
      errorLogger.error('Database update validation error', { 
        error: validationError, 
        table: this.table, 
        id,
        params,
        data 
      })
      return {
        data: null,
        error: validationError,
        count: null,
        status: 400,
        statusText: 'Bad Request'
      }
    }

    return {
      data,
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
  async delete(id: string): Promise<DatabaseResult<Row>> {
    const { data, error, status, statusText } = await this.buildDeleteQuery(id)

    if (isPostgrestError(error)) {
      errorLogger.error('Database delete error', { error, table: this.table, id })
      return {
        data: null,
        error,
        count: null,
        status,
        statusText
      }
    }

    if (!this.isValidRow(data)) {
      const validationError = createError('Invalid data format')
      errorLogger.error('Database delete validation error', { 
        error: validationError, 
        table: this.table, 
        id,
        data 
      })
      return {
        data: null,
        error: validationError,
        count: null,
        status: 400,
        statusText: 'Bad Request'
      }
    }

    return {
      data,
      error: null,
      count: 1,
      status,
      statusText
    }
  }
} 