/**
 * Schedule Utilities Module
 * Last Updated: 2024
 * 
 * Provides utility functions for schedule management, including time overlap detection,
 * requirement status calculation, assignment mapping, and data grouping. These functions
 * support the core scheduling functionality of the application.
 * 
 * Features:
 * - Time overlap detection
 * - Staffing requirement validation
 * - Assignment data transformation
 * - Data grouping utilities
 */

import type { Assignment, TimeBasedRequirement, Employee, Shift } from '@/app/lib/types/scheduling';
import type { RawAssignmentWithJoins } from '@/app/lib/database/mappers';
import type { GroupedAssignments, RequirementStatus } from './schedule.types';
import { 
  isValidDatabaseEmployee, 
  isValidDatabaseShift,
  mapDatabaseEmployeeToEmployee,
  mapDatabaseShiftToShift
} from '@/app/lib/database/mappers';

/**
 * Checks if a shift overlaps with a requirement period
 * 
 * @param shift - Object containing start and end times
 * @param requirement - Time-based requirement to check against
 * @returns True if the shift overlaps with the requirement period
 */
export function doesShiftOverlap(
  shift: { start_time: string; end_time: string }, 
  requirement: TimeBasedRequirement
): boolean {
  return doesTimeOverlap(
    shift.start_time,
    shift.end_time,
    requirement.start_time,
    requirement.end_time
  );
}

/**
 * Calculates staffing requirement statuses
 * Compares assignments against requirements to determine if staffing needs are met
 * 
 * @param assignments - List of shift assignments
 * @param requirements - List of time-based staffing requirements
 * @returns Array of requirement statuses with satisfaction indicators
 */
export function calculateRequirementStatuses(
  assignments: Assignment[],
  requirements: TimeBasedRequirement[]
): RequirementStatus[] {
  return requirements.map(requirement => {
    const assignedCount = assignments.filter(assignment => {
      if (!assignment.shift) return false;
      return doesShiftOverlap(assignment.shift, requirement);
    }).length;

    return {
      date: new Date().toISOString().split('T')[0], // Current date as YYYY-MM-DD
      timeBlock: {
        start: requirement.start_time,
        end: requirement.end_time
      },
      required: requirement.min_employees,
      actual: assignedCount,
      type: 'total'
    };
  });
}

/**
 * Creates base assignment data from raw assignment
 * Extracts core assignment fields without employee and shift data
 * 
 * @param raw - Raw assignment data from database
 * @returns Base assignment data without employee and shift
 */
function createBaseAssignmentData(raw: RawAssignmentWithJoins): Omit<Assignment, 'employee' | 'shift'> {
  return {
    id: raw.id,
    schedule_id: raw.schedule_id,
    employee_id: raw.employee_id,
    shift_id: raw.shift_id,
    date: raw.date,
    is_supervisor_shift: raw.is_supervisor_shift,
    overtime_hours: raw.overtime_hours,
    overtime_status: raw.overtime_status,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}

/**
 * Combines base assignment data with employee and shift
 * Creates a complete assignment object with all required data
 * 
 * @param baseData - Base assignment data
 * @param employee - Employee data to include
 * @param shift - Shift data to include
 * @returns Complete assignment object
 */
function createAssignment(
  baseData: Omit<Assignment, 'employee' | 'shift'>,
  employee: Employee,
  shift: Shift
): Assignment {
  return {
    ...baseData,
    employee,
    shift
  };
}

/**
 * Maps raw assignment data to typed assignment object
 * Validates and transforms database assignment data
 * 
 * @param rawAssignment - Raw assignment data from database
 * @returns Typed assignment object or null if validation fails
 */
export function mapRawAssignmentToAssignment(rawAssignment: RawAssignmentWithJoins): Assignment | null {
  if (!rawAssignment || typeof rawAssignment.id !== 'string' || typeof rawAssignment.date !== 'string') {
    return null;
  }

  // Validate employee data
  if (!rawAssignment.employee || !isValidDatabaseEmployee(rawAssignment.employee)) {
    return null;
  }

  // Validate shift data
  if (!rawAssignment.shift || !isValidDatabaseShift(rawAssignment.shift)) {
    return null;
  }

  // Map the employee and shift data
  const mappedEmployee = mapDatabaseEmployeeToEmployee(rawAssignment.employee);
  const mappedShift = mapDatabaseShiftToShift(rawAssignment.shift);

  if (!mappedEmployee || !mappedShift) {
    return null;
  }

  // Create the base assignment data
  const baseData = createBaseAssignmentData(rawAssignment);

  // Create the final assignment
  return createAssignment(baseData, mappedEmployee, mappedShift);
}

/**
 * Groups assignments by date
 * Organizes assignments into a nested structure for easier access
 * 
 * @param assignments - List of assignments to group
 * @returns Grouped assignments object with date keys
 */
export function groupAssignments(assignments: Assignment[]): GroupedAssignments {
  return assignments.reduce<GroupedAssignments>((acc, assignment) => {
    const date = assignment.date;
    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][assignment.shift_id || '']) {
      acc[date][assignment.shift_id || ''] = [];
    }
    acc[date][assignment.shift_id || ''].push(assignment);
    return acc;
  }, {});
}

/**
 * Checks if two time periods overlap
 * Converts times to minutes and compares ranges
 * 
 * @param start1 - Start time of first period (HH:MM format)
 * @param end1 - End time of first period (HH:MM format)
 * @param start2 - Start time of second period (HH:MM format)
 * @param end2 - End time of second period (HH:MM format)
 * @returns True if the time periods overlap
 */
export function doesTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [start1Hour, start1Minute] = start1.split(':').map(Number);
  const [end1Hour, end1Minute] = end1.split(':').map(Number);
  const [start2Hour, start2Minute] = start2.split(':').map(Number);
  const [end2Hour, end2Minute] = end2.split(':').map(Number);

  const start1Minutes = start1Hour * 60 + start1Minute;
  const end1Minutes = end1Hour * 60 + end1Minute;
  const start2Minutes = start2Hour * 60 + start2Minute;
  const end2Minutes = end2Hour * 60 + end2Minute;

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
} 