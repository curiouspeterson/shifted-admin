/**
 * Schedules Database Operations
 * Last Updated: 2024
 * 
 * This module provides type-safe database operations for the schedules table.
 * It includes:
 * - CRUD operations for schedule records
 * - Error handling and type safety
 * - Query builders and filters
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../supabase/database.types';

type Tables = Database['public']['Tables'];
type ScheduleRow = Tables['schedules']['Row'];
type ScheduleInsert = Tables['schedules']['Insert'];
type ScheduleUpdate = Tables['schedules']['Update'];

/**
 * Database Operation Result Type
 * Wraps database operation results with error handling
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
}

/**
 * Database Error Class
 * Custom error class for database operation failures
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: PostgrestError | Error | unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Query Options Type
 * Configuration for database queries
 */
interface QueryOptions {
  orderBy?: {
    column: keyof ScheduleRow;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  filter?: Partial<Record<keyof ScheduleRow, string>>;
  include?: {
    assignments?: boolean;
    requirements?: boolean;
  };
}

/**
 * Schedules Database Operations Class
 * Provides type-safe database operations for the schedules table
 */
export class SchedulesOperations {
  private readonly table = 'schedules' as keyof Tables;

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Find a single schedule by ID
   */
  async findById(id: string, include?: QueryOptions['include']): Promise<DatabaseResult<ScheduleRow>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select(this.buildSelect(include))
        .eq('id', id)
        .single() as { data: ScheduleRow | null; error: PostgrestError | null };

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching schedule by ID:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch schedule',
          500,
          error
        ),
      };
    }
  }

  /**
   * Find multiple schedules with optional filtering and ordering
   */
  async findMany(options: QueryOptions = {}): Promise<DatabaseResult<ScheduleRow[]>> {
    try {
      let query = this.supabase
        .from(this.table)
        .select(this.buildSelect(options.include));

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query as { data: ScheduleRow[] | null; error: PostgrestError | null };

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch schedules',
          500,
          error
        ),
      };
    }
  }

  /**
   * Create a new schedule
   */
  async create(data: ScheduleInsert): Promise<DatabaseResult<ScheduleRow>> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.table)
        .insert(data)
        .select()
        .single() as { data: ScheduleRow | null; error: PostgrestError | null };

      if (error) throw error;

      return { data: created, error: null };
    } catch (error) {
      console.error('Error creating schedule:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to create schedule',
          500,
          error
        ),
      };
    }
  }

  /**
   * Update an existing schedule
   */
  async update(id: string, data: ScheduleUpdate): Promise<DatabaseResult<ScheduleRow>> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.table)
        .update(data)
        .eq('id', id)
        .select()
        .single() as { data: ScheduleRow | null; error: PostgrestError | null };

      if (error) throw error;

      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating schedule:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to update schedule',
          500,
          error
        ),
      };
    }
  }

  /**
   * Delete a schedule
   * Returns null on successful deletion
   */
  async delete(id: string): Promise<DatabaseResult<null>> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id', id) as { data: null; error: PostgrestError | null };

      if (error) throw error;

      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to delete schedule',
          500,
          error
        ),
      };
    }
  }

  /**
   * Build select query string based on include options
   */
  private buildSelect(include?: QueryOptions['include']): string {
    const parts = ['*'];

    if (include?.assignments) {
      parts.push('assignments(*)');
    }
    if (include?.requirements) {
      parts.push('requirements(*)');
    }

    return parts.join(',');
  }
} 