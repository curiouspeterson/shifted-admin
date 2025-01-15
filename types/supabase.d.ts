/**
 * Supabase Type Declarations
 * Last Updated: 2024-03
 * 
 * Type declarations for Supabase client and database types.
 */

// Supabase Server Client
declare module '@/lib/supabase/server' {
  import { createServerClient, type CookieOptions } from '@supabase/ssr';
  import { cookies } from 'next/headers';
  import { Database } from './database.types';

  export function createClient(cookieStore: ReturnType<typeof cookies>): ReturnType<typeof createServerClient<Database>>;
}

// Supabase Database Types
declare module '@/lib/supabase/database.types' {
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
          Row: {
            id: string;
            created_at: string;
            updated_at: string;
            start_date: string;
            end_date: string;
            status: 'draft' | 'published' | 'archived';
            name: string;
            version: number;
            is_active: boolean | null;
            created_by: string | null;
          };
          Insert: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            start_date: string;
            end_date: string;
            status?: 'draft' | 'published' | 'archived';
            name: string;
            version?: number;
            is_active?: boolean | null;
            created_by?: string | null;
          };
          Update: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            start_date?: string;
            end_date?: string;
            status?: 'draft' | 'published' | 'archived';
            name?: string;
            version?: number;
            is_active?: boolean | null;
            created_by?: string | null;
          };
        };
        employees: {
          Row: {
            id: string;
            created_at: string;
            updated_at: string;
            user_id: string;
            first_name: string;
            last_name: string;
            email: string;
            phone: string | null;
            role: 'employee' | 'supervisor' | 'admin';
            status: 'active' | 'inactive';
            department: string | null;
            position: string | null;
          };
          Insert: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            user_id: string;
            first_name: string;
            last_name: string;
            email: string;
            phone?: string | null;
            role?: 'employee' | 'supervisor' | 'admin';
            status?: 'active' | 'inactive';
            department?: string | null;
            position?: string | null;
          };
          Update: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            user_id?: string;
            first_name?: string;
            last_name?: string;
            email?: string;
            phone?: string | null;
            role?: 'employee' | 'supervisor' | 'admin';
            status?: 'active' | 'inactive';
            department?: string | null;
            position?: string | null;
          };
        };
        assignments: {
          Row: {
            id: string;
            created_at: string;
            updated_at: string;
            schedule_id: string;
            employee_id: string;
            start_time: string;
            end_time: string;
            status: 'pending' | 'confirmed' | 'declined';
            notes: string | null;
          };
          Insert: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            schedule_id: string;
            employee_id: string;
            start_time: string;
            end_time: string;
            status?: 'pending' | 'confirmed' | 'declined';
            notes?: string | null;
          };
          Update: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            schedule_id?: string;
            employee_id?: string;
            start_time?: string;
            end_time?: string;
            status?: 'pending' | 'confirmed' | 'declined';
            notes?: string | null;
          };
        };
        time_requirements: {
          Row: {
            id: string;
            created_at: string;
            updated_at: string;
            schedule_id: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            min_staff: number;
            requires_supervisor: boolean;
          };
          Insert: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            schedule_id: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            min_staff: number;
            requires_supervisor?: boolean;
          };
          Update: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            schedule_id?: string;
            day_of_week?: number;
            start_time?: string;
            end_time?: string;
            min_staff?: number;
            requires_supervisor?: boolean;
          };
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
} 