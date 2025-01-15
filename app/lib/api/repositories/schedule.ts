/**
 * Schedule Repository
 * Last Updated: 2025-01-15
 * 
 * This module provides database operations for schedules.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

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

    if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: CreateScheduleBody & { created_by?: string }) {
    const { data: schedule, error } = await this.supabase
      .from('schedules')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return schedule;
  }

  async update(id: string, data: UpdateScheduleBody & { updated_by?: string }) {
    const { data: schedule, error } = await this.supabase
      .from('schedules')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return schedule;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .gte('start_date', startDate.toISOString())
      .lte('end_date', endDate.toISOString());

    if (error) throw error;
    return data;
  }

  async findByStatus(status: ScheduleStatus) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('status', status);

    if (error) throw error;
    return data;
  }

  async findByCreator(createdBy: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('created_by', createdBy);

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: ScheduleStatus) {
    const { data: schedule, error } = await this.supabase
      .from('schedules')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return schedule;
  }

  async findOverlapping(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .or(`and(start_date,lte.${endDate.toISOString()},end_date,gte.${startDate.toISOString()})`);

    if (error) throw error;
    return data;
  }

  async findUpcoming(limit = 10) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }
} 