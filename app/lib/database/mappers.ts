import type { Database } from '@/lib/database.types';
import type { Employee, Assignment, Shift, TimeBasedRequirement, Schedule } from '@/app/types/scheduling';

// Define database types
export type DbEmployee = Database['public']['Tables']['employees']['Row'];
export type DbShift = Database['public']['Tables']['shifts']['Row'];
export type DbAssignment = Database['public']['Tables']['schedule_assignments']['Row'];
export type DbSchedule = Database['public']['Tables']['schedules']['Row'];
export type DbRequirement = Database['public']['Tables']['time_based_requirements']['Row'];

// Define raw assignment type with joined data
export type RawAssignmentWithJoins = Database['public']['Tables']['schedule_assignments']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row'] | null;
  shift: Database['public']['Tables']['shifts']['Row'] | null;
};

// Type guards
export function isValidDatabaseEmployee(employee: any): employee is DbEmployee {
  return (
    employee &&
    typeof employee.id === 'string' &&
    typeof employee.first_name === 'string' &&
    typeof employee.last_name === 'string' &&
    (employee.email === null || typeof employee.email === 'string') &&
    typeof employee.position === 'string' &&
    (employee.is_active === null || typeof employee.is_active === 'boolean') &&
    (employee.created_at === null || typeof employee.created_at === 'string') &&
    (employee.updated_at === null || typeof employee.updated_at === 'string')
  );
}

export function isValidDatabaseShift(shift: any): shift is DbShift {
  return (
    shift &&
    typeof shift.id === 'string' &&
    typeof shift.name === 'string' &&
    typeof shift.start_time === 'string' &&
    typeof shift.end_time === 'string' &&
    typeof shift.duration_hours === 'number' &&
    typeof shift.crosses_midnight === 'boolean' &&
    typeof shift.requires_supervisor === 'boolean' &&
    (shift.created_at === null || typeof shift.created_at === 'string')
  );
}

// Mapping functions
export function mapDatabaseEmployeeToEmployee(dbEmployee: DbEmployee): Employee {
  return {
    id: dbEmployee.id,
    user_id: dbEmployee.user_id,
    first_name: dbEmployee.first_name,
    last_name: dbEmployee.last_name,
    email: dbEmployee.email || '', // Convert null to empty string
    phone: dbEmployee.phone?.toString() || null,
    position: dbEmployee.position,
    is_active: dbEmployee.is_active ?? false, // Convert null to false
    created_at: dbEmployee.created_at || new Date().toISOString(),
    updated_at: dbEmployee.updated_at || new Date().toISOString()
  };
}

export function mapDatabaseShiftToShift(dbShift: DbShift): Shift {
  return {
    ...dbShift,
    crosses_midnight: dbShift.crosses_midnight,
    requires_supervisor: dbShift.requires_supervisor
  };
}

export function mapDatabaseScheduleToClient(dbSchedule: DbSchedule): Schedule {
  return {
    ...dbSchedule,
    is_active: dbSchedule.is_active ?? false,
    created_at: dbSchedule.created_at || new Date().toISOString(),
    published_at: dbSchedule.published_at || null,
    published_by: dbSchedule.published_by || null,
    created_by: dbSchedule.created_by || null,
  };
}

export function mapDatabaseRequirementToClient(dbRequirement: DbRequirement): TimeBasedRequirement {
  return {
    id: dbRequirement.id,
    start_time: dbRequirement.start_time,
    end_time: dbRequirement.end_time,
    min_total_staff: dbRequirement.min_total_staff,
    min_supervisors: dbRequirement.min_supervisors,
    crosses_midnight: dbRequirement.crosses_midnight,
    is_active: dbRequirement.is_active,
    created_at: dbRequirement.created_at || new Date().toISOString(),
    updated_at: dbRequirement.updated_at || new Date().toISOString()
  };
}

export function mapRawAssignmentToAssignment(rawAssignment: RawAssignmentWithJoins): Assignment | null {
  if (!rawAssignment.employee || !rawAssignment.shift) {
    return null;
  }

  return {
    id: rawAssignment.id,
    date: rawAssignment.date,
    schedule_id: rawAssignment.schedule_id,
    employee_id: rawAssignment.employee_id,
    shift_id: rawAssignment.shift_id,
    is_supervisor_shift: rawAssignment.is_supervisor_shift,
    overtime_hours: rawAssignment.overtime_hours,
    overtime_status: rawAssignment.overtime_status,
    created_at: rawAssignment.created_at,
    updated_at: rawAssignment.updated_at,
    employee: mapDatabaseEmployeeToEmployee(rawAssignment.employee),
    shift: mapDatabaseShiftToShift(rawAssignment.shift),
  };
} 