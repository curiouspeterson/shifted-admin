import type { Database } from '@/lib/database.types';

// Enums
export enum ShiftPatternType {
  FourTen = '4x10',
  ThreeTwelvePlusFour = '3x12plus4'
}

export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived'
}

// Custom types that extend the generated types
export type EmployeeAvailability = Omit<
  Database['public']['Tables']['employee_availability']['Row'],
  'employee_id' | 'is_available'
> & {
  employee_id: string;
  is_available: boolean;
};

export type Shift = Omit<
  Database['public']['Tables']['shifts']['Row'],
  'crosses_midnight' | 'requires_supervisor'
> & {
  crosses_midnight: boolean;
  requires_supervisor: boolean;
};

export type TimeBasedRequirement = Omit<
  Database['public']['Tables']['time_based_requirements']['Row'],
  'created_at' | 'crosses_midnight' | 'is_active' | 'updated_at'
> & {
  created_at: string;
  crosses_midnight: boolean;
  is_active: boolean;
  updated_at: string;
};

export type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  is_active: boolean;
};

export type EmployeeSchedulingRule = Omit<
  Database['public']['Tables']['employee_scheduling_rules']['Row'],
  'created_at' | 'updated_at' | 'preferred_shift_pattern' | 'max_weekly_hours' | 'min_weekly_hours' | 'require_consecutive_days'
> & {
  created_at: string;
  updated_at: string;
  preferred_shift_pattern: ShiftPatternType;
  max_weekly_hours: number;
  min_weekly_hours: number;
  require_consecutive_days: boolean;
};

// Base employee type matching the database schema
interface BaseEmployee {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Export the Employee type
export type Employee = BaseEmployee;

export type Assignment = Database['public']['Tables']['schedule_assignments']['Row'] & {
  employee: Employee;
  shift: Database['public']['Tables']['shifts']['Row'];
};

// Helper type for schedule creation/updates
export type ScheduleInput = {
  name: string;
  start_date: string;
  end_date: string;
  status?: ScheduleStatus;
  version?: number;
  is_active?: boolean;
}; 