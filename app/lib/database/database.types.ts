/**
 * Database Types
 * Last Updated: 2025-01-16
 * 
 * Type definitions for the database schema.
 * Generated from the actual database structure.
 */

import { Json } from '@/lib/types/json';

/**
 * Error record structure for tracking error instances
 */
export interface ErrorRecord {
  type: ErrorType;
  message: string;
  code: string;
  count: number;
  first_seen_at: string;
  last_seen_at: string;
  stack_trace?: string;
  source_file?: string;
  source_function?: string;
  source_line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'business' | 'system' | 'network' | 'database' | 'hydration';
  is_operational: boolean;
  affected_users?: number;
  error_rate?: number;
  metadata: Json;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  monitoring_alerts?: {
    threshold: number;
    condition: 'greater_than' | 'less_than' | 'equals';
    notification_channels: string[];
    is_active: boolean;
  }[];
}

/**
 * Error type enum for categorizing errors
 */
export const ERROR_TYPES = [
  'validation',
  'authentication',
  'authorization',
  'database',
  'network',
  'system',
  'business',
  'unknown'
] as const;

export type ErrorType = typeof ERROR_TYPES[number];

/**
 * Base interface for all database rows
 * Implements Record<string, unknown> to satisfy Supabase's GenericSchema constraint
 */
export interface BaseRow extends Record<string, unknown> {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  metadata: Json | null
}

/**
 * Error metrics table structure
 * Tracks error rates and recent errors with proper typing
 */
export interface ErrorMetrics extends BaseRow {
  error_rate: number;
  error_rate_trend: number;
  total_errors: number;
  unique_errors: number;
  error_window_minutes: number;
  recent_errors: ReadonlyArray<ErrorRecord>;
  last_error_at: string | null;
  aggregated_at: string;
  monitoring_config: {
    alert_thresholds: {
      error_rate: number;
      error_count: number;
    };
    notification_channels: string[];
    is_monitoring_active: boolean;
  };
  error_patterns?: {
    pattern: string;
    occurrence_count: number;
    first_seen_at: string;
    last_seen_at: string;
    affected_components: string[];
  }[];
}

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          role: 'employee' | 'supervisor' | 'admin'
          status: 'active' | 'inactive'
          department: string | null
          position: string | null
          created_by: string | null
          updated_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          role?: 'employee' | 'supervisor' | 'admin'
          status?: 'active' | 'inactive'
          department?: string | null
          position?: string | null
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          role?: 'employee' | 'supervisor' | 'admin'
          status?: 'active' | 'inactive'
          department?: string | null
          position?: string | null
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
      }
      assignments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          schedule_id: string
          employee_id: string
          shift_id: string
          date: string
          is_supervisor_shift: boolean | null
          overtime_hours: number | null
          overtime_status: 'pending' | 'approved' | 'rejected' | null
          created_by: string | null
          updated_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id: string
          employee_id: string
          shift_id: string
          date: string
          is_supervisor_shift?: boolean | null
          overtime_hours?: number | null
          overtime_status?: 'pending' | 'approved' | 'rejected' | null
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id?: string
          employee_id?: string
          shift_id?: string
          date?: string
          is_supervisor_shift?: boolean | null
          overtime_hours?: number | null
          overtime_status?: 'pending' | 'approved' | 'rejected' | null
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
      }
      shifts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          start_time: string
          end_time: string
          duration_minutes: number
          pattern_type: string
          crosses_midnight: boolean
          requires_supervisor: boolean
          created_by: string | null
          updated_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          start_time: string
          end_time: string
          duration_minutes: number
          pattern_type: string
          crosses_midnight?: boolean
          requires_supervisor?: boolean
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          start_time?: string
          end_time?: string
          duration_minutes?: number
          pattern_type?: string
          crosses_midnight?: boolean
          requires_supervisor?: boolean
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
      }
      schedules: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          published_by: string | null
          created_by: string | null
          updated_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          published_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          published_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
      }
      time_requirements: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          schedule_id: string
          start_time: string
          end_time: string
          min_employees: number
          max_employees: number | null
          min_supervisors: number
          day_of_week: number
          created_by: string | null
          updated_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id: string
          start_time: string
          end_time: string
          min_employees: number
          max_employees?: number | null
          min_supervisors: number
          day_of_week: number
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id?: string
          start_time?: string
          end_time?: string
          min_employees?: number
          max_employees?: number | null
          min_supervisors?: number
          day_of_week?: number
          created_by?: string | null
          updated_by?: string | null
          metadata?: Json | null
        }
      }
      error_metrics: {
        Row: ErrorMetrics
        Insert: Omit<ErrorMetrics, keyof BaseRow | 'unique_errors'> & Partial<Pick<ErrorMetrics, keyof BaseRow>>
        Update: Partial<ErrorMetrics>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      employee_role: 'employee' | 'supervisor' | 'admin';
      employee_status: 'active' | 'inactive';
      schedule_status: 'draft' | 'published' | 'archived';
      overtime_status: 'pending' | 'approved' | 'rejected';
    }
  }
}
