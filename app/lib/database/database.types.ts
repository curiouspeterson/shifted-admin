/**
 * Database Schema Types
 * Last Updated: 2024-01-15
 * 
 * Generated types for the database schema.
 * Defines the structure of all database tables.
 */

export type Database = {
  public: {
    Tables: {
      schedules: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          status: string
          is_active: boolean
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
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_published_by_fkey"
            columns: ["published_by"]
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
      // Add other tables here as needed
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
