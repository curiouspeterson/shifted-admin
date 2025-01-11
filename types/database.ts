import { Database } from '@/lib/database.types'

type DB = Database['public']['Tables']

// Make certain fields required in EmployeeAvailability
export type EmployeeAvailability = Omit<DB['employee_availability']['Row'], 'employee_id' | 'is_available'> & {
  employee_id: string
  is_available: boolean
}

// Make certain fields required in Shift
export type Shift = Omit<DB['shifts']['Row'], 'crosses_midnight' | 'requires_supervisor'> & {
  crosses_midnight: boolean
  requires_supervisor: boolean
}

// Make certain fields required in TimeBasedRequirement
export type TimeBasedRequirement = Omit<DB['time_based_requirements']['Row'], 'created_at' | 'crosses_midnight' | 'is_active' | 'updated_at'> & {
  created_at: string
  crosses_midnight: boolean
  is_active: boolean
  updated_at: string
}

// Make certain fields required in Schedule
export type Schedule = Omit<DB['schedules']['Row'], 'is_active'> & {
  is_active: boolean
}

// Make certain fields required in EmployeeSchedulingRule
export type EmployeeSchedulingRule = Omit<DB['employee_scheduling_rules']['Row'], 'created_at' | 'updated_at' | 'require_consecutive_days' | 'max_weekly_hours' | 'min_weekly_hours'> & {
  created_at: string
  updated_at: string
  require_consecutive_days: boolean
  max_weekly_hours: number
  min_weekly_hours: number
}

// Make certain fields required in Employee
export type Employee = Omit<DB['employees']['Row'], 'is_active'> & {
  is_active: boolean
}

// Make certain fields required in ScheduleAssignment
export type ScheduleAssignment = Omit<DB['schedule_assignments']['Row'], 'employee_id' | 'schedule_id'> & {
  employee_id: string
  schedule_id: string
}

// Enums that aren't properly generated
export enum ShiftPatternType {
  FourTenHour = '4x10',
  ThreeTwelvePlusFour = '3x12plus4'
}

export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived'
}

// Helper type for schedule creation/updates
export type ScheduleInput = Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'version'> 