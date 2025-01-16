/**
 * Assignment Type Mapper
 * Last Updated: 2024-01-15
 * 
 * Handles type mapping between domain and database types for assignments.
 */

import { Database } from '@/lib/database/database.types'

type AssignmentTable = 'assignments'
type AssignmentRow = Database['public']['Tables'][AssignmentTable]['Row']
type AssignmentInsert = Database['public']['Tables'][AssignmentTable]['Insert']
type AssignmentUpdate = Database['public']['Tables'][AssignmentTable]['Update']

export interface Assignment {
  id: string
  scheduleId: string
  employeeId: string
  shiftId: string
  startTime: string
  endTime: string
  notes: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  version: number
}

export interface AssignmentInput {
  scheduleId: string
  employeeId: string
  shiftId: string
  startTime: string
  endTime: string
  notes?: string | null
}

/**
 * Converts domain assignment data to database format
 */
export function toDbAssignment(data: AssignmentInput): AssignmentInsert {
  return {
    schedule_id: data.scheduleId,
    employee_id: data.employeeId,
    shift_id: data.shiftId,
    start_time: data.startTime,
    end_time: data.endTime,
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  }
}

/**
 * Converts database assignment data to domain format
 */
export function toDomainAssignment(data: AssignmentRow): Assignment {
  return {
    id: data.id,
    scheduleId: data.schedule_id,
    employeeId: data.employee_id,
    shiftId: data.shift_id,
    startTime: data.start_time,
    endTime: data.end_time,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    version: data.version
  }
} 