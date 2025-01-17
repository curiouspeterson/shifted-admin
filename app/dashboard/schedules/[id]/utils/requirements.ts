/**
 * Schedule Requirements Utilities
 * Last Updated: 2024-03-21
 * 
 * Utility functions for calculating schedule requirements and staffing status.
 */

import type { Assignment, TimeBasedRequirement } from '@/lib/types/scheduling';

interface RequirementStatus {
  date: string;
  timeBlock: {
    start: string;
    end: string;
  };
  required: number;
  actual: number;
  type: 'total';
}

/**
 * Calculates staffing requirement statuses for a given date
 */
export function calculateRequirementStatuses(
  date: string,
  assignments: Assignment[],
  timeRequirements: TimeBasedRequirement[]
): RequirementStatus[] {
  return timeRequirements
    .filter(req => req.day_of_week === new Date(date).getDay())
    .map(req => ({
      date,
      timeBlock: {
        start: req.start_time,
        end: req.end_time
      },
      required: req.min_employees,
      actual: calculateActualStaffing(date, assignments, req),
      type: 'total' as const
    }));
}

/**
 * Calculates actual staffing for a given time requirement
 */
function calculateActualStaffing(
  date: string,
  assignments: Assignment[],
  requirement: TimeBasedRequirement
): number {
  return assignments.filter(assignment => {
    const assignmentTime = new Date(`${date}T${assignment.shift?.start_time}`).getTime();
    const blockStart = new Date(`${date}T${requirement.start_time}`).getTime();
    const blockEnd = new Date(`${date}T${requirement.end_time}`).getTime();
    return assignmentTime >= blockStart && assignmentTime < blockEnd;
  }).length;
} 