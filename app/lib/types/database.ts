/**
 * Database Types
 * Last Updated: 2024-03
 * 
 * Type definitions for the Supabase database schema.
 * These types are used to provide type safety when interacting with the database.
 */

import type { 
  Schedule,
  Assignment,
  Employee,
  Shift,
} from '@/lib/schemas';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
        Update: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>;
      };
      assignments: {
        Row: Assignment;
        Insert: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
        Update: Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>;
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
        Update: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>;
      };
      shifts: {
        Row: Shift;
        Insert: Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
        Update: Partial<Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 