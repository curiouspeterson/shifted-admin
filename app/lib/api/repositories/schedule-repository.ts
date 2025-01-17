/**
 * Schedule Repository
 * Last Updated: 2025-01-15
 * 
 * This module provides database operations for schedules.
 * It extends the base repository with schedule-specific functionality.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../database/baseRepository';
import type { Database } from '@/lib/supabase/database.types';
import { DatabaseError } from '@/lib/errors';

// Schedule types from database schema
export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];
export type ScheduleStatus = Database['public']['Enums']['schedule_status_type'];

export interface ScheduleFilters {
  status?: ScheduleStatus;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

export class ScheduleRepository extends BaseRepository<Schedule> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'schedules');
  }

  /**
   * Find schedules by date range
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: true });

      if (error) {
        throw new DatabaseError(`Failed to find schedules by date range`, error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError(`Error finding schedules by date range`, error);
    }
  }

  /**
   * Find schedules by status
   */
  async findByStatus(status: ScheduleStatus): Promise<Schedule[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('start_date', { ascending: true });

      if (error) {
        throw new DatabaseError(`Failed to find schedules by status`, error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError(`Error finding schedules by status`, error);
    }
  }

  /**
   * Find schedules by creator
   */
  async findByCreator(userId: string): Promise<Schedule[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Failed to find schedules by creator`, error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError(`Error finding schedules by creator`, error);
    }
  }

  /**
   * Update schedule status
   */
  async updateStatus(
    id: string, 
    status: ScheduleStatus, 
    userId: string
  ): Promise<Schedule> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          status,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update schedule status`, error);
      }

      if (!data) {
        throw new DatabaseError(`Schedule not found`);
      }

      return data;
    } catch (error) {
      throw new DatabaseError(`Error updating schedule status`, error);
    }
  }

  /**
   * Find overlapping schedules
   */
  async findOverlapping(startDate: string, endDate: string): Promise<Schedule[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .order('start_date', { ascending: true });

      if (error) {
        throw new DatabaseError(`Failed to find overlapping schedules`, error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError(`Error finding overlapping schedules`, error);
    }
  }

  /**
   * Find upcoming schedules
   */
  async findUpcoming(limit: number = 5): Promise<Schedule[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) {
        throw new DatabaseError(`Failed to find upcoming schedules`, error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError(`Error finding upcoming schedules`, error);
    }
  }
} 