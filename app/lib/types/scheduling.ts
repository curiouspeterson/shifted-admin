export interface BlockCoverage {
  total: number;
  supervisors: number;
}

export interface DailyCoverage {
  [key: string]: BlockCoverage;
}

export interface TimeBlock {
  start: string;
  end: string;
  minEmployees: number;
  minSupervisors: number;
}

export enum ShiftPatternType {
  FourTen = '4x10',
  ThreeTwelvePlusFour = '3x12+4'
}

export interface ShiftPattern {
  type: ShiftPatternType;
  shifts: string[];
  startDate: Date;
}

export interface AssignmentInsert {
  schedule_id: string;
  employee_id: string;
  shift_id: string;
  date: string;
  is_supervisor_shift: boolean;
}

export type EmployeePosition = 'dispatcher' | 'supervisor' | 'management' | 'shift_supervisor';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  position: EmployeePosition;
  is_active: boolean;
  created_at: string | null;
  updated_at?: string;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  crosses_midnight: boolean;
  min_staff_count: number;
  requires_supervisor: boolean;
  created_at: string | null;
  updated_at?: string;
}

export interface Schedule {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  published_at: string | null;
  published_by: string | null;
}

export interface EmployeeSchedulingRule {
  id: string;
  employee_id: string;
  preferred_shift_pattern: ShiftPatternType;
  max_consecutive_days: number | null;
  min_rest_hours: number | null;
  created_at: string | null;
  updated_at?: string;
}

export interface TimeBasedRequirement {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  min_employees: number;
  max_employees: number | null;
  min_supervisors: number;
  created_at?: string;
  updated_at?: string;
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

export interface ScheduleAssignment {
  id: string;
  schedule_id: string | null;
  employee_id: string | null;
  shift_id: string | null;
  date: string;
  is_supervisor_shift: boolean;
  created_at: string | null;
  updated_at: string | null;
  overtime_hours: number | null;
  overtime_status: string | null;
  employee?: Employee;
  shift?: Shift;
} 