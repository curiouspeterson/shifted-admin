/**
 * Database Operations Type Declarations
 * Last Updated: 2024
 * 
 * This module provides type declarations for database operations modules.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../app/lib/supabase/database.types';

declare module '@/lib/api/database/assignments' {
  type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
  type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
  type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];

  interface QueryOptions {
    filter?: Partial<Record<keyof AssignmentRow, string>>;
    orderBy?: keyof AssignmentRow;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  }

  interface DatabaseResult<T> {
    data: T | null;
    error: Error | null;
  }

  export class AssignmentsOperations {
    constructor(supabase: SupabaseClient<Database>);
    findById(id: string): Promise<DatabaseResult<AssignmentRow>>;
    findMany(options?: QueryOptions): Promise<DatabaseResult<AssignmentRow[]>>;
    create(data: AssignmentInsert): Promise<DatabaseResult<AssignmentRow>>;
    update(id: string, data: AssignmentUpdate): Promise<DatabaseResult<AssignmentRow>>;
    delete(id: string): Promise<DatabaseResult<AssignmentRow>>;
  }
}

declare module '@/lib/api/database/schedules' {
  type ScheduleRow = Database['public']['Tables']['schedules']['Row'];
  type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
  type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

  interface QueryOptions {
    filter?: Partial<Record<keyof ScheduleRow, string>>;
    orderBy?: keyof ScheduleRow;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  }

  interface DatabaseResult<T> {
    data: T | null;
    error: Error | null;
  }

  export class SchedulesOperations {
    constructor(supabase: SupabaseClient<Database>);
    findById(id: string): Promise<DatabaseResult<ScheduleRow>>;
    findMany(options?: QueryOptions): Promise<DatabaseResult<ScheduleRow[]>>;
    create(data: ScheduleInsert): Promise<DatabaseResult<ScheduleRow>>;
    update(id: string, data: ScheduleUpdate): Promise<DatabaseResult<ScheduleRow>>;
    delete(id: string): Promise<DatabaseResult<ScheduleRow>>;
  }
}

declare module '@/lib/api/database/employees' {
  type EmployeeRow = Database['public']['Tables']['employees']['Row'];
  type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
  type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

  interface QueryOptions {
    filter?: Partial<Record<keyof EmployeeRow, string>>;
    orderBy?: keyof EmployeeRow;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  }

  interface DatabaseResult<T> {
    data: T | null;
    error: Error | null;
  }

  export class EmployeesOperations {
    constructor(supabase: SupabaseClient<Database>);
    findById(id: string): Promise<DatabaseResult<EmployeeRow>>;
    findMany(options?: QueryOptions): Promise<DatabaseResult<EmployeeRow[]>>;
    create(data: EmployeeInsert): Promise<DatabaseResult<EmployeeRow>>;
    update(id: string, data: EmployeeUpdate): Promise<DatabaseResult<EmployeeRow>>;
    delete(id: string): Promise<DatabaseResult<EmployeeRow>>;
  }
} 