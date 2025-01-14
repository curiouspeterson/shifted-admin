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
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          position: string
          hourly_rate: number
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          position: string
          hourly_rate: number
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          position?: string
          hourly_rate?: number
          start_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          start_date: string
          end_date: string
          status: string
          is_published: boolean
          created_at: string
          updated_at: string
          created_by: string
          published_at: string | null
          published_by: string | null
        }
        Insert: {
          id?: string
          start_date: string
          end_date: string
          status?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
          published_at?: string | null
          published_by?: string | null
        }
        Update: {
          id?: string
          start_date?: string
          end_date?: string
          status?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          published_at?: string | null
          published_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      schedule_assignments: {
        Row: {
          id: string
          schedule_id: string
          employee_id: string
          shift_id: string
          date: string
          is_supervisor_shift: boolean
          overtime_hours: number | null
          overtime_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          employee_id: string
          shift_id: string
          date: string
          is_supervisor_shift?: boolean
          overtime_hours?: number | null
          overtime_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          employee_id?: string
          shift_id?: string
          date?: string
          is_supervisor_shift?: boolean
          overtime_hours?: number | null
          overtime_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          }
        ]
      }
      time_off_requests: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          status: string
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          status?: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          status?: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      employee_availability: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      time_based_requirements: {
        Row: {
          id: string
          schedule_id: string
          start_time: string
          end_time: string
          min_total_staff: number
          min_supervisors: number
          crosses_midnight: boolean
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          schedule_id: string
          start_time: string
          end_time: string
          min_total_staff: number
          min_supervisors: number
          crosses_midnight?: boolean
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          schedule_id?: string
          start_time?: string
          end_time?: string
          min_total_staff?: number
          min_supervisors?: number
          crosses_midnight?: boolean
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_based_requirements_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          }
        ]
      }
      shifts: {
        Row: {
          id: string
          name: string
          start_time: string
          end_time: string
          duration_hours: number
          min_staff_count: number
          requires_supervisor: boolean
          crosses_midnight: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          start_time: string
          end_time: string
          duration_hours: number
          min_staff_count: number
          requires_supervisor?: boolean
          crosses_midnight?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          min_staff_count?: number
          requires_supervisor?: boolean
          crosses_midnight?: boolean
          created_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 