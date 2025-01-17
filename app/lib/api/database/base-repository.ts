/**
 * Base Repository Implementation
 * Last Updated: 2025-01-16
 * 
 * Provides type-safe database operations with query optimization
 * and performance monitoring.
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { DatabaseError } from '@/lib/errors';
import { errorLogger } from '@/lib/logging/error-logger';

// Type helpers
type Schema = Database['public'];
type Tables = Schema['Tables'];
type TableName = keyof Tables;
type Row<T extends TableName> = Tables[T]['Row'];

/**
 * Structured error details for consistent error handling
 */
interface ErrorDetails extends Record<string, unknown> {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  details?: unknown;
}

/**
 * Convert an Error to a structured error object
 */
function errorToRecord(error: Error): ErrorDetails {
  const details: ErrorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  if (error instanceof DatabaseError) {
    details.code = error.code;
    details.details = error.details;
  }

  return details;
}

/**
 * Create a database error with proper error object
 */
function createDatabaseError(message: string, cause: unknown): DatabaseError {
  const details = cause instanceof Error 
    ? errorToRecord(cause)
    : { name: 'UnknownError', message: String(cause) };
    
  return new DatabaseError(message, details);
}

/**
 * Type guard to check if a value is a PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return error !== null && 
         typeof error === 'object' && 
         'code' in error && 
         'message' in error &&
         'details' in error;
}

/**
 * Type guard to check if a value matches Row<T>
 */
function isRowType<T extends TableName>(value: unknown): value is Row<T> {
  return value !== null && 
         typeof value === 'object' &&
         'id' in value;
}

/**
 * Options for querying the database
 */
export interface QueryOptions<T extends TableName> {
  select?: Array<keyof Row<T>>;
  filters?: Record<string, FilterValue>;
  orderBy?: {
    column: keyof Row<T>;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

/**
 * Valid filter values for database queries
 */
type FilterValue = string | number | boolean | null | Array<string | number | boolean | null>;

/**
 * Type-safe database operation result
 */
interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
  details: ErrorDetails | null;
}

/**
 * Base repository class for database operations
 */
export abstract class BaseRepository<T extends TableName> {
  constructor(
    protected readonly supabase: SupabaseClient<Database>,
    protected readonly table: T
  ) {}

  /**
   * Convert column names to a select string
   */
  protected columnsToString(columns?: Array<keyof Row<T>>): string {
    if (!columns?.length) return '*';
    return columns.map(String).join(',');
  }

  /**
   * Find a record by ID
   */
  async findById(id: string, options: QueryOptions<T> = {}): Promise<DatabaseResult<Row<T>>> {
    if (!id) {
      const error = createDatabaseError('ID is required', new Error('Invalid ID'));
      return { 
        data: null, 
        error,
        details: errorToRecord(error)
      };
    }

    try {
      const selectStr = this.columnsToString(options.select);
      const { data, error } = await this.supabase
        .from(this.table)
        .select(selectStr)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!isRowType<T>(data)) {
        throw new Error('Invalid data format returned from database');
      }

      return {
        data,
        error: null,
        details: null
      };
    } catch (err) {
      const error = createDatabaseError(
        `Failed to find ${this.table} record by ID`,
        err
      );
      return {
        data: null,
        error,
        details: errorToRecord(error)
      };
    }
  }
} 