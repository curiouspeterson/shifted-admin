/**
 * Core Types Module
 * Last Updated: 2024
 * 
 * Defines core TypeScript types and type guards for the application.
 * This module serves as a central location for common types used
 * across the application, including enums, domain types, and type guards.
 * 
 * Features:
 * - Database type extensions
 * - Domain-specific enums
 * - Type guard functions
 * - Helper types for operations
 */

import type { Database } from '../supabase/database.types'

/**
 * Base Database Types
 * Type alias for public database tables
 */
type Tables = Database['public']['Tables']

/**
 * Shift Pattern Types
 * Defines the available patterns for employee shift scheduling
 */
export enum ShiftPatternType {
  FourTenHour = '4x10',           // Four 10-hour shifts
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
 * Overtime Status Types
 * Defines the possible states of an overtime request
 */
export enum OvertimeStatus {
  Pending = 'pending',     // Overtime request awaiting approval
  Approved = 'approved',   // Overtime request approved
  Rejected = 'rejected'    // Overtime request rejected
}

/**
 * Employee Position Types
 * Defines the available employee positions
 */
export enum EmployeePosition {
  Dispatcher = 'dispatcher',         // Regular dispatcher
  ShiftSupervisor = 'shift_supervisor', // Shift supervisor
  Management = 'management'          // Management position
}

/**
 * Employee Type
 * Extends the base employee table type with required active status
 */
export type Employee = Tables['employees']['Row'] & {
  is_active: boolean;
}

/**
 * Time Off Request Type
 * Direct mapping of the time off requests table type
 */
export type TimeOffRequest = Tables['time_off_requests']['Row']

/**
 * Employee Availability Type
 * Extends the base availability table type with required fields
 */
export type EmployeeAvailability = Tables['employee_availability']['Row'] & {
  is_available: boolean;
  employee_id: string;
}

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
}

/**
 * Employee Type Guard
 * Validates that an unknown value matches the Employee type structure
 * 
 * @param value - Value to check
 * @returns True if value matches Employee type
 */
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

/**
 * Time Off Request Type Guard
 * Validates that an unknown value matches the TimeOffRequest type structure
 * 
 * @param value - Value to check
 * @returns True if value matches TimeOffRequest type
 */
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