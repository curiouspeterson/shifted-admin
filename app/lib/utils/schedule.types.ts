/**
 * Schedule Types Module
 * Last Updated: 2024
 * 
 * Type definitions for schedule-related functionality, including assignment grouping,
 * requirement status tracking, and coverage validation. These types are used across
 * the application to ensure consistent data structures for schedule management.
 */

import type { Assignment } from '@/app/lib/types/scheduling';

/**
 * Grouped Assignments Interface
 * Organizes assignments by date and shift ID for efficient access and display
 * 
 * @property [date] - Date string as key
 * @property [shiftId] - Shift ID as key for inner object
 * @property Assignment[] - Array of assignments for each shift
 */
export interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
}

/**
 * Requirement Status Interface
 * Tracks the status of staffing requirements for a specific time block
 * 
 * @property date - The date for which the status applies
 * @property timeBlock - Start and end times for the requirement period
 * @property required - Number of staff required
 * @property actual - Number of staff assigned
 * @property type - Whether the requirement is for total staff or supervisors
 */
export interface RequirementStatus {
  date: string;
  timeBlock: {
    start: string;
    end: string;
  };
  required: number;
  actual: number;
  type: 'total' | 'supervisor';
}

/**
 * Coverage Gap Interface
 * Represents a period where staffing requirements are not met
 * 
 * @property date - The date of the coverage gap
 * @property timeBlock - Start and end times of the gap
 * @property required - Number of staff required
 * @property actual - Number of staff assigned
 * @property type - Whether the gap is in total staff or supervisor coverage
 */
export interface CoverageGap {
  date: string;
  timeBlock: {
    start: string;
    end: string;
  };
  required: number;
  actual: number;
  type: 'total' | 'supervisor';
}

/**
 * Coverage Validation Interface
 * Result of validating schedule coverage against requirements
 * 
 * @property isValid - Whether all staffing requirements are met
 * @property gaps - Array of coverage gaps if any requirements are not met
 */
export interface CoverageValidation {
  isValid: boolean;
  gaps: CoverageGap[];
} 