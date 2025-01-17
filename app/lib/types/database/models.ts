/**
 * Database Domain Models
 * Last Updated: 2025-03-19
 * 
 * Defines the domain models that map to database tables.
 * These types add business logic and type safety on top of raw database types.
 */

import type { Database } from '@/lib/types/supabase'
import type { Json } from '@/lib/types/utils/json'

type Tables = Database['public']['Tables']

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

// Employee Types
export type Employee = Tables['employees']['Row'] & {
  full_name: string // Computed field
  metadata?: Json
}

export type CreateEmployeeInput = Omit<
  Tables['employees']['Insert'],
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'metadata'
>

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>

// Schedule Types
export type Schedule = Tables['schedules']['Row'] & {
  metadata?: Json
}

export type CreateScheduleInput = Omit<
  Tables['schedules']['Insert'],
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'metadata'
>

export type UpdateScheduleInput = Partial<CreateScheduleInput>

// Assignment Types
export type Assignment = Tables['schedule_assignments']['Row'] & {
  employee: Employee
  schedule: Schedule
  metadata?: Json
}

export type CreateAssignmentInput = Omit<
  Tables['schedule_assignments']['Insert'],
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'metadata'
>

export type UpdateAssignmentInput = Partial<CreateAssignmentInput>

// Shift Types
export type Shift = Tables['shifts']['Row'] & {
  metadata?: Json
  duration_hours: number // Computed field
  crosses_midnight: boolean // Computed field
}

export type CreateShiftInput = Omit<
  Tables['shifts']['Insert'],
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'metadata'
>

export type UpdateShiftInput = Partial<CreateShiftInput>

// Type Guards
export function isEmployee(value: unknown): value is Employee {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'first_name' in value &&
    'last_name' in value &&
    'email' in value &&
    'is_active' in value
  )
}

export function isSchedule(value: unknown): value is Schedule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value &&
    'start_date' in value &&
    'end_date' in value
  )
}

export function isAssignment(value: unknown): value is Assignment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'employee_id' in value &&
    'schedule_id' in value &&
    'shift_id' in value
  )
}

export function isShift(value: unknown): value is Shift {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'start_time' in value &&
    'end_time' in value &&
    'min_staff_count' in value &&
    'requires_supervisor' in value
  )
} 