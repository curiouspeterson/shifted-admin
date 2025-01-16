/**
 * Shift Type Mapper
 * Last Updated: 2024-01-15
 * 
 * Handles conversion between domain shift types and database types.
 */

import { Database } from '../database.types'
import { Shift, ShiftInput } from '../schemas/shift'

type ShiftTable = Database['public']['Tables']['shifts']
type DbShift = ShiftTable['Row']
type DbShiftInsert = ShiftTable['Insert']
type DbShiftUpdate = ShiftTable['Update']

/**
 * Convert domain shift to database format
 */
export function toDbShift(shift: ShiftInput): DbShiftInsert
export function toDbShift(shift: Shift): DbShift
export function toDbShift(shift: ShiftInput | Shift): DbShiftInsert | DbShift {
  return {
    id: 'id' in shift ? shift.id : undefined,
    schedule_id: shift.scheduleId,
    employee_id: shift.employeeId,
    start_time: shift.startTime,
    end_time: shift.endTime,
    break_duration: shift.breakDuration,
    notes: shift.notes,
    status: shift.status,
    is_active: shift.isActive,
    created_at: 'createdAt' in shift ? shift.createdAt : undefined,
    updated_at: 'updatedAt' in shift ? shift.updatedAt : undefined,
    created_by: 'createdBy' in shift ? shift.createdBy : undefined,
    updated_by: 'updatedBy' in shift ? shift.updatedBy : undefined,
    published_at: 'publishedAt' in shift ? shift.publishedAt : undefined,
    published_by: 'publishedBy' in shift ? shift.publishedBy : undefined,
    completed_at: 'completedAt' in shift ? shift.completedAt : undefined,
    completed_by: 'completedBy' in shift ? shift.completedBy : undefined,
    cancelled_at: 'cancelledAt' in shift ? shift.cancelledAt : undefined,
    cancelled_by: 'cancelledBy' in shift ? shift.cancelledBy : undefined,
    version: 'version' in shift ? shift.version : undefined
  }
}

/**
 * Convert database shift to domain format
 */
export function toDomainShift(dbShift: DbShift): Shift {
  return {
    id: dbShift.id,
    scheduleId: dbShift.schedule_id,
    employeeId: dbShift.employee_id,
    startTime: dbShift.start_time,
    endTime: dbShift.end_time,
    breakDuration: dbShift.break_duration,
    notes: dbShift.notes,
    status: dbShift.status as Shift['status'],
    isActive: dbShift.is_active,
    createdAt: dbShift.created_at!,
    updatedAt: dbShift.updated_at,
    createdBy: dbShift.created_by!,
    updatedBy: dbShift.updated_by,
    publishedAt: dbShift.published_at,
    publishedBy: dbShift.published_by,
    completedAt: dbShift.completed_at,
    completedBy: dbShift.completed_by,
    cancelledAt: dbShift.cancelled_at,
    cancelledBy: dbShift.cancelled_by,
    version: dbShift.version
  }
}

/**
 * Convert domain shift to database update format
 */
export function toDbShiftUpdate(shift: Partial<ShiftInput>): DbShiftUpdate {
  return {
    schedule_id: shift.scheduleId,
    employee_id: shift.employeeId,
    start_time: shift.startTime,
    end_time: shift.endTime,
    break_duration: shift.breakDuration,
    notes: shift.notes,
    status: shift.status,
    is_active: shift.isActive
  }
} 