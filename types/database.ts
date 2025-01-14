/**
 * Database Type Definitions and Enhancements
 * Last Updated: 2024
 * 
 * This file contains type definitions that extend and enhance the auto-generated
 * Supabase database types. It enforces stricter type safety by making certain
 * fields required and provides additional type utilities for the scheduling system.
 * 
 * Key Features:
 * - Enforces required fields that may be optional in the database
 * - Defines scheduling-specific enums
 * - Provides helper types for data input/manipulation
 * - Ensures type safety across the application
 */

import { Database } from '@/lib/database.types'

// Base type for accessing table definitions
type DB = Database['public']['Tables']

/**
 * Employee availability preferences and constraints
 * Enforces employee_id and is_available as required fields
 */
export type EmployeeAvailability = Omit<DB['employee_availability']['Row'], 'employee_id' | 'is_available'> & {
  employee_id: string
  is_available: boolean
}

/**
 * Shift definition with required boolean flags
 * Represents a template for schedulable work periods
 */
export type Shift = Omit<DB['shifts']['Row'], 'crosses_midnight' | 'requires_supervisor'> & {
  crosses_midnight: boolean
  requires_supervisor: boolean
}

/**
 * Time-based staffing requirements
 * Enforces timestamp fields and boolean flags as required
 */
export type TimeBasedRequirement = Omit<DB['time_based_requirements']['Row'], 'created_at' | 'crosses_midnight' | 'is_active' | 'updated_at'> & {
  created_at: string
  crosses_midnight: boolean
  is_active: boolean
  updated_at: string
}

/**
 * Schedule definition with required active status
 * Represents a complete work schedule for a time period
 */
export type Schedule = Omit<DB['schedules']['Row'], 'is_active'> & {
  is_active: boolean
}

/**
 * Employee scheduling rules and constraints
 * Enforces required fields for scheduling preferences
 */
export type EmployeeSchedulingRule = Omit<DB['employee_scheduling_rules']['Row'], 'created_at' | 'updated_at' | 'require_consecutive_days' | 'max_weekly_hours' | 'min_weekly_hours'> & {
  created_at: string
  updated_at: string
  require_consecutive_days: boolean
  max_weekly_hours: number
  min_weekly_hours: number
}

/**
 * Employee record with required active status
 * Core employee information used throughout the system
 */
export type Employee = Omit<DB['employees']['Row'], 'is_active'> & {
  is_active: boolean
}

/**
 * Schedule assignment linking employees to shifts
 * Enforces required foreign key relationships
 */
export type ScheduleAssignment = Omit<DB['schedule_assignments']['Row'], 'employee_id' | 'schedule_id'> & {
  employee_id: string
  schedule_id: string
}

/**
 * Supported shift patterns for scheduling
 * Defines standard work patterns that can be assigned
 */
export enum ShiftPatternType {
  /** Four 10-hour shifts per week */
  FourTenHour = '4x10',
  /** Three 12-hour shifts plus one 4-hour shift */
  ThreeTwelvePlusFour = '3x12plus4'
}

/**
 * Possible states for a schedule
 * Tracks the lifecycle of a schedule from creation to archival
 */
export enum ScheduleStatus {
  /** Initial state, schedule is being created/modified */
  Draft = 'draft',
  /** Schedule is active and visible to employees */
  Published = 'published',
  /** Schedule is no longer active but preserved for records */
  Archived = 'archived'
}

/**
 * Helper type for creating/updating schedules
 * Omits system-managed fields that shouldn't be manually set
 */
export type ScheduleInput = Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'version'> 