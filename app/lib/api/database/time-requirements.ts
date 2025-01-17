/**
 * Time Requirements Database Operations
 * Last Updated: 2025-01-17
 * 
 * Database operations for managing time-based staffing requirements.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { DatabaseResult, QueryOptions } from '@/lib/api/types';

type TimeRequirement = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementInsert = Database['public']['Tables']['time_requirements']['Insert'];
type TimeRequirementUpdate = Database['public']['Tables']['time_requirements']['Update'];

export class TimeRequirementsOperations {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Find a time requirement by ID
   */
  async findById(id: string): Promise<DatabaseResult<TimeRequirement>> {
    try {
      const { data, error } = await this.supabase
        .from('time_requirements')
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Find multiple time requirements based on query options
   */
  async findMany(options: QueryOptions): Promise<DatabaseResult<TimeRequirement[]>> {
    try {
      let query = this.supabase
        .from('time_requirements')
        .select('*');

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply sorting
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new time requirement
   */
  async create(data: TimeRequirementInsert): Promise<DatabaseResult<TimeRequirement>> {
    try {
      const { data: created, error } = await this.supabase
        .from('time_requirements')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return { data: created, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update an existing time requirement
   */
  async update(id: string, data: TimeRequirementUpdate): Promise<DatabaseResult<TimeRequirement>> {
    try {
      const { data: updated, error } = await this.supabase
        .from('time_requirements')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: updated, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a time requirement
   */
  async delete(id: string): Promise<DatabaseResult<TimeRequirement>> {
    try {
      const { data: deleted, error } = await this.supabase
        .from('time_requirements')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: deleted, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
} 