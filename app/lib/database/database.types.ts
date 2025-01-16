/**
 * Database Types
 * Last Updated: 2024-01-16
 * 
 * Generated types from Supabase, extended with custom types.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rate_limits: {
        Row: {
          id: string
          ip: string
          identifier: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          ip: string
          identifier: string
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          ip?: string
          identifier?: string
          timestamp?: string
          created_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          position: string
          department: string
          is_active: boolean
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          position: string
          department: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          position?: string
          department?: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          status: string
          is_active: boolean
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          published_at: string | null
          published_by: string | null
          version: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          status: string
          is_active?: boolean
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          published_at?: string | null
          published_by?: string | null
          version?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: string
          is_active?: boolean
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          published_at?: string | null
          published_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_published_by_fkey"
            columns: ["published_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shifts: {
        Row: {
          id: string
          schedule_id: string
          name: string
          description: string | null
          start_time: string
          end_time: string
          break_duration: number
          notes: string | null
          status: string
          is_active: boolean
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          id?: string
          schedule_id: string
          name: string
          description?: string | null
          start_time: string
          end_time: string
          break_duration?: number
          notes?: string | null
          status: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          id?: string
          schedule_id?: string
          name?: string
          description?: string | null
          start_time?: string
          end_time?: string
          break_duration?: number
          notes?: string | null
          status?: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "shifts_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          schedule_id: string
          employee_id: string
          shift_id: string
          start_time: string
          end_time: string
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          id?: string
          schedule_id: string
          employee_id: string
          shift_id: string
          start_time: string
          end_time: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          id?: string
          schedule_id?: string
          employee_id?: string
          shift_id?: string
          start_time?: string
          end_time?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_shift_id_fkey"
            columns: ["shift_id"]
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      cleanup_rate_limits: {
        Args: {
          window_seconds: number
        }
        Returns: void
      }
    }
    Views: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
