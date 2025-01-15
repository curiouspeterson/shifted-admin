/**
 * Assignment Repository Implementation
 * Last Updated: 2024-03-19 16:25 PST
 * 
 * This file implements the assignment-specific repository operations.
 * It extends the base repository and adds custom methods for assignment management.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../base/repository';
import { DatabaseResult, QueryFilters, DatabaseRecord } from '../base/types';
import { Assignment } from '@/lib/schemas/base/assignment';
import { createTransactionManager } from '../base/transaction';

/**
 * Assignment-specific query filters
 */
export interface AssignmentFilters extends QueryFilters {
  scheduleId?: string;
  employeeId?: string;
  date?: string;
  shiftId?: string;
}

/**
 * Assignment repository implementation
 */
export class AssignmentRepository extends BaseRepository<Assignment> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'assignments');
  }

  /**
   * Find assignments with custom filters
   */
  async findAssignments(filters?: AssignmentFilters): Promise<DatabaseResult<Assignment[]>> {
    try {
      let query = this.supabase.from(this.tableName).select('*');

      if (filters) {
        const { scheduleId, employeeId, date, shiftId, ...baseFilters } = filters;

        // Apply specific filters
        if (scheduleId) {
          query = query.eq('schedule_id', scheduleId);
        }
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        if (date) {
          query = query.eq('date', date);
        }
        if (shiftId) {
          query = query.eq('shift_id', shiftId);
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
      return this.handleError<Assignment[]>(error);
    }
  }

  /**
   * Create multiple assignments in a transaction
   */
  async createBatch(
    assignments: Omit<Assignment, keyof DatabaseRecord>[]
  ): Promise<DatabaseResult<Assignment[]>> {
    const transactionManager = createTransactionManager(this.supabase);

    try {
      return await transactionManager.transaction(async () => {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .insert(assignments)
          .select();

        if (error) throw error;
        if (!data) throw new Error('Failed to create assignments');

        return { data, error: null };
      });
    } catch (error) {
      return this.handleError<Assignment[]>(error);
    }
  }

  /**
   * Update multiple assignments in a transaction
   */
  async updateBatch(
    updates: { id: string; data: Partial<Assignment> }[]
  ): Promise<DatabaseResult<Assignment[]>> {
    const transactionManager = createTransactionManager(this.supabase);

    try {
      return await transactionManager.transaction(async () => {
        const results: Assignment[] = [];

        for (const { id, data } of updates) {
          const { data: updated, error } = await this.update(id, data);
          if (error) throw error;
          if (!updated) throw new Error(`Failed to update assignment ${id}`);
          results.push(updated);
        }

        return { data: results, error: null };
      });
    } catch (error) {
      return this.handleError<Assignment[]>(error);
    }
  }

  /**
   * Delete multiple assignments in a transaction
   */
  async deleteBatch(ids: string[]): Promise<DatabaseResult<void>> {
    const transactionManager = createTransactionManager(this.supabase);

    try {
      return await transactionManager.transaction(async () => {
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .in('id', ids);

        if (error) throw error;
        return { data: null, error: null };
      });
    } catch (error) {
      return this.handleError<void>(error);
    }
  }

  /**
   * Check for assignment conflicts
   */
  async checkConflicts(
    employeeId: string,
    date: string,
    shiftId: string,
    excludeId?: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .eq('shift_id', shiftId);

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
} 