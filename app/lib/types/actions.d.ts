/**
 * Server Actions Type Declarations
 * Last Updated: 2025-03-19
 * 
 * Type declarations for server actions and their exports.
 * Provides type definitions for all server actions including:
 * - Schedule management
 * - Employee management
 * - Assignment handling
 * - Time requirement configuration
 */

// Schedule Actions
declare module '@/lib/actions/schedule' {
  import { z } from 'zod';
  import { Database } from '@/lib/supabase/database.types';

  export type Schedule = Database['public']['Tables']['schedules']['Row'];
  export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
  export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

  export const scheduleSchema: z.ZodObject<{
    start_date: z.ZodString;
    end_date: z.ZodString;
    status: z.ZodEnum<['draft', 'published', 'archived']>;
    is_published: z.ZodBoolean;
  }>;

  export const querySchema: z.ZodObject<{
    limit: z.ZodNumber;
    offset: z.ZodNumber;
    sort: z.ZodOptional<z.ZodEnum<['start_date', 'end_date', 'status', 'created_at']>>;
    order: z.ZodOptional<z.ZodEnum<['asc', 'desc']>>;
    status: z.ZodOptional<z.ZodEnum<['draft', 'published', 'archived']>>;
  }>;

  export type QueryParams = z.infer<typeof querySchema>;

  export function createSchedule(data: ScheduleInsert): Promise<Schedule>;
  export function getSchedules(params: Partial<QueryParams>): Promise<Schedule[]>;
  export function getSchedule(id: string): Promise<Schedule>;
  export function updateSchedule(id: string, data: Partial<ScheduleUpdate>): Promise<Schedule>;
  export function deleteSchedule(id: string): Promise<void>;
  export function publishSchedule(id: string): Promise<Schedule>;
  export function unpublishSchedule(id: string): Promise<Schedule>;
}

// Employee Actions
declare module '@/lib/actions/employee' {
  import { Database } from '@/lib/supabase/database.types';

  export type Employee = Database['public']['Tables']['employees']['Row'];
  export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
  export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

  export function createEmployee(data: EmployeeInsert): Promise<Employee>;
  export function getEmployees(): Promise<Employee[]>;
  export function getEmployee(id: string): Promise<Employee>;
  export function updateEmployee(id: string, data: EmployeeUpdate): Promise<Employee>;
  export function deleteEmployee(id: string): Promise<void>;
}

// Assignment Actions
declare module '@/lib/actions/assignment' {
  import { Database } from '@/lib/supabase/database.types';

  export type Assignment = Database['public']['Tables']['assignments']['Row'];
  export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
  export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];

  export function createAssignment(data: AssignmentInsert): Promise<Assignment>;
  export function getAssignments(scheduleId: string): Promise<Assignment[]>;
  export function getAssignment(id: string): Promise<Assignment>;
  export function updateAssignment(id: string, data: AssignmentUpdate): Promise<Assignment>;
  export function deleteAssignment(id: string): Promise<void>;
}

// Time Requirement Actions
declare module '@/lib/actions/time-requirement' {
  import { Database } from '@/lib/supabase/database.types';

  export type TimeRequirement = Database['public']['Tables']['time_requirements']['Row'];
  export type TimeRequirementInsert = Database['public']['Tables']['time_requirements']['Insert'];
  export type TimeRequirementUpdate = Database['public']['Tables']['time_requirements']['Update'];

  export function createTimeRequirement(data: TimeRequirementInsert): Promise<TimeRequirement>;
  export function getTimeRequirements(scheduleId: string): Promise<TimeRequirement[]>;
  export function getTimeRequirement(id: string): Promise<TimeRequirement>;
  export function updateTimeRequirement(id: string, data: TimeRequirementUpdate): Promise<TimeRequirement>;
  export function deleteTimeRequirement(id: string): Promise<void>;
} 