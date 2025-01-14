/**
 * Database Operations Module
 * Last Updated: 2024
 * 
 * This module provides a type-safe wrapper around Supabase database operations.
 * It includes:
 * - CRUD operations for database tables
 * - Error handling and type safety
 * - Query builders and filters
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

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
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

/**
 * Database Operations Class
 * Provides type-safe database operations for a specific table
 */
export class DatabaseOperations<T extends TableName> {
  constructor(
    private table: T,
    private supabase: SupabaseClient<Database>
  ) {}

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<DatabaseResult<Tables[T]['Row']>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .eq('id' as keyof Tables[T]['Row'], id)
        .single();

      if (error) throw error;

      return { data: data as Tables[T]['Row'], error: null };
    } catch (error) {
      console.error(`Error fetching ${this.table} by ID:`, error);
      return {
        data: null,
        error: new DatabaseError(
          `Failed to fetch ${this.table}`,
          500,
          error
        ),
      };
    }
  }

  /**
   * Find multiple records with optional filtering and ordering
   */
  async findMany(options: QueryOptions = {}): Promise<DatabaseResult<Tables[T]['Row'][]>> {
    try {
      let query = this.supabase.from(this.table).select('*');

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column as keyof Tables[T]['Row'], {
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

      return { data: data as Tables[T]['Row'][], error: null };
    } catch (error) {
      console.error(`Error fetching ${this.table}:`, error);
      return {
        data: null,
        error: new DatabaseError(
          `Failed to fetch ${this.table}`,
          500,
          error
        ),
      };
    }
  }

  /**
   * Create a new record
   */
  async create(data: Tables[T]['Insert']): Promise<DatabaseResult<Tables[T]['Row']>> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.table)
        .insert(data)
        .select('*')
        .single();

      if (error) throw error;

      return { data: created as Tables[T]['Row'], error: null };
    } catch (error) {
      console.error(`Error creating ${this.table}:`, error);
      return {
        data: null,
        error: new DatabaseError(
          `Failed to create ${this.table}`,
          500,
          error
        ),
      };
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Tables[T]['Update']): Promise<DatabaseResult<Tables[T]['Row']>> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.table)
        .update(data)
        .eq('id' as keyof Tables[T]['Row'], id)
        .select('*')
        .single();

      if (error) throw error;

      return { data: updated as Tables[T]['Row'], error: null };
    } catch (error) {
      console.error(`Error updating ${this.table}:`, error);
      return {
        data: null,
        error: new DatabaseError(
          `Failed to update ${this.table}`,
          500,
          error
        ),
      };
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id' as keyof Tables[T]['Row'], id);

      if (error) throw error;

      return { data: null, error: null };
    } catch (error) {
      console.error(`Error deleting ${this.table}:`, error);
      return {
        data: null,
        error: new DatabaseError(
          `Failed to delete ${this.table}`,
          500,
          error
        ),
      };
    }
  }
} 