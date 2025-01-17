/**
 * Type Mapping Module
 * Last Updated: 2025-01-16
 * 
 * Provides type-safe mapping functions for database operations.
 * Includes runtime validation and type guards.
 */

import type { Database } from '../database.types'

export type TableName = keyof Database['public']['Tables']
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row']
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert']
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update']

// Enum types
export type EmployeeRole = Database['public']['Enums']['employee_role']
export type EmployeeStatus = Database['public']['Enums']['employee_status']
export type ScheduleStatus = Database['public']['Enums']['schedule_status']
export type OvertimeStatus = Database['public']['Enums']['overtime_status']

/**
 * Type guard to check if a value is a valid employee role
 */
export function isValidEmployeeRole(value: unknown): value is EmployeeRole {
  return typeof value === 'string' && ['employee', 'supervisor', 'admin'].includes(value);
}

/**
 * Type guard to check if a value is a valid employee status
 */
export function isValidEmployeeStatus(value: unknown): value is EmployeeStatus {
  return typeof value === 'string' && ['active', 'inactive'].includes(value);
}

/**
 * Type guard to check if a value is a valid schedule status
 */
export function isValidScheduleStatus(value: unknown): value is ScheduleStatus {
  return typeof value === 'string' && ['draft', 'published', 'archived'].includes(value);
}

/**
 * Type guard to check if a value is a valid overtime status
 */
export function isValidOvertimeStatus(value: unknown): value is OvertimeStatus {
  return value === null || (typeof value === 'string' && ['pending', 'approved', 'rejected'].includes(value));
}

/**
 * Type guard to check if a value is a valid database row
 */
export function isValidRow<T extends TableName>(tableName: T, data: unknown): data is Row<T> {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Common fields all rows should have
  const row = data as Record<string, unknown>
  if (
    typeof row.id !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string'
  ) {
    return false
  }

  // Table-specific validation
  switch (tableName) {
    case 'employees':
      return (
        typeof row.first_name === 'string' &&
        typeof row.last_name === 'string' &&
        typeof row.email === 'string' &&
        (row.phone === null || typeof row.phone === 'string') &&
        isValidEmployeeRole(row.role) &&
        isValidEmployeeStatus(row.status)
      )
    case 'shifts':
      return (
        typeof row.title === 'string' &&
        typeof row.start_time === 'string' &&
        typeof row.end_time === 'string' &&
        typeof row.duration_minutes === 'number'
      )
    case 'assignments':
      return (
        typeof row.schedule_id === 'string' &&
        typeof row.employee_id === 'string' &&
        typeof row.shift_id === 'string' &&
        typeof row.date === 'string'
      )
    default:
      return true
  }
}

/**
 * Type guard to check if a value is a valid insert payload
 */
export function isValidInsert<T extends TableName>(tableName: T, data: unknown): data is Insert<T> {
  if (!data || typeof data !== 'object') {
    return false
  }

  const insert = data as Record<string, unknown>

  // Table-specific validation
  switch (tableName) {
    case 'employees':
      return (
        typeof insert.first_name === 'string' &&
        typeof insert.last_name === 'string' &&
        typeof insert.email === 'string' &&
        (insert.phone === undefined || insert.phone === null || typeof insert.phone === 'string') &&
        (insert.role === undefined || isValidEmployeeRole(insert.role)) &&
        (insert.status === undefined || isValidEmployeeStatus(insert.status))
      )
    case 'shifts':
      return (
        typeof insert.title === 'string' &&
        typeof insert.start_time === 'string' &&
        typeof insert.end_time === 'string' &&
        typeof insert.duration_minutes === 'number'
      )
    case 'assignments':
      return (
        typeof insert.schedule_id === 'string' &&
        typeof insert.employee_id === 'string' &&
        typeof insert.shift_id === 'string' &&
        typeof insert.date === 'string'
      )
    default:
      return true
  }
}

/**
 * Type guard to check if a value is a valid update payload
 */
export function isValidUpdate<T extends TableName>(tableName: T, data: unknown): data is Update<T> {
  if (!data || typeof data !== 'object') {
    return false
  }

  const update = data as Record<string, unknown>

  // Ensure no id/timestamps are being updated
  if ('id' in update || 'created_at' in update) {
    return false
  }

  // Table-specific validation
  switch (tableName) {
    case 'employees':
      return Object.entries(update).every(([key, value]) => {
        switch (key) {
          case 'first_name':
          case 'last_name':
          case 'email':
            return typeof value === 'string'
          case 'role':
            return value === undefined || isValidEmployeeRole(value)
          case 'status':
            return value === undefined || isValidEmployeeStatus(value)
          case 'phone':
            return value === null || typeof value === 'string'
          case 'metadata':
            return value === null || typeof value === 'object'
          default:
            return false
        }
      })
    case 'shifts':
      return Object.entries(update).every(([key, value]) => {
        switch (key) {
          case 'title':
          case 'start_time':
          case 'end_time':
            return typeof value === 'string'
          case 'duration_minutes':
            return typeof value === 'number'
          case 'metadata':
            return value === null || typeof value === 'object'
          default:
            return false
        }
      })
    default:
      return true
  }
}

/**
 * Helper function to safely cast database response to row type
 * Throws error if validation fails
 */
export function asRow<T extends TableName>(tableName: T, data: unknown): Row<T> {
  if (!isValidRow(tableName, data)) {
    throw new Error(`Invalid ${tableName} row data`)
  }
  return data
}

/**
 * Helper function to safely cast database response to insert type
 * Throws error if validation fails
 */
export function asInsert<T extends TableName>(tableName: T, data: unknown): Insert<T> {
  if (!isValidInsert(tableName, data)) {
    throw new Error(`Invalid ${tableName} insert data`)
  }
  return data
}

/**
 * Helper function to safely cast database response to update type
 * Throws error if validation fails
 */
export function asUpdate<T extends TableName>(tableName: T, data: unknown): Update<T> {
  if (!isValidUpdate(tableName, data)) {
    throw new Error(`Invalid ${tableName} update data`)
  }
  return data
} 