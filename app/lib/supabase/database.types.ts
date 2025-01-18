/**
 * Database Types
 * Last Updated: 2025-03-19
 * 
 * Type definitions for Supabase database schema.
 */

import { RequestStatus, RequestType } from '@/app/lib/types/requests'

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
      requests: {
        Row: {
          id: string
          type: RequestType
          start_date: string
          end_date: string
          reason: string
          status: RequestStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['requests']['Insert']>
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
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
        Relationships: []
      }
      schedules: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['schedules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>
        Relationships: []
      }
      shifts: {
        Row: {
          id: string
          employee_id: string
          schedule_id: string
          start_time: string
          end_time: string
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shifts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shifts']['Insert']>
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          schedule_id: string
          employee_id: string
          start_time: string
          end_time: string
          role: 'manager' | 'employee'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
        Relationships: [
          {
            foreignKeyName: "assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      requirements: {
        Row: {
          id: string
          schedule_id: string
          day_of_week: number
          start_time: string
          end_time: string
          min_employees: number
          max_employees: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['requirements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['requirements']['Insert']>
        Relationships: [
          {
            foreignKeyName: "requirements_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics: {
        Row: {
          id: string
          event_type: string
          event_data: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['analytics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['analytics']['Insert']>
        Relationships: []
      }
      availability: {
        Row: {
          id: string
          employee_id: string
          date: string
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['availability']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['availability']['Insert']>
        Relationships: [
          {
            foreignKeyName: "availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      docs: {
        Row: {
          id: string
          title: string
          description: string
          content: Json
          version: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['docs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['docs']['Insert']>
        Relationships: []
      }
      logs: {
        Row: {
          id: string
          level: 'debug' | 'info' | 'warn' | 'error'
          message: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['logs']['Insert']>
        Relationships: []
      }
      time_off_requests: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          type: RequestType
          status: RequestStatus
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['time_off_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['time_off_requests']['Insert']>
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
