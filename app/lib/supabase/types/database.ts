/**
 * Database Types
 * Last Updated: 2025-01-16
 * 
 * Generated types for the Supabase database.
 * This file is auto-generated - do not edit directly.
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
      employees: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          position: string
          department: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          position: string
          department: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          position?: string
          department?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
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
      schedules: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: string
          metadata: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          version?: number
        }
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
      cache_entries: {
        Row: {
          id: string
          key: string
          value: Json
          tags: string[] | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          tags?: string[] | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          tags?: string[] | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          id: string
          key: string
          counter: number
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          counter?: number
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          counter?: number
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invalidate_cache_by_tags: {
        Args: {
          p_tags: string[]
        }
        Returns: number
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_window: number
          p_limit: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: {
        Args: {
          p_hours: number
        }
        Returns: number
      }
    }
    Enums: {
      schedule_status_type: "draft" | "published" | "archived"
    }
  }
} 