/**
 * Employee Repository Implementation
 * Last Updated: 2024-03-19 16:30 PST
 * 
 * This file implements the employee-specific repository operations.
 * It extends the base repository and adds custom methods for employee management.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../base/repository';
import { DatabaseResult, QueryFilters, DatabaseRecord } from '../base/types';
import { Employee, EmployeePosition } from '@/lib/schemas/base/employee';
import { createTransactionManager } from '../base/transaction';

/**
 * Employee-specific query filters
 */
export interface EmployeeFilters extends QueryFilters {
  isActive?: boolean;
  position?: EmployeePosition;
  searchTerm?: string;
}

/**
 * Employee repository implementation
 */
export class EmployeeRepository extends BaseRepository<Employee> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'employees');
  }

  /**
   * Find employees with custom filters
   */
  async findEmployees(filters?: EmployeeFilters): Promise<DatabaseResult<Employee[]>> {
    try {
      let query = this.supabase.from(this.tableName).select('*');

      if (filters) {
        const { isActive, position, searchTerm, ...baseFilters } = filters;

        // Apply specific filters
        if (typeof isActive === 'boolean') {
          query = query.eq('is_active', isActive);
        }
        if (position) {
          query = query.eq('position', position);
        }
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
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
      return this.handleError<Employee[]>(error);
    }
  }

  /**
   * Soft delete an employee
   */
  async softDelete(id: string): Promise<DatabaseResult<Employee>> {
    return this.update(id, { is_active: false });
  }

  /**
   * Reactivate an employee
   */
  async reactivate(id: string): Promise<DatabaseResult<Employee>> {
    return this.update(id, { is_active: true });
  }

  /**
   * Update employee position
   */
  async updatePosition(
    id: string,
    position: EmployeePosition,
    effectiveDate: string
  ): Promise<DatabaseResult<Employee>> {
    const transactionManager = createTransactionManager(this.supabase);

    try {
      return await transactionManager.transaction(async () => {
        // Update current position
        const { data: updated, error } = await this.update(id, {
          position,
          position_effective_date: effectiveDate,
        });

        if (error) throw error;
        if (!updated) throw new Error(`Failed to update employee ${id}`);

        // Log position history
        const { error: historyError } = await this.supabase
          .from('employee_position_history')
          .insert({
            employee_id: id,
            position,
            effective_date: effectiveDate,
          });

        if (historyError) throw historyError;

        return { data: updated, error: null };
      });
    } catch (error) {
      return this.handleError<Employee>(error);
    }
  }

  /**
   * Get employee with their current assignments
   */
  async getEmployeeWithAssignments(
    id: string,
    startDate?: string,
    endDate?: string
  ): Promise<DatabaseResult<Employee & { assignments: any[] }>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          assignments!inner (
            *,
            shift:shifts (*)
          )
        `)
        .eq('id', id);

      if (startDate) {
        query = query.gte('assignments.date', startDate);
      }
      if (endDate) {
        query = query.lte('assignments.date', endDate);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      if (!data) {
        throw new Error(`Employee with id ${id} not found`);
      }

      return { data, error: null };
    } catch (error) {
      return this.handleError<Employee & { assignments: any[] }>(error);
    }
  }

  /**
   * Get employee availability for a date range
   */
  async getAvailability(
    id: string,
    startDate: string,
    endDate: string
  ): Promise<DatabaseResult<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('employee_availability')
        .select('*')
        .eq('employee_id', id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return this.handleError<any[]>(error);
    }
  }
} 