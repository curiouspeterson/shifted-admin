/**
 * Supabase Database Types
 * Last Updated: 2024
 * 
 * Type definitions for the Supabase database schema.
 * These types are used to ensure type safety when interacting with the database.
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
      schedules: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          start_date: string
          end_date: string
          status: 'draft' | 'published' | 'archived'
          is_published: boolean
          created_by: string
          published_at: string | null
          published_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          start_date: string
          end_date: string
          status?: 'draft' | 'published' | 'archived'
          is_published?: boolean
          created_by: string
          published_at?: string | null
          published_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          start_date?: string
          end_date?: string
          status?: 'draft' | 'published' | 'archived'
          is_published?: boolean
          created_by?: string
          published_at?: string | null
          published_by?: string | null
        }
      }
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
        }
      }
      assignments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          schedule_id: string
          employee_id: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'declined'
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id: string
          employee_id: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'declined'
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id?: string
          employee_id?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'declined'
          notes?: string | null
        }
      }
      time_requirements: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          schedule_id: string
          day_of_week: number
          start_time: string
          end_time: string
          min_staff: number
          requires_supervisor: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id: string
          day_of_week: number
          start_time: string
          end_time: string
          min_staff: number
          requires_supervisor?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          schedule_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          min_staff?: number
          requires_supervisor?: boolean
        }
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