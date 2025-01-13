import { Shift, Employee } from '@/lib/types/scheduling';

export interface ScheduleAssignment {
  id: string;
  schedule_id: string;
  employee_id: string;
  shift_id: string;
  date: string;
  is_supervisor_shift: boolean;
  employee: Employee;
  shift: Shift;
}

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