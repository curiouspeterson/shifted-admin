/**
 * Scheduling Types Module
 * Last Updated: 2024
 * 
 * Defines TypeScript types and enums for the scheduling system.
 * These types extend the base database types with additional
 * type safety and business logic constraints.
 * 
 * Features:
 * - Schedule status management
 * - Shift pattern definitions
 * - Employee data structures
 * - Assignment tracking
 * - Scheduling rules
 */

import type { Database } from '@/lib/supabase/database.types';

/**
 * Shift Pattern Types
 * Defines the available patterns for employee shift scheduling
 */
export enum ShiftPatternType {
  FourTen = '4x10',           // Four 10-hour shifts
  ThreeTwelvePlusFour = '3x12plus4'  // Three 12-hour shifts plus one 4-hour shift
}

/**
 * Schedule Status Types
 * Defines the possible states of a schedule
 */
export enum ScheduleStatus {
  Draft = 'draft',           // Schedule is in draft mode, editable
  Published = 'published',   // Schedule is published, read-only
  Archived = 'archived'      // Schedule is archived, historical
}

/**
 * Employee Availability Type
 * Extends the database availability type with strict boolean flags
 */
export type EmployeeAvailability = Omit<
  Database['public']['Tables']['employee_availability']['Row'],
  'employee_id' | 'is_available'
> & {
  employee_id: string;
  is_available: boolean;
};

/**
 * Shift Type
 * Extends the database shift type with strict boolean flags
 */
export type Shift = Omit<
  Database['public']['Tables']['shifts']['Row'],
  'crosses_midnight' | 'requires_supervisor'
> & {
  crosses_midnight: boolean;
  requires_supervisor: boolean;
};

/**
 * Time-Based Requirement Type
 * Defines staffing requirements for specific time periods
 * 
 * @property id - Unique identifier
 * @property schedule_id - Associated schedule ID
 * @property start_time - Start time in HH:MM format
 * @property end_time - End time in HH:MM format
 * @property min_employees - Minimum required employees
 * @property max_employees - Maximum allowed employees (optional)
 * @property min_supervisors - Minimum required supervisors
 * @property day_of_week - Day of week (0-6, Sunday-Saturday)
 */
export type TimeBasedRequirement = {
  id: string;
  schedule_id: string;
  start_time: string;
  end_time: string;
  min_employees: number;
  max_employees: number | null;
  min_supervisors: number;
  day_of_week: number;
  created_at: string;
  updated_at: string;
};

/**
 * Schedule Type
 * Defines the structure of a work schedule
 * 
 * @property id - Unique identifier
 * @property status - Current schedule status
 * @property start_date - Schedule start date
 * @property end_date - Schedule end date
 * @property version - Schedule version number
 * @property is_active - Whether the schedule is active
 */
export type Schedule = {
  id: string;
  status: 'draft' | 'published' | 'archived';
  start_date: string;
  end_date: string;
  created_at: string | null;
  created_by: string | null;
  published_at?: string | null;
  published_by?: string | null;
  version: number;
  is_active: boolean;
};

/**
 * Employee Scheduling Rule Type
 * Defines scheduling preferences and constraints for an employee
 */
export type EmployeeSchedulingRule = Omit<
  Database['public']['Tables']['employee_scheduling_rules']['Row'],
  'created_at' | 'updated_at' | 'preferred_shift_pattern' | 'max_weekly_hours' | 'min_weekly_hours' | 'require_consecutive_days'
> & {
  created_at: string;
  updated_at: string;
  preferred_shift_pattern: ShiftPatternType;
  max_weekly_hours: number;
  min_weekly_hours: number;
  require_consecutive_days: boolean;
};

/**
 * Employee Type
 * Defines the structure of an employee record
 * 
 * @property id - Unique identifier
 * @property user_id - Associated user account ID
 * @property first_name - Employee's first name
 * @property last_name - Employee's last name
 * @property position - Employee's job position
 */
export type Employee = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: number | null;
  position: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Assignment Type
 * Defines a shift assignment linking an employee to a shift
 * 
 * @property id - Unique identifier
 * @property schedule_id - Associated schedule ID
 * @property employee_id - Assigned employee ID
 * @property shift_id - Assigned shift ID
 * @property date - Assignment date
 * @property is_supervisor_shift - Whether this is a supervisor shift
 */
export type Assignment = {
  id: string;
  schedule_id: string | null;
  employee_id: string | null;
  shift_id: string | null;
  date: string;
  is_supervisor_shift: boolean;
  overtime_hours: number | null;
  overtime_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  employee: Employee | null;
  shift: Shift | null;
};

/**
 * Schedule Input Type
 * Helper type for creating or updating schedules
 * 
 * @property name - Schedule name
 * @property start_date - Start date in YYYY-MM-DD format
 * @property end_date - End date in YYYY-MM-DD format
 * @property status - Optional schedule status
 * @property version - Optional version number
 * @property is_active - Optional active status
 */
export type ScheduleInput = {
  name: string;
  start_date: string;
  end_date: string;
  status?: ScheduleStatus;
  version?: number;
  is_active?: boolean;
}; 