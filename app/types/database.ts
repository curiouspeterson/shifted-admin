import { Database } from '@/lib/database.types';

// Enums
export enum ShiftPatternType {
  FourTenHour = '4x10',
  ThreeTwelvePlusFour = '3x12plus4'
}

export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived'
}

// Custom types that extend the generated types
export type EmployeeAvailability = Omit<Database['public']['Tables']['employee_availability']['Row'], 'is_available' | 'employee_id'> & {
  is_available: boolean;
  employee_id: string;
};

export type Shift = Omit<Database['public']['Tables']['shifts']['Row'], 'crosses_midnight' | 'requires_supervisor'> & {
  crosses_midnight: boolean;
  requires_supervisor: boolean;
};

export type TimeBasedRequirement = Omit<Database['public']['Tables']['time_based_requirements']['Row'], 'created_at' | 'crosses_midnight' | 'is_active' | 'updated_at'> & {
  created_at: string;
  crosses_midnight: boolean;
  is_active: boolean;
  updated_at: string;
};

export type Schedule = Omit<Database['public']['Tables']['schedules']['Row'], 'is_active' | 'status'> & {
  is_active: boolean;
  status: ScheduleStatus;
};

export type EmployeeSchedulingRule = Omit<Database['public']['Tables']['employee_scheduling_rules']['Row'], 
  'created_at' | 'updated_at' | 'max_weekly_hours' | 'min_weekly_hours' | 'preferred_shift_pattern' | 'require_consecutive_days'
> & {
  created_at: string;
  updated_at: string;
  max_weekly_hours: number;
  min_weekly_hours: number;
  preferred_shift_pattern: ShiftPatternType;
  require_consecutive_days: boolean;
};

export type Employee = Omit<Database['public']['Tables']['employees']['Row'], 'is_active'> & {
  is_active: boolean;
};

export type ScheduleAssignment = Omit<Database['public']['Tables']['schedule_assignments']['Row'], 'employee_id' | 'schedule_id'> & {
  employee_id: string;
  schedule_id: string;
};

// Helper type for schedule creation/updates
export type ScheduleInput = Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'version'> & {
  assignments?: ScheduleAssignment[];
}; 