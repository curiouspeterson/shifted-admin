/**
 * Schedules Repository Implementation
 * Last Updated: 2024-01-16
 * 
 * Provides optimized database operations for schedules
 * with explicit column selection and type safety.
 */

import { SupabaseClient, PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { BaseRepository } from './base/repository';
import type { Database } from '@/lib/database/database.types';
import { DatabaseError } from '@/lib/errors/database';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

const DEFAULT_COLUMNS = [
  'id',
  'title',
  'description',
  'start_date',
  'end_date',
  'status',
  'metadata',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by'
] as const;

export class SchedulesRepository extends BaseRepository<Schedule, ScheduleInsert, ScheduleUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'schedules');
  }

  protected getDefaultColumns(): Array<keyof Schedule> {
    return [...DEFAULT_COLUMNS];
  }

  async findById(id: string): Promise<Schedule | null> {
    try {
      const response = await this.supabase
        .from(this.table)
        .select(this.getDefaultColumns().join(','))
        .eq('id', id)
        .single() as PostgrestSingleResponse<Schedule>;

      const { data, error } = response;

      if (error) {
        throw new DatabaseError(
          'Failed to fetch schedule by ID',
          error,
          { id }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to fetch schedule',
        error instanceof PostgrestError ? error : undefined,
        { id }
      );
    }
  }

  async create(data: ScheduleInsert): Promise<Schedule> {
    try {
      const response = await this.supabase
        .from(this.table)
        .insert(data)
        .select(this.getDefaultColumns().join(','))
        .single() as PostgrestSingleResponse<Schedule>;

      const { data: created, error } = response;

      if (error) {
        throw new DatabaseError(
          'Failed to create schedule',
          error,
          { data }
        );
      }

      if (!created) {
        throw new DatabaseError(
          'Failed to create schedule - no data returned',
          undefined,
          { data }
        );
      }

      return created;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to create schedule',
        error instanceof PostgrestError ? error : undefined,
        { data }
      );
    }
  }

  async update(id: string, data: ScheduleUpdate): Promise<Schedule> {
    try {
      const response = await this.supabase
        .from(this.table)
        .update(data)
        .eq('id', id)
        .select(this.getDefaultColumns().join(','))
        .single() as PostgrestSingleResponse<Schedule>;

      const { data: updated, error } = response;

      if (error) {
        throw new DatabaseError(
          'Failed to update schedule',
          error,
          { id, data }
        );
      }

      if (!updated) {
        throw new DatabaseError(
          'Failed to update schedule - no data returned',
          undefined,
          { id, data }
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to update schedule',
        error instanceof PostgrestError ? error : undefined,
        { id, data }
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          'Failed to delete schedule',
          error,
          { id }
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to delete schedule',
        error instanceof PostgrestError ? error : undefined,
        { id }
      );
    }
  }
} 