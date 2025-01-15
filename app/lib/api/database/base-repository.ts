/**
 * Base Repository
 * Last Updated: 2025-01-15
 * 
 * This module provides a base repository class with common database operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { DatabaseError } from '@/lib/errors';

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  pagination?: {
    page: number;
    perPage: number;
  };
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

export class BaseRepository<T extends BaseRecord> {
  protected readonly tableName: string;
  protected readonly supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  /**
   * Find a record by ID
   */
  async findById(id: string, options: Partial<QueryOptions> = {}): Promise<T | null> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id)
        .single();

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to find ${this.tableName} by ID`, error);
      }

      // Safely cast the response to T
      return data ? (data as unknown as T) : null;
    } catch (error) {
      throw new DatabaseError(`Error in findById for ${this.tableName}`, error);
    }
  }

  /**
   * Find all records matching the filters
   */
  async findAll(options: Partial<QueryOptions> = {}): Promise<T[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination
      if (options.pagination) {
        const { page, perPage } = options.pagination;
        const start = (page - 1) * perPage;
        query = query.range(start, start + perPage - 1);
      }

      // Apply sorting
      if (options.sorting) {
        const { column, direction } = options.sorting;
        query = query.order(column, { ascending: direction === 'asc' });
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to find ${this.tableName} records`, error);
      }

      // Safely cast the response array to T[]
      return data ? (data as unknown as T[]) : [];
    } catch (error) {
      throw new DatabaseError(`Error in findAll for ${this.tableName}`, error);
    }
  }

  /**
   * Count records matching the filters
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to count ${this.tableName} records`, error);
      }

      return count || 0;
    } catch (error) {
      throw new DatabaseError(`Error in count for ${this.tableName}`, error);
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const now = new Date().toISOString();
      const record = {
        ...data,
        created_at: now,
        updated_at: now,
      };

      const { data: created, error } = await this.supabase
        .from(this.tableName)
        .insert(record)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create ${this.tableName} record`, error);
      }

      if (!created) {
        throw new DatabaseError(`Failed to create ${this.tableName} record: No data returned`);
      }

      // Safely cast the created record to T
      return created as unknown as T;
    } catch (error) {
      throw new DatabaseError(`Error in create for ${this.tableName}`, error);
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const record = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error } = await this.supabase
        .from(this.tableName)
        .update(record)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update ${this.tableName} record`, error);
      }

      if (!updated) {
        throw new DatabaseError(`Failed to update ${this.tableName} record: No data returned`);
      }

      // Safely cast the updated record to T
      return updated as unknown as T;
    } catch (error) {
      throw new DatabaseError(`Error in update for ${this.tableName}`, error);
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete ${this.tableName} record`, error);
      }
    } catch (error) {
      throw new DatabaseError(`Error in delete for ${this.tableName}`, error);
    }
  }
} 