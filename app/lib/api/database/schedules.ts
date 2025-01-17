/**
 * Schedules Database Operations
 * Last Updated: 2024-03-21
 * 
 * Provides optimized database operations for schedules
 * with explicit column selection and type safety.
 */

import { SupabaseClient, PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { BaseRepository } from './base/repository';
import type { Database } from '@/lib/database/database.types';
import { DatabaseError } from '@/lib/errors';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

const DEFAULT_COLUMNS = [
  'id',
  'start_date',
  'end_date',
  'status',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'published_at',
  'published_by',
  'version',
  'is_active'
] as const;

export class SchedulesOperations extends BaseRepository<Schedule, ScheduleInsert, ScheduleUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'schedules');
  }

  protected getDefaultColumns(): Array<keyof Schedule> {
    return [...DEFAULT_COLUMNS];
  }

  async findById(id: string): Promise<DatabaseResult<Schedule>> {
    try {
      const response = await this.supabase
        .from(this.table)
        .select(this.getDefaultColumns().join(','))
        .eq('id', id)
        .single() as PostgrestSingleResponse<Schedule>;

      const { data, error } = response;

      if (error) {
        return {
          data: null,
          error: new DatabaseError(
            'Failed to fetch schedule by ID',
            { id, error }
          )
        };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new DatabaseError(
          'Failed to fetch schedule',
          { id, error }
        )
      };
    }
  }

  async create(data: ScheduleInsert): Promise<DatabaseResult<Schedule>> {
    try {
      const response = await this.supabase
        .from(this.table)
        .insert(data)
        .select(this.getDefaultColumns().join(','))
        .single() as PostgrestSingleResponse<Schedule>;

      const { data: created, error } = response;

      if (error) {
        return {
          data: null,
          error: new DatabaseError(
            'Failed to create schedule',
            { data, error }
          )
        };
      }

      if (!created) {
        return {
          data: null,
          error: new DatabaseError(
            'Failed to create schedule - no data returned',
            { data }
          )
        };
      }

      return { data: created, error: null };
    } catch (error) {
      return {
        data: null,
        error: new DatabaseError(
          'Failed to create schedule',
          { data, error }
        )
      };
    }
  }

  async update(id: string, data: ScheduleUpdate): Promise<DatabaseResult<Schedule>> {
    try {
      const response = await this.supabase
        .from(this.table)
        .update(data)
        .eq('id', id)
        .select(this.getDefaultColumns().join(','))
        .single() as PostgrestSingleResponse<Schedule>;

      const { data: updated, error } = response;

      if (error) {
        return {
          data: null,
          error: new DatabaseError(
            'Failed to update schedule',
            { id, data, error }
          )
        };
      }

      if (!updated) {
        return {
          data: null,
          error: new DatabaseError(
            'Failed to update schedule - no data returned',
            { id, data }
          )
        };
      }

      return { data: updated, error: null };
    } catch (error) {
      return {
        data: null,
        error: new DatabaseError(
          'Failed to update schedule',
          { id, data, error }
        )
      };
    }
  }

  async delete(id: string): Promise<DatabaseResult<Schedule>> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          data: null,
          error: new DatabaseError(
            'Failed to delete schedule',
            { id, error }
          )
        };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: new DatabaseError(
          'Failed to delete schedule',
          { id, error }
        )
      };
    }
  }
} 