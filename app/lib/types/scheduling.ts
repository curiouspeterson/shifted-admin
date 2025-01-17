/**
 * Scheduling Types Module
 * Last Updated: 2024-03-21
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

import type { Database } from '@/lib/database/database.types';

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
 * Defines when an employee is available for work
 */
export type EmployeeAvailability = {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
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
 * Extends the database time requirement type
 */
export type TimeBasedRequirement = Database['public']['Tables']['time_requirements']['Row'];

/**
 * Schedule Type
 * Extends the database schedule type
 */
export type Schedule = Database['public']['Tables']['schedules']['Row'];

/**
 * Employee Scheduling Rule Type
 * Defines scheduling preferences and constraints for an employee
 */
export type EmployeeSchedulingRule = {
  id: string;
  employee_id: string;
  preferred_shift_pattern: ShiftPatternType;
  max_weekly_hours: number;
  min_weekly_hours: number;
  require_consecutive_days: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
};

/**
 * Employee Type
 * Extends the database employee type
 */
export type Employee = Database['public']['Tables']['employees']['Row'];

/**
 * Assignment Type
 * Extends the database assignment type with employee and shift relations
 */
export type Assignment = Database['public']['Tables']['schedule_assignments']['Row'] & {
  employee: Employee | null;
  shift: Shift | null;
};

/**
 * Schedule Input Type
 * Helper type for creating or updating schedules
 */
export type ScheduleInput = {
  name: string;
  start_date: string;
  end_date: string;
  status?: ScheduleStatus;
  version?: number;
  is_active?: boolean;
}; 