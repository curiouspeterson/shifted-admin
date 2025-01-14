import type { Database } from '../supabase/database.types'

// Base database types
type Tables = Database['public']['Tables']

// Enums
export enum ShiftPatternType {
  FourTenHour = '4x10',
  ThreeTwelvePlusFour = '3x12plus4'
}

export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived'
}

export enum OvertimeStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

export enum EmployeePosition {
  Dispatcher = 'dispatcher',
  ShiftSupervisor = 'shift_supervisor',
  Management = 'management'
}

// Domain types with required fields
export type Employee = Tables['employees']['Row'] & {
  is_active: boolean;
}

export type TimeOffRequest = Tables['time_off_requests']['Row']

export type EmployeeAvailability = Tables['employee_availability']['Row'] & {
  is_available: boolean;
  employee_id: string;
}

// Helper types for operations
export type ScheduleInput = {
  name: string;
  start_date: string;
  end_date: string;
  status?: ScheduleStatus;
  version?: number;
  is_active?: boolean;
}

// Type guards
export function isEmployee(value: unknown): value is Employee {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'first_name' in value &&
    'last_name' in value &&
    'position' in value &&
    'is_active' in value
  )
}

export function isTimeOffRequest(value: unknown): value is TimeOffRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'employee_id' in value &&
    'start_date' in value &&
    'end_date' in value &&
    'request_type' in value &&
    'status' in value
  )
} 