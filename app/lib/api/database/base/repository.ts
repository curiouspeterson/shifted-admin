/**
 * Base Repository Implementation
 * Last Updated: 2024-03-19
 * 
 * Provides type-safe database operations with query optimization
 * and performance monitoring.
 */

import { SupabaseClient, PostgrestError, PostgrestSingleResponse, PostgrestMaybeSingleResponse } from '@supabase/supabase-js';
import type { Database } from '@/lib/database/database.types';
import { DatabaseError } from '@/lib/errors/database';

type Schema = Database['public'];
type Tables = Schema['Tables'];
type TableName = keyof Tables;

/**
 * Strongly typed filter value that can be used in database queries
 */
type FilterValue = 
  | string 
  | number 
  | boolean 
  | null 
  | ReadonlyArray<string | number | boolean | null>;

/**
 * Type guard to check if a value is a PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return error !== null && 
         typeof error === 'object' && 
         'code' in error && 
         'message' in error &&
         'name' in error;
}

/**
 * Type guard to check if value is of type T
 */
function isArrayOfType<T extends Record<string, unknown>>(data: unknown): data is T[] {
  return Array.isArray(data) && data.every(item => item !== null && typeof item === 'object');
}

/**
 * Options for querying the database
 * @template T - The type of the table row
 */
export interface QueryOptions<T> {
  /** Columns to select */
  readonly select?: ReadonlyArray<keyof T>;
  /** Filters to apply */
  readonly filters?: Readonly<{
    [K in keyof T]?: FilterValue;
  }>;
  /** Ordering options */
  readonly orderBy?: Readonly<{
    column: keyof T;
    ascending?: boolean;
  }>;
  /** Maximum number of records to return */
  readonly limit?: number;
  /** Number of records to skip */
  readonly offset?: number;
}

/**
 * Base repository class for database operations
 * @template T - The type of rows in the table
 */
export abstract class BaseRepository<T extends Tables[TableName]['Row']> {
  constructor(
    protected readonly supabase: SupabaseClient<Database>,
    protected readonly table: TableName
  ) {}

  /**
   * Find multiple records with filtering and pagination
   * @returns Promise resolving to an array of records
   * @throws DatabaseError if the query fails
   */
  protected async findMany(options: Readonly<QueryOptions<T>> = {}): Promise<ReadonlyArray<T>> {
    const {
      select = this.getDefaultColumns(),
      filters = {},
      orderBy,
      limit,
      offset
    } = options;

    try {
      let query = this.supabase
        .from(this.table)
        .select(select.map(String).join(','));

      // Apply non-null filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(String(key), value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(String(orderBy.column), {
          ascending: orderBy.ascending ?? true
        });
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query as unknown as PostgrestSingleResponse<T[]>;

      if (error) {
        throw new DatabaseError(
          'Failed to fetch records',
          error,
          { table: this.table }
        );
      }

      if (!data || !isArrayOfType<T>(data)) {
        return [];
      }

      return Object.freeze(data);

    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to execute findMany query',
        isPostgrestError(error) ? error : undefined,
        { table: this.table }
      );
    }
  }

  /**
   * Get default columns to select if none specified
   * Override in derived classes for table-specific defaults
   */
  protected abstract getDefaultColumns(): ReadonlyArray<keyof T>;
} 