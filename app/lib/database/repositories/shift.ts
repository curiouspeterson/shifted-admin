/**
 * Shift Repository Implementation
 * Last Updated: 2024-03-19 16:35 PST
 * 
 * This file implements the shift-specific repository operations.
 * It extends the base repository and adds custom methods for shift management.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../base/repository';
import { DatabaseResult, QueryFilters, DatabaseRecord } from '../base/types';
import { Shift } from '@/lib/schemas/base/shift';
import { createTransactionManager } from '../base/transaction';

/**
 * Shift-specific query filters
 */
export interface ShiftFilters extends QueryFilters {
  startTime?: string;
  endTime?: string;
  duration?: number;
  type?: string;
}

/**
 * Shift repository implementation
 */
export class ShiftRepository extends BaseRepository<Shift> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'shifts');
  }

  /**
   * Find shifts with custom filters
   */
  async findShifts(filters?: ShiftFilters): Promise<DatabaseResult<Shift[]>> {
    try {
      let query = this.supabase.from(this.tableName).select('*');

      if (filters) {
        const { startTime, endTime, duration, type, ...baseFilters } = filters;

        // Apply specific filters
        if (startTime) {
          query = query.gte('start_time', startTime);
        }
        if (endTime) {
          query = query.lte('end_time', endTime);
        }
        if (duration) {
          query = query.eq('duration', duration);
        }
        if (type) {
          query = query.eq('type', type);
        }

        // Apply base filters
        if (baseFilters.limit) query = query.limit(baseFilters.limit);
        if (baseFilters.offset) {
          query = query.range(
            baseFilters.offset,
            baseFilters.offset + (baseFilters.limit || 10) - 1
          );
        }
        if (baseFilters.orderBy) {
          query = query.order(baseFilters.orderBy, {
            ascending: baseFilters.orderDirection !== 'desc',
          });
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return this.handleError<Shift[]>(error);
    }
  }

  /**
   * Check for shift overlaps
   */
  async checkOverlap(
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('id')
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data: data.length > 0, error: null };
    } catch (error) {
      return this.handleError<boolean>(error);
    }
  }

  /**
   * Get shifts with staffing requirements
   */
  async getShiftWithRequirements(id: string): Promise<DatabaseResult<Shift & { requirements: any[] }>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          requirements:shift_requirements (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error(`Shift with id ${id} not found`);
      }

      return { data, error: null };
    } catch (error) {
      return this.handleError<Shift & { requirements: any[] }>(error);
    }
  }

  /**
   * Update shift requirements
   */
  async updateRequirements(
    id: string,
    requirements: { min_staff: number; supervisor_required: boolean }
  ): Promise<DatabaseResult<Shift>> {
    const transactionManager = createTransactionManager(this.supabase);

    try {
      return await transactionManager.transaction(async () => {
        // Update shift requirements
        const { error: requirementsError } = await this.supabase
          .from('shift_requirements')
          .upsert({
            shift_id: id,
            ...requirements,
          });

        if (requirementsError) throw requirementsError;

        // Get updated shift with requirements
        const { data, error } = await this.getShiftWithRequirements(id);
        if (error) throw error;

        return { data, error: null };
      });
    } catch (error) {
      return this.handleError<Shift>(error);
    }
  }
} 