/**
 * Type Definitions for Employee Scheduling System
 * Last Updated: 2024
 * 
 * This file contains all the core type definitions used throughout the scheduling system.
 * It defines the shape of database entities and helper types for combining related data.
 */

/**
 * Valid employee positions within the organization
 */
export type EmployeePosition = 'dispatcher' | 'shift_supervisor' | 'management'

/**
 * Represents an employee in the system
 */
export interface Employee {
  id: number                  // Unique employee ID
  user_id: string            // Associated auth user ID
  first_name: string         
  last_name: string
  position: EmployeePosition // Current role/position
  default_shift_id?: number  // Optional preferred default shift
  email: string             // Contact email
  is_active: boolean        // Whether employee is currently active
  created_at: string        // Timestamp of record creation
  updated_at: string        // Timestamp of last update
}

/**
 * Represents a shift template that can be assigned
 */
export interface Shift {
  id: number
  name: string              // Display name for the shift
  start_time: string        // Daily start time (HH:mm format)
  end_time: string          // Daily end time (HH:mm format)
  duration_hours: number    // Length of shift in hours
  crosses_midnight: boolean // Whether shift spans across midnight
  min_staff_count: number  // Minimum required staff for this shift
  requires_supervisor: boolean // Whether a supervisor must be present
  created_at: string
}

/**
 * Possible states for a schedule
 */
export type ScheduleStatus = 'draft' | 'published'

/**
 * Represents a complete schedule for a date range
 */
export interface Schedule {
  id: number
  start_date: string        // Start date of schedule period
  end_date: string         // End date of schedule period
  status: ScheduleStatus   // Current state of schedule
  version: number         // Tracks schedule revisions
  is_active: boolean      // Whether this is the active version
  created_by: number      // Employee ID of creator
  published_by: number | null // Employee ID of publisher (if published)
  created_at: string
  published_at: string | null // When schedule was published
}

/**
 * Status of overtime requests
 */
export type OvertimeStatus = null | 'pending' | 'approved'

/**
 * Represents a single shift assignment within a schedule
 */
export interface ScheduleAssignment {
  id: number
  schedule_id: number      // Reference to parent schedule
  employee_id: number      // Assigned employee
  shift_id: number        // Assigned shift template
  date: string           // Specific date of assignment
  is_supervisor_shift: boolean // Whether this is a supervisor role
  overtime_hours: number | null // Additional hours beyond normal
  overtime_status: OvertimeStatus // State of overtime request
  created_at: string
  updated_at: string
}

/**
 * Tracks overtime accumulation per employee per week
 */
export interface OvertimeHistory {
  id: number
  employee_id: number
  schedule_id: number
  week_start_date: string  // Start of the tracking week
  total_hours: number     // Total hours worked
  overtime_hours: number  // Hours exceeding standard time
  created_at: string
}

/**
 * Possible states for shift swap requests
 */
export type ShiftSwapStatus = 'pending' | 'approved' | 'denied'

/**
 * Represents a request to exchange shifts between employees
 */
export interface ShiftSwap {
  id: number
  offering_employee_id: number   // Employee giving up shift
  receiving_employee_id: number  // Employee taking shift
  schedule_assignment_id: number // Shift being swapped
  status: ShiftSwapStatus      // Current state of request
  requested_at: string         // When request was made
  approved_at: string | null   // When request was processed
  manager_id: number | null    // Manager who handled request
}

/**
 * Types of actions that can be audited
 */
export type ActionType = 'override' | 'swap_approval' | 'schedule_change' | 'user_deletion'

/**
 * Types of entities that can be affected
 */
export type EntityType = 'schedule_assignment' | 'shift_swap'

/**
 * Types of manual overrides
 */
export type OverrideType = 'forced_assignment' | 'availability_override'

/**
 * Types of constraints that can be overridden
 */
export type ConstraintType = 'employee_availability' | 'maximum_hours'

/**
 * Tracks system actions for accountability
 */
export interface AuditLog {
  id: number
  action_type: ActionType
  entity_type: EntityType
  entity_id: number
  manager_id: number
  reason: string              // Justification for action
  override_type: OverrideType | null
  constraint_type: ConstraintType | null
  created_at: string
}

/**
 * Helper Types
 * These types combine base entities with their related data for convenient access
 */

/**
 * Schedule with expanded assignment details
 */
export interface ScheduleWithAssignments extends Schedule {
  assignments: (ScheduleAssignment & {
    employee: Employee
    shift: Shift
  })[]
}

/**
 * Employee with their schedule assignments
 */
export interface EmployeeWithSchedule extends Employee {
  assignments: (ScheduleAssignment & {
    schedule: Schedule
    shift: Shift
  })[]
}

/**
 * Shift swap with all related entity details
 */
export interface ShiftSwapWithDetails extends ShiftSwap {
  offering_employee: Employee
  receiving_employee: Employee
  schedule_assignment: ScheduleAssignment & {
    shift: Shift
  }
  manager?: Employee
}

/**
 * Employee with their default shift details
 */
export interface EmployeeWithDefaultShift extends Employee {
  default_shift?: Shift
}