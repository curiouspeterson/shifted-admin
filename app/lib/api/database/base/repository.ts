/**
 * Base Repository Implementation
 * Last Updated: 2024-01-16
 * 
 * Provides type-safe database operations with query optimization
 * and performance monitoring.
 */

import { SupabaseClient, PostgrestError, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from '@/lib/database/database.types';
import { DatabaseError } from '@/lib/errors/database';

export interface QueryOptions<T extends Record<string, any>> {
  select?: Array<keyof T>;  // Explicit column selection
  filters?: Partial<T>;
  orderBy?: {
    column: keyof T;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

export type TableName = keyof Database['public']['Tables'];

export abstract class BaseRepository<
  T extends Database['public']['Tables'][TableName]['Row'],
  TInsert extends Database['public']['Tables'][TableName]['Insert'] = T,
  TUpdate extends Database['public']['Tables'][TableName]['Update'] = Partial<T>
> {
  protected readonly supabase: SupabaseClient<Database>;
  protected readonly table: TableName;

  constructor(supabase: SupabaseClient<Database>, table: TableName) {
    this.supabase = supabase;
    this.table = table;
  }

  protected async findMany(options: QueryOptions<T> = {}): Promise<T[]> {
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
        .select(select.join(','));

      // Apply non-null filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column as string, {
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

      const response = await query as PostgrestResponse<T>;
      const { data, error } = response;

      if (error) {
        throw new DatabaseError(
          'Failed to fetch records',
          error,
          { table: this.table }
        );
      }

      if (!data) {
        return [];
      }

      // Safe type assertion since we've verified the data
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to execute findMany query',
        error instanceof PostgrestError ? error : undefined,
        { table: this.table }
      );
    }
  }

  /**
   * Get default columns to select if none specified
   * Override in derived classes for table-specific defaults
   */
  protected getDefaultColumns(): Array<keyof T> {
    // Default to essential columns to avoid SELECT *
    return ['id', 'created_at', 'updated_at'] as Array<keyof T>;
  }
} 