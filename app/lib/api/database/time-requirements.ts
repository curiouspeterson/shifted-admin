/**
 * Time Requirements Database Operations
 * Last Updated: 2024-03
 * 
 * This module provides type-safe database operations for the time_requirements table.
 * It includes:
 * - CRUD operations for time requirement records
 * - Error handling and type safety
 * - Query builders and filters
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../supabase/database.types';

type TimeRequirementRow = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementInsert = Database['public']['Tables']['time_requirements']['Insert'];
type TimeRequirementUpdate = Database['public']['Tables']['time_requirements']['Update'];

/**
 * Database Operation Result Type
 * Wraps database operation results with error handling
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Database Error Class
 * Custom error class for database operation failures
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: unknown
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
    column: keyof TimeRequirementRow;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  filter?: Partial<Record<keyof TimeRequirementRow, string | number | boolean>>;
}

/**
 * Time Requirements Database Operations Class
 * Provides type-safe database operations for the time_requirements table
 */
export class TimeRequirementsOperations {
  private readonly table = 'time_requirements';

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Find a single time requirement by ID
   */
  async findById(id: string): Promise<DatabaseResult<TimeRequirementRow>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching time requirement by ID:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch time requirement',
          500,
          error
        ),
      };
    }
  }

  /**
   * Find multiple time requirements with optional filtering and ordering
   */
  async findMany(options: QueryOptions = {}): Promise<DatabaseResult<TimeRequirementRow[]>> {
    try {
      let query = this.supabase.from(this.table).select();

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key as keyof TimeRequirementRow, value);
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

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching time requirements:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch time requirements',
          500,
          error
        ),
      };
    }
  }

  /**
   * Create a new time requirement
   */
  async create(data: TimeRequirementInsert): Promise<DatabaseResult<TimeRequirementRow>> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return { data: created, error: null };
    } catch (error) {
      console.error('Error creating time requirement:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to create time requirement',
          500,
          error
        ),
      };
    }
  }

  /**
   * Update an existing time requirement
   */
  async update(id: string, data: TimeRequirementUpdate): Promise<DatabaseResult<TimeRequirementRow>> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating time requirement:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to update time requirement',
          500,
          error
        ),
      };
    }
  }

  /**
   * Delete a time requirement
   */
  async delete(id: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting time requirement:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to delete time requirement',
          500,
          error
        ),
      };
    }
  }
} 