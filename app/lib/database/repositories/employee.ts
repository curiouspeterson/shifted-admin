/**
 * Employee Repository Implementation
 * Last Updated: 2024-03-20
 * 
 * This file implements the employee-specific repository operations.
 * It extends the base repository and adds custom methods for employee management.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../base/repository';
import { DatabaseResult, QueryFilters } from '../base/types';
import { Employee, EmployeePosition } from '@/lib/schemas/base/employee';
import { Assignment } from '@/lib/schemas/base/assignment';
import { TransactionManager } from '../base/transaction';
import { DatabaseError, ErrorCodes } from '../base/errors';

/**
 * Employee-specific query filters
 */
export interface EmployeeFilters extends QueryFilters {
  isActive?: boolean;
  position?: EmployeePosition;
  searchTerm?: string;
}

/**
 * Employee availability type
 */
export interface EmployeeAvailability {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}

/**
 * Extended employee type with assignments
 */
export interface EmployeeWithAssignments extends Employee {
  assignments: Assignment[];
}

/**
 * Employee repository implementation
 */
export class EmployeeRepository extends BaseRepository<Employee> {
  private readonly transactionManager: TransactionManager;

  constructor(supabase: SupabaseClient) {
    super('employees');
    this.transactionManager = new TransactionManager(supabase);
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

      return { data: data as Employee[], error: null };
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
   * Soft delete an employee
   */
  async softDelete(id: string): Promise<DatabaseResult<Employee>> {
    return this.transactionManager.transaction(async (supabase: SupabaseClient) => {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return { data: data as Employee, error: null };
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

  /**
   * Reactivate a soft-deleted employee
   */
  async reactivate(id: string): Promise<DatabaseResult<Employee>> {
    return this.transactionManager.transaction(async (supabase: SupabaseClient) => {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return { data: data as Employee, error: null };
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

  /**
   * Update employee position with history tracking
   */
  async updatePosition(
    id: string,
    position: EmployeePosition,
    effectiveDate: string
  ): Promise<DatabaseResult<Employee>> {
    return this.transactionManager.transaction(async (supabase: SupabaseClient) => {
      try {
        // Record position history
        const { error: historyError } = await supabase
          .from('employee_position_history')
          .insert({
            employee_id: id,
            position,
            effective_date: effectiveDate,
          });

        if (historyError) throw historyError;

        // Update current position
        const { data, error } = await supabase
          .from(this.tableName)
          .update({
            position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return { data: data as Employee, error: null };
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

  /**
   * Get employee with their assignments
   */
  async getEmployeeWithAssignments(
    id: string,
    startDate?: string,
    endDate?: string
  ): Promise<DatabaseResult<EmployeeWithAssignments>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          assignments:assignments(*)
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

      return { 
        data: data as EmployeeWithAssignments,
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
   * Get employee availability for a date range
   */
  async getAvailability(
    id: string,
    startDate: string,
    endDate: string
  ): Promise<DatabaseResult<EmployeeAvailability[]>> {
    try {
      const { data, error } = await this.supabase
        .from('employee_availability')
        .select('*')
        .eq('employee_id', id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      return { 
        data: data as EmployeeAvailability[],
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
} 