/**
 * Shifts Database Operations
 * Last Updated: 2024-03
 * 
 * This module provides type-safe database operations for the shifts table.
 * It includes:
 * - CRUD operations for shift records
 * - Error handling and type safety
 * - Query builders and filters
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../supabase/database.types';

type Tables = Database['public']['Tables'];
type ShiftRow = Tables['shifts']['Row'];
type ShiftInsert = Tables['shifts']['Insert'];
type ShiftUpdate = Tables['shifts']['Update'];

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
    column: keyof ShiftRow;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

/**
 * Shifts Database Operations Class
 * Provides type-safe database operations for the shifts table
 */
export class ShiftsOperations {
  private readonly table = 'shifts';

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Find a single shift by ID
   */
  async findById(id: string): Promise<DatabaseResult<ShiftRow>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching shift by ID:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch shift',
          500,
          error
        ),
      };
    }
  }

  /**
   * Find multiple shifts with optional filtering and ordering
   */
  async findMany(options: QueryOptions = {}): Promise<DatabaseResult<ShiftRow[]>> {
    try {
      let query = this.supabase.from(this.table).select();

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
      console.error('Error fetching shifts:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch shifts',
          500,
          error
        ),
      };
    }
  }

  /**
   * Create a new shift
   */
  async create(data: ShiftInsert): Promise<DatabaseResult<ShiftRow>> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return { data: created, error: null };
    } catch (error) {
      console.error('Error creating shift:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to create shift',
          500,
          error
        ),
      };
    }
  }

  /**
   * Update an existing shift
   */
  async update(id: string, data: ShiftUpdate): Promise<DatabaseResult<ShiftRow>> {
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
      console.error('Error updating shift:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to update shift',
          500,
          error
        ),
      };
    }
  }

  /**
   * Delete a shift
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
      console.error('Error deleting shift:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to delete shift',
          500,
          error
        ),
      };
    }
  }
} 