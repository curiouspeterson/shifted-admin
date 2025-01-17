/**
 * Schedule Repository
 * Last Updated: 2025-01-17
 * 
 * This module provides database operations for schedules.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { Errors } from '@/lib/errors/types';

export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];
export type ScheduleStatus = 'draft' | 'published' | 'archived';

export type CreateScheduleBody = Omit<ScheduleInsert, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
export type UpdateScheduleBody = Partial<CreateScheduleBody>;

export interface ScheduleFilters {
  status?: ScheduleStatus;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
}

export class ScheduleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findMany(filters: ScheduleFilters = {}) {
    let query = this.supabase
      .from('schedules')
      .select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate.toISOString());
    }

    if (typeof filters.createdBy === 'string' && filters.createdBy.trim() !== '') {
      query = query.eq('created_by', filters.createdBy);
    }

    const { data, error } = await query;

    if (error) {
      throw Errors.database('Failed to fetch schedules', { error });
    }

    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw Errors.notFound('Schedule not found', { id });
      }
      throw Errors.database('Failed to fetch schedule', { error });
    }

    return data;
  }

  async create(data: CreateScheduleBody) {
    const { data: schedule, error } = await this.supabase
      .from('schedules')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw Errors.database('Failed to create schedule', { error });
    }

    return schedule;
  }

  async update(id: string, data: UpdateScheduleBody) {
    const { data: schedule, error } = await this.supabase
      .from('schedules')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw Errors.notFound('Schedule not found', { id });
      }
      throw Errors.database('Failed to update schedule', { error });
    }

    return schedule;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw Errors.notFound('Schedule not found', { id });
      }
      throw Errors.database('Failed to delete schedule', { error });
    }

    return true;
  }
} 