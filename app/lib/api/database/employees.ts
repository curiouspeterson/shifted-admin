/**
 * Employees Database Operations
 * Last Updated: 2024-03
 * 
 * This module provides type-safe database operations for the employees table.
 * It includes:
 * - CRUD operations for employee records
 * - Error handling and type safety
 * - Query builders and filters
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../supabase/database.types';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

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
    column: keyof EmployeeRow;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  filter?: Partial<Record<keyof EmployeeRow, string | number>>;
}

/**
 * Employees Database Operations Class
 * Provides type-safe database operations for the employees table
 */
export class EmployeesOperations {
  private readonly table = 'employees';

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Find a single employee by ID
   */
  async findById(id: string): Promise<DatabaseResult<EmployeeRow>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching employee by ID:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch employee',
          500,
          error
        ),
      };
    }
  }

  /**
   * Find an employee by user ID
   */
  async findByUserId(userId: string): Promise<DatabaseResult<EmployeeRow>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select()
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching employee by user ID:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch employee',
          500,
          error
        ),
      };
    }
  }

  /**
   * Find multiple employees with optional filtering and ordering
   */
  async findMany(options: QueryOptions = {}): Promise<DatabaseResult<EmployeeRow[]>> {
    try {
      let query = this.supabase.from(this.table).select();

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key as keyof EmployeeRow, value);
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
      console.error('Error fetching employees:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch employees',
          500,
          error
        ),
      };
    }
  }

  /**
   * Create a new employee
   */
  async create(data: EmployeeInsert): Promise<DatabaseResult<EmployeeRow>> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return { data: created, error: null };
    } catch (error) {
      console.error('Error creating employee:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to create employee',
          500,
          error
        ),
      };
    }
  }

  /**
   * Update an existing employee
   */
  async update(id: string, data: EmployeeUpdate): Promise<DatabaseResult<EmployeeRow>> {
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
      console.error('Error updating employee:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to update employee',
          500,
          error
        ),
      };
    }
  }

  /**
   * Delete an employee
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
      console.error('Error deleting employee:', error);
      return {
        data: null,
        error: new DatabaseError(
          'Failed to delete employee',
          500,
          error
        ),
      };
    }
  }
} 