import type { ScheduleAssignment } from '../types/scheduling';

export interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: ScheduleAssignment[];
  };
}

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

export interface CoverageValidation {
  isValid: boolean;
  gaps: CoverageGap[];
} 