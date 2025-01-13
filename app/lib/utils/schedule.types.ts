import type { Assignment } from '@/app/types/scheduling';

export interface TimeBlock {
  startTime: string;
  endTime: string;
}

export interface RequirementStatus {
  timeBlock: TimeBlock;
  requiredCount: number;
  assignedCount: number;
  isSatisfied: boolean;
}

export type GroupedAssignments = Record<string, Assignment[]>;

export type BaseAssignmentData = Pick<Assignment, 'date' | 'employee_id' | 'shift_id'>; 