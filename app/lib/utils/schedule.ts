import type { Assignment, TimeBasedRequirement, Employee, Shift } from '@/app/types/scheduling';
import type { RawAssignmentWithJoins } from '@/app/lib/database/mappers';
import type { BaseAssignmentData, GroupedAssignments, RequirementStatus, TimeBlock } from './schedule.types';
import { 
  isValidDatabaseEmployee, 
  isValidDatabaseShift,
  mapDatabaseEmployeeToEmployee,
  mapDatabaseShiftToShift
} from '@/app/lib/database/mappers';

// Function to check if a shift overlaps with a requirement period
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

// Function to calculate requirement statuses
export function calculateRequirementStatuses(
  assignments: Assignment[],
  requirements: TimeBasedRequirement[]
): RequirementStatus[] {
  return requirements.map(requirement => {
    const timeBlock: TimeBlock = {
      startTime: requirement.start_time,
      endTime: requirement.end_time,
    };

    const assignedCount = assignments.filter(assignment => {
      if (!assignment.shift) return false;
      return doesShiftOverlap(assignment.shift, requirement);
    }).length;

    return {
      timeBlock,
      requiredCount: requirement.min_total_staff,
      assignedCount,
      isSatisfied: assignedCount >= requirement.min_total_staff,
    };
  });
}

// Function to create base assignment data
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

// Function to combine base data with employee and shift
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

// Function to map raw assignment to assignment
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

// Function to group assignments by date
export function groupAssignments(assignments: Assignment[]): GroupedAssignments {
  return assignments.reduce<GroupedAssignments>((acc, assignment) => {
    const date = assignment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {});
}

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