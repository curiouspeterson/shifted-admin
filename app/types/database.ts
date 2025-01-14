/**
 * Database Types Module
 * Last Updated: 2024
 * 
 * This module defines TypeScript types and enums that map to our database schema.
 * It extends the auto-generated database types with additional type safety and
 * business logic constraints.
 * 
 * Key Features:
 * - Type-safe database schema mapping
 * - Custom enums for domain-specific values
 * - Extended types with proper boolean and date handling
 * - Input/output type definitions for database operations
 */

import { Database } from '@/lib/database.types';

/**
 * Defines the available shift patterns for employee scheduling
 * 
 * @enum {string}
 * @property FourTenHour - 4 days per week, 10 hours per day
 * @property ThreeTwelvePlusFour - 3 days of 12 hours plus 1 day of 4 hours
 */
export enum ShiftPatternType {
  FourTenHour = '4x10',
  ThreeTwelvePlusFour = '3x12plus4'
}

/**
 * Defines the possible states of a schedule
 * 
 * @enum {string}
 * @property Draft - Schedule is in draft mode, editable
 * @property Published - Schedule is published and visible to employees
 * @property Archived - Schedule is archived and read-only
 */
export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived'
}

/**
 * Employee availability record with proper boolean typing
 * Maps to employee_availability table
 * 
 * @extends Database['public']['Tables']['employee_availability']['Row']
 * @property is_available - Whether the employee is available during this time
 * @property employee_id - Foreign key reference to employees table
 */
export type EmployeeAvailability = Omit<Database['public']['Tables']['employee_availability']['Row'], 'is_available' | 'employee_id'> & {
  is_available: boolean;
  employee_id: string;
};

/**
 * Shift template definition with proper boolean typing
 * Maps to shifts table
 * 
 * @extends Database['public']['Tables']['shifts']['Row']
 * @property crosses_midnight - Whether the shift spans across midnight
 * @property requires_supervisor - Whether a supervisor must be assigned
 */
export type Shift = Omit<Database['public']['Tables']['shifts']['Row'], 'crosses_midnight' | 'requires_supervisor'> & {
  crosses_midnight: boolean;
  requires_supervisor: boolean;
};

/**
 * Time-based staffing requirement with proper date and boolean typing
 * Maps to time_based_requirements table
 * 
 * @extends Database['public']['Tables']['time_based_requirements']['Row']
 * @property created_at - ISO timestamp of creation
 * @property crosses_midnight - Whether the requirement spans across midnight
 * @property is_active - Whether the requirement is currently active
 * @property updated_at - ISO timestamp of last update
 */
export type TimeBasedRequirement = Omit<Database['public']['Tables']['time_based_requirements']['Row'], 'created_at' | 'crosses_midnight' | 'is_active' | 'updated_at'> & {
  created_at: string;
  crosses_midnight: boolean;
  is_active: boolean;
  updated_at: string;
};

/**
 * Schedule record with proper boolean and enum typing
 * Maps to schedules table
 * 
 * @extends Database['public']['Tables']['schedules']['Row']
 * @property is_active - Whether the schedule is currently active
 * @property status - Current status of the schedule
 */
export type Schedule = Omit<Database['public']['Tables']['schedules']['Row'], 'is_active' | 'status'> & {
  is_active: boolean;
  status: ScheduleStatus;
};

/**
 * Employee scheduling rules with proper typing for all fields
 * Maps to employee_scheduling_rules table
 * 
 * @extends Database['public']['Tables']['employee_scheduling_rules']['Row']
 * @property created_at - ISO timestamp of creation
 * @property updated_at - ISO timestamp of last update
 * @property max_weekly_hours - Maximum allowed hours per week
 * @property min_weekly_hours - Minimum required hours per week
 * @property preferred_shift_pattern - Preferred shift pattern for scheduling
 * @property require_consecutive_days - Whether consecutive days are required
 */
export type EmployeeSchedulingRule = Omit<Database['public']['Tables']['employee_scheduling_rules']['Row'], 
  'created_at' | 'updated_at' | 'max_weekly_hours' | 'min_weekly_hours' | 'preferred_shift_pattern' | 'require_consecutive_days'
> & {
  created_at: string;
  updated_at: string;
  max_weekly_hours: number;
  min_weekly_hours: number;
  preferred_shift_pattern: ShiftPatternType;
  require_consecutive_days: boolean;
};

/**
 * Employee record with proper boolean typing
 * Maps to employees table
 * 
 * @extends Database['public']['Tables']['employees']['Row']
 * @property is_active - Whether the employee is currently active
 */
export type Employee = Omit<Database['public']['Tables']['employees']['Row'], 'is_active'> & {
  is_active: boolean;
};

/**
 * Schedule assignment record with proper ID typing
 * Maps to schedule_assignments table
 * 
 * @extends Database['public']['Tables']['schedule_assignments']['Row']
 * @property employee_id - Foreign key reference to employees table
 * @property schedule_id - Foreign key reference to schedules table
 */
export type ScheduleAssignment = Omit<Database['public']['Tables']['schedule_assignments']['Row'], 'employee_id' | 'schedule_id'> & {
  employee_id: string;
  schedule_id: string;
};

/**
 * Input type for creating or updating schedules
 * Omits auto-generated and system-managed fields
 * 
 * @extends Schedule
 * @property assignments - Optional array of schedule assignments
 */
export type ScheduleInput = Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'version'> & {
  assignments?: ScheduleAssignment[];
}; 