export type EmployeePosition = 'dispatcher' | 'shift_supervisor' | 'management'

export interface Employee {
  id: number
  user_id: string
  first_name: string
  last_name: string
  position: EmployeePosition
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Shift {
  id: number
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  crosses_midnight: boolean
  min_staff_count: number
  requires_supervisor: boolean
  created_at: string
}

export type ScheduleStatus = 'draft' | 'published'

export interface Schedule {
  id: number
  start_date: string
  end_date: string
  status: ScheduleStatus
  version: number
  is_active: boolean
  created_by: number
  published_by: number | null
  created_at: string
  published_at: string | null
}

export type OvertimeStatus = null | 'pending' | 'approved'

export interface ScheduleAssignment {
  id: number
  schedule_id: number
  employee_id: number
  shift_id: number
  date: string
  is_supervisor_shift: boolean
  overtime_hours: number | null
  overtime_status: OvertimeStatus
  created_at: string
  updated_at: string
}

export interface OvertimeHistory {
  id: number
  employee_id: number
  schedule_id: number
  week_start_date: string
  total_hours: number
  overtime_hours: number
  created_at: string
}

export type ShiftSwapStatus = 'pending' | 'approved' | 'denied'

export interface ShiftSwap {
  id: number
  offering_employee_id: number
  receiving_employee_id: number
  schedule_assignment_id: number
  status: ShiftSwapStatus
  requested_at: string
  approved_at: string | null
  manager_id: number | null
}

export type ActionType = 'override' | 'swap_approval' | 'schedule_change'
export type EntityType = 'schedule_assignment' | 'shift_swap'
export type OverrideType = 'forced_assignment' | 'availability_override'
export type ConstraintType = 'employee_availability' | 'maximum_hours'

export interface AuditLog {
  id: number
  action_type: ActionType
  entity_type: EntityType
  entity_id: number
  manager_id: number
  reason: string
  override_type: OverrideType | null
  constraint_type: ConstraintType | null
  created_at: string
}

// Helper type for schedule with assignments
export interface ScheduleWithAssignments extends Schedule {
  assignments: (ScheduleAssignment & {
    employee: Employee
    shift: Shift
  })[]
}

// Helper type for employee with schedule
export interface EmployeeWithSchedule extends Employee {
  assignments: (ScheduleAssignment & {
    schedule: Schedule
    shift: Shift
  })[]
}

// Helper type for shift swap with related data
export interface ShiftSwapWithDetails extends ShiftSwap {
  offering_employee: Employee
  receiving_employee: Employee
  schedule_assignment: ScheduleAssignment & {
    shift: Shift
  }
  manager?: Employee
} 