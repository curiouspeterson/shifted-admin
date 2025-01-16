/**
 * Supabase Database Types
 * Last Updated: 2024-03-21
 * 
 * This file defines TypeScript types for the Supabase database schema.
 * It includes table definitions, relationships, and common types used
 * across the application.
 */

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
 * JSON type for metadata fields
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

/**
 * Schedule status enum
 */
export type ScheduleStatus = 'draft' | 'published' | 'archived'

/**
 * Assignment status enum
 */
export type AssignmentStatus = 'pending' | 'accepted' | 'rejected'

/**
 * Performance metrics data
 */
interface PerformanceMetrics extends BaseRow {
  timestamp: string
  avg_latency: number
  p95_latency: number
  cache_hit_rate: number
  active_connections: number
  latency_trend: number
  cache_hit_trend: number
  connection_trend: number
}

/**
 * Error metrics data
 */
interface ErrorMetrics extends BaseRow {
  timestamp: string
  error_rate: number
  error_rate_trend: number
  recent_errors: Array<{
    type: string
    message: string
    count: number
  }>
}

/**
 * Rate limit metrics data
 */
interface RateLimitMetrics extends BaseRow {
  timestamp: string
  total_limited: number
  limit_trend: number
  by_route: Array<{
    route: string
    count: number
  }>
}

/**
 * Database schema definition
 */
export interface Database {
  public: {
    Tables: {
      schedules: {
        Row: BaseRow & {
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: ScheduleStatus
        }
        Insert: Partial<BaseRow> & {
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: ScheduleStatus
        }
        Update: Partial<BaseRow & {
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: ScheduleStatus
        }>
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shifts: {
        Row: BaseRow & {
          schedule_id: string
          start_time: string
          end_time: string
          position: string
        }
        Insert: Partial<BaseRow> & {
          schedule_id: string
          start_time: string
          end_time: string
          position: string
        }
        Update: Partial<BaseRow & {
          schedule_id: string
          start_time: string
          end_time: string
          position: string
        }>
        Relationships: [
          {
            foreignKeyName: "shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: BaseRow & {
          name: string
          email: string
          phone: string
          position: string
          status: 'active' | 'inactive'
        }
        Insert: Partial<BaseRow> & {
          name: string
          email: string
          phone: string
          position: string
          status?: 'active' | 'inactive'
        }
        Update: Partial<BaseRow & {
          name: string
          email: string
          phone: string
          position: string
          status: 'active' | 'inactive'
        }>
        Relationships: [
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: BaseRow & {
          schedule_id: string
          shift_id: string
          employee_id: string
          status: AssignmentStatus
        }
        Insert: Partial<BaseRow> & {
          schedule_id: string
          shift_id: string
          employee_id: string
          status?: AssignmentStatus
        }
        Update: Partial<BaseRow & {
          schedule_id: string
          shift_id: string
          employee_id: string
          status: AssignmentStatus
        }>
        Relationships: [
          {
            foreignKeyName: "assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      performance_metrics: {
        Row: BaseRow & {
          timestamp: string
          avg_latency: number
          p95_latency: number
          cache_hit_rate: number
          active_connections: number
          latency_trend: number
          cache_hit_trend: number
          connection_trend: number
        }
        Insert: Partial<BaseRow> & {
          timestamp: string
          avg_latency: number
          p95_latency: number
          cache_hit_rate: number
          active_connections: number
          latency_trend: number
          cache_hit_trend: number
          connection_trend: number
        }
        Update: Partial<BaseRow & {
          timestamp: string
          avg_latency: number
          p95_latency: number
          cache_hit_rate: number
          active_connections: number
          latency_trend: number
          cache_hit_trend: number
          connection_trend: number
        }>
        Relationships: [
          {
            foreignKeyName: "performance_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      error_metrics: {
        Row: BaseRow & {
          timestamp: string
          error_rate: number
          error_rate_trend: number
          recent_errors: Array<{
            type: string
            message: string
            count: number
          }>
        }
        Insert: Partial<BaseRow> & {
          timestamp: string
          error_rate: number
          error_rate_trend: number
          recent_errors: Array<{
            type: string
            message: string
            count: number
          }>
        }
        Update: Partial<BaseRow & {
          timestamp: string
          error_rate: number
          error_rate_trend: number
          recent_errors: Array<{
            type: string
            message: string
            count: number
          }>
        }>
        Relationships: [
          {
            foreignKeyName: "error_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rate_limit_metrics: {
        Row: BaseRow & {
          timestamp: string
          total_limited: number
          limit_trend: number
          by_route: Array<{
            route: string
            count: number
          }>
        }
        Insert: Partial<BaseRow> & {
          timestamp: string
          total_limited: number
          limit_trend: number
          by_route: Array<{
            route: string
            count: number
          }>
        }
        Update: Partial<BaseRow & {
          timestamp: string
          total_limited: number
          limit_trend: number
          by_route: Array<{
            route: string
            count: number
          }>
        }>
        Relationships: [
          {
            foreignKeyName: "rate_limit_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limit_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      schedule_status: ScheduleStatus
      assignment_status: AssignmentStatus
    }
  }
}
