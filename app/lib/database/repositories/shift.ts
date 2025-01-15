/**
 * Shift Repository Implementation
 * Last Updated: 2024-03-20
 * 
 * This file implements the shift-specific repository operations.
 * It extends the base repository and adds custom methods for shift management.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../base/repository';
import { DatabaseResult, QueryFilters } from '../base/types';
import { Shift } from '@/lib/schemas/base/shift';
import { ShiftRequirements, ShiftRequirementsInput } from '@/lib/schemas/base/shift-requirements';
import { TransactionManager } from '../base/transaction';
import { DatabaseError, ErrorCodes } from '../base/errors';

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
 * Extended shift type with requirements
 */
export interface ShiftWithRequirements extends Shift {
  requirements: ShiftRequirements[];
}

/**
 * Shift repository implementation
 */
export class ShiftRepository extends BaseRepository<Shift> {
  private readonly transactionManager: TransactionManager;

  constructor(supabase: SupabaseClient) {
    super('shifts');
    this.transactionManager = new TransactionManager(supabase);
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
          // Duration filter logic here
          query = query.or(`end_time.diff.minutes.${duration},start_time.diff.minutes.${duration}`);
        }
        if (type) {
          query = query.eq('type', type);
        }

        // Apply base filters
        if (baseFilters.limit) {
          query = query.limit(baseFilters.limit);
        }
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

      return { data: data as Shift[], error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new DatabaseError(
            ErrorCodes.UNKNOWN,
            error.message,
            { originalError: error }
          )
        };
      }
      return {
        data: null,
        error: new DatabaseError(
          ErrorCodes.UNKNOWN,
          'An unknown error occurred',
          { originalError: error }
        )
      };
    }
  }

  /**
   * Check for overlapping shifts
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
        .or(`and(start_time.gte.${startTime},start_time.lt.${endTime}),and(end_time.gt.${startTime},end_time.lte.${endTime})`);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data: data.length > 0, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new DatabaseError(
            ErrorCodes.UNKNOWN,
            error.message,
            { originalError: error }
          )
        };
      }
      return {
        data: null,
        error: new DatabaseError(
          ErrorCodes.UNKNOWN,
          'An unknown error occurred',
          { originalError: error }
        )
      };
    }
  }

  /**
   * Get shift with its requirements
   */
  async getShiftWithRequirements(id: string): Promise<DatabaseResult<ShiftWithRequirements>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          requirements:shift_requirements(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { 
        data: data as ShiftWithRequirements,
        error: null 
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new DatabaseError(
            ErrorCodes.UNKNOWN,
            error.message,
            { originalError: error }
          )
        };
      }
      return {
        data: null,
        error: new DatabaseError(
          ErrorCodes.UNKNOWN,
          'An unknown error occurred',
          { originalError: error }
        )
      };
    }
  }

  /**
   * Update shift requirements
   */
  async updateRequirements(
    id: string,
    requirements: ShiftRequirementsInput
  ): Promise<DatabaseResult<ShiftWithRequirements>> {
    return this.transactionManager.transaction(async (supabase: SupabaseClient) => {
      try {
        // Update or create requirements
        const { data: requirementsData, error: requirementsError } = await supabase
          .from('shift_requirements')
          .upsert({
            ...requirements,
            shift_id: id,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (requirementsError) throw requirementsError;

        // Get updated shift with requirements
        const result = await this.getShiftWithRequirements(id);
        if (result.error) throw result.error;

        return result;
      } catch (error) {
        if (error instanceof Error) {
          return {
            data: null,
            error: new DatabaseError(
              ErrorCodes.UNKNOWN,
              error.message,
              { originalError: error }
            )
          };
        }
        return {
          data: null,
          error: new DatabaseError(
            ErrorCodes.UNKNOWN,
            'An unknown error occurred',
            { originalError: error }
          )
        };
      }
    });
  }
} 