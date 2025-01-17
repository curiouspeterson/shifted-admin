/**
 * Database Mappers Module
 * Last Updated: 2025-01-16
 * 
 * Provides type-safe mapping functions for database entities.
 * Includes runtime type validation and error handling.
 */
 
import type { Database } from '@/lib/database/database.types';
import type { 
  Employee, 
  Assignment, 
  Shift, 
  TimeBasedRequirement, 
  Schedule,
  ScheduleStatus 
} from '@/lib/types/scheduling';

// Database Types
export type DbEmployee = Database['public']['Tables']['employees']['Row'];
export type DbShift = Database['public']['Tables']['shifts']['Row'];
export type DbAssignment = Database['public']['Tables']['assignments']['Row'];
export type DbSchedule = Database['public']['Tables']['schedules']['Row'];
export type DbRequirement = Database['public']['Tables']['time_requirements']['Row'];

// Type guard helpers
function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isValidMetadata(value: unknown): value is Record<string, unknown> | null {
  return value === null || (
    isNonNullObject(value) && 
    Object.entries(value).every(([key, val]) => 
      typeof key === 'string' && 
      (val === null || ['string', 'number', 'boolean'].includes(typeof val))
    )
  );
}

function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) && value === date.toISOString();
  } catch {
    return false;
  }
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

function isValidScheduleStatus(value: unknown): value is ScheduleStatus {
  return typeof value === 'string' && ['draft', 'published', 'archived'].includes(value);
}

function isValidEmployeeRole(value: unknown): value is DbEmployee['role'] {
  return typeof value === 'string' && ['employee', 'supervisor', 'admin'].includes(value);
}

function isValidEmployeeStatus(value: unknown): value is DbEmployee['status'] {
  return typeof value === 'string' && ['active', 'inactive'].includes(value);
}

function isValidOvertimeStatus(value: unknown): value is DbAssignment['overtime_status'] {
  return value === null || (typeof value === 'string' && ['pending', 'approved', 'rejected'].includes(value));
}

function isValidDayOfWeek(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 6;
}

/**
 * Type guard for database employee records
 */
export function isValidDatabaseEmployee(employee: unknown): employee is DbEmployee {
  if (!isNonNullObject(employee)) return false;

  const {
    id,
    created_at,
    updated_at,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    status,
    department,
    position,
    created_by,
    updated_by,
    metadata
  } = employee;

  return (
    typeof id === 'string' &&
    isISODateString(created_at) &&
    isISODateString(updated_at) &&
    typeof user_id === 'string' &&
    typeof first_name === 'string' &&
    typeof last_name === 'string' &&
    typeof email === 'string' &&
    (phone === null || typeof phone === 'string') &&
    isValidEmployeeRole(role) &&
    isValidEmployeeStatus(status) &&
    (department === null || typeof department === 'string') &&
    (position === null || typeof position === 'string') &&
    (created_by === null || typeof created_by === 'string') &&
    (updated_by === null || typeof updated_by === 'string') &&
    isValidMetadata(metadata)
  );
}

/**
 * Type guard for database shift records
 */
export function isValidDatabaseShift(shift: unknown): shift is DbShift {
  if (!isNonNullObject(shift)) return false;

  const {
    id,
    created_at,
    updated_at,
    title,
    start_time,
    end_time,
    duration_minutes,
    pattern_type,
    crosses_midnight,
    requires_supervisor,
    created_by,
    updated_by,
    metadata
  } = shift;

  return (
    typeof id === 'string' &&
    isISODateString(created_at) &&
    isISODateString(updated_at) &&
    typeof title === 'string' &&
    typeof start_time === 'string' &&
    typeof end_time === 'string' &&
    typeof duration_minutes === 'number' &&
    typeof pattern_type === 'string' &&
    typeof crosses_midnight === 'boolean' &&
    typeof requires_supervisor === 'boolean' &&
    (created_by === null || typeof created_by === 'string') &&
    (updated_by === null || typeof updated_by === 'string') &&
    isValidMetadata(metadata)
  );
}

/**
 * Type guard for database assignment records
 */
export function isValidDatabaseAssignment(assignment: unknown): assignment is DbAssignment {
  if (!isNonNullObject(assignment)) return false;

  const {
    id,
    created_at,
    updated_at,
    schedule_id,
    employee_id,
    shift_id,
    date,
    is_supervisor_shift,
    overtime_hours,
    overtime_status,
    created_by,
    updated_by,
    metadata
  } = assignment;

  return (
    typeof id === 'string' &&
    isISODateString(created_at) &&
    isISODateString(updated_at) &&
    typeof schedule_id === 'string' &&
    typeof employee_id === 'string' &&
    typeof shift_id === 'string' &&
    isValidDate(date) &&
    typeof is_supervisor_shift === 'boolean' &&
    (overtime_hours === null || typeof overtime_hours === 'number') &&
    isValidOvertimeStatus(overtime_status) &&
    (created_by === null || typeof created_by === 'string') &&
    (updated_by === null || typeof updated_by === 'string') &&
    isValidMetadata(metadata)
  );
}

/**
 * Type guard for database requirement records
 */
export function isValidDatabaseRequirement(requirement: unknown): requirement is DbRequirement {
  if (!isNonNullObject(requirement)) return false;

  const {
    id,
    created_at,
    updated_at,
    schedule_id,
    start_time,
    end_time,
    min_employees,
    max_employees,
    min_supervisors,
    day_of_week,
    created_by,
    updated_by,
    metadata
  } = requirement;

  return (
    typeof id === 'string' &&
    isISODateString(created_at) &&
    isISODateString(updated_at) &&
    typeof schedule_id === 'string' &&
    typeof start_time === 'string' &&
    typeof end_time === 'string' &&
    typeof min_employees === 'number' &&
    typeof max_employees === 'number' &&
    typeof min_supervisors === 'number' &&
    isValidDayOfWeek(day_of_week) &&
    (created_by === null || typeof created_by === 'string') &&
    (updated_by === null || typeof updated_by === 'string') &&
    isValidMetadata(metadata)
  );
}

/**
 * Maps database employee record to client employee type
 * Throws error if validation fails
 */
export function mapDatabaseEmployeeToEmployee(dbEmployee: DbEmployee): Employee {
  if (!isValidDatabaseEmployee(dbEmployee)) {
    throw new Error('Invalid database employee record');
  }

  return {
    id: dbEmployee.id,
    created_at: dbEmployee.created_at,
    updated_at: dbEmployee.updated_at,
    user_id: dbEmployee.user_id,
    first_name: dbEmployee.first_name,
    last_name: dbEmployee.last_name,
    email: dbEmployee.email,
    phone: dbEmployee.phone,
    role: dbEmployee.role,
    status: dbEmployee.status,
    department: dbEmployee.department,
    position: dbEmployee.position,
    created_by: dbEmployee.created_by,
    updated_by: dbEmployee.updated_by,
    metadata: dbEmployee.metadata
  };
}

/**
 * Maps database shift record to client shift type
 * Throws error if validation fails
 */
export function mapDatabaseShiftToShift(dbShift: DbShift): Shift {
  if (!isValidDatabaseShift(dbShift)) {
    throw new Error('Invalid database shift record');
  }

  return {
    id: dbShift.id,
    created_at: dbShift.created_at,
    updated_at: dbShift.updated_at,
    title: dbShift.title,
    start_time: dbShift.start_time,
    end_time: dbShift.end_time,
    duration_minutes: dbShift.duration_minutes,
    pattern_type: dbShift.pattern_type,
    crosses_midnight: dbShift.crosses_midnight,
    requires_supervisor: dbShift.requires_supervisor,
    created_by: dbShift.created_by,
    updated_by: dbShift.updated_by,
    metadata: dbShift.metadata
  };
}

/**
 * Maps database schedule record to client schedule type
 * Throws error if validation fails
 */
export function mapDatabaseScheduleToClient(dbSchedule: DbSchedule): Schedule {
  if (!isValidScheduleStatus(dbSchedule.status)) {
    throw new Error('Invalid schedule status');
  }

  return {
    id: dbSchedule.id,
    created_at: dbSchedule.created_at,
    updated_at: dbSchedule.updated_at,
    title: dbSchedule.title,
    description: dbSchedule.description,
    start_date: dbSchedule.start_date,
    end_date: dbSchedule.end_date,
    status: dbSchedule.status,
    published_at: dbSchedule.published_at,
    published_by: dbSchedule.published_by,
    created_by: dbSchedule.created_by,
    updated_by: dbSchedule.updated_by,
    metadata: dbSchedule.metadata
  };
}

/**
 * Maps database requirement record to client requirement type
 * Throws error if validation fails
 */
export function mapDatabaseRequirementToClient(dbRequirement: DbRequirement): TimeBasedRequirement {
  if (!isValidDatabaseRequirement(dbRequirement)) {
    throw new Error('Invalid database requirement record');
  }

  return {
    id: dbRequirement.id,
    created_at: dbRequirement.created_at,
    updated_at: dbRequirement.updated_at,
    schedule_id: dbRequirement.schedule_id,
    start_time: dbRequirement.start_time,
    end_time: dbRequirement.end_time,
    min_employees: dbRequirement.min_employees,
    max_employees: dbRequirement.max_employees,
    min_supervisors: dbRequirement.min_supervisors,
    day_of_week: dbRequirement.day_of_week,
    created_by: dbRequirement.created_by,
    updated_by: dbRequirement.updated_by,
    metadata: dbRequirement.metadata
  };
}

/**
 * Maps raw assignment with joins to client assignment type
 * Throws error if validation fails
 */
export function mapRawAssignmentToAssignment(rawAssignment: DbAssignment & {
  employee: DbEmployee | null;
  shift: DbShift | null;
}): Assignment {
  if (!isValidDatabaseAssignment(rawAssignment)) {
    throw new Error('Invalid database assignment record');
  }

  return {
    id: rawAssignment.id,
    created_at: rawAssignment.created_at,
    updated_at: rawAssignment.updated_at,
    schedule_id: rawAssignment.schedule_id,
    employee_id: rawAssignment.employee_id,
    shift_id: rawAssignment.shift_id,
    date: rawAssignment.date,
    is_supervisor_shift: rawAssignment.is_supervisor_shift,
    overtime_hours: rawAssignment.overtime_hours,
    overtime_status: rawAssignment.overtime_status,
    created_by: rawAssignment.created_by,
    updated_by: rawAssignment.updated_by,
    metadata: rawAssignment.metadata,
    employee: rawAssignment.employee ? mapDatabaseEmployeeToEmployee(rawAssignment.employee) : null,
    shift: rawAssignment.shift ? mapDatabaseShiftToShift(rawAssignment.shift) : null
  };
} 