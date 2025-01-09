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
          id: number
          user_id: string
          first_name: string
          last_name: string
          position: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          first_name: string
          last_name: string
          position: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          first_name?: string
          last_name?: string
          position?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: number
          name: string
          start_time: string
          end_time: string
          duration_hours: number
          crosses_midnight: boolean
          min_staff_count: number
          requires_supervisor: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          start_time: string
          end_time: string
          duration_hours: number
          crosses_midnight?: boolean
          min_staff_count: number
          requires_supervisor?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          crosses_midnight?: boolean
          min_staff_count?: number
          requires_supervisor?: boolean
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: number
          start_date: string
          end_date: string
          status: string
          version: number
          is_active: boolean
          created_by: number
          published_by: number | null
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: number
          start_date: string
          end_date: string
          status?: string
          version?: number
          is_active?: boolean
          created_by: number
          published_by?: number | null
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: number
          start_date?: string
          end_date?: string
          status?: string
          version?: number
          is_active?: boolean
          created_by?: number
          published_by?: number | null
          created_at?: string
          published_at?: string | null
        }
      }
      schedule_assignments: {
        Row: {
          id: number
          schedule_id: number
          employee_id: number
          shift_id: number
          date: string
          is_supervisor_shift: boolean
          overtime_hours: number | null
          overtime_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          schedule_id: number
          employee_id: number
          shift_id: number
          date: string
          is_supervisor_shift?: boolean
          overtime_hours?: number | null
          overtime_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          schedule_id?: number
          employee_id?: number
          shift_id?: number
          date?: string
          is_supervisor_shift?: boolean
          overtime_hours?: number | null
          overtime_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      overtime_history: {
        Row: {
          id: number
          employee_id: number
          schedule_id: number
          week_start_date: string
          total_hours: number
          overtime_hours: number
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          schedule_id: number
          week_start_date: string
          total_hours: number
          overtime_hours: number
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          schedule_id?: number
          week_start_date?: string
          total_hours?: number
          overtime_hours?: number
          created_at?: string
        }
      }
      shift_swaps: {
        Row: {
          id: number
          offering_employee_id: number
          receiving_employee_id: number
          schedule_assignment_id: number
          status: string
          requested_at: string
          approved_at: string | null
          manager_id: number | null
        }
        Insert: {
          id?: number
          offering_employee_id: number
          receiving_employee_id: number
          schedule_assignment_id: number
          status?: string
          requested_at?: string
          approved_at?: string | null
          manager_id?: number | null
        }
        Update: {
          id?: number
          offering_employee_id?: number
          receiving_employee_id?: number
          schedule_assignment_id?: number
          status?: string
          requested_at?: string
          approved_at?: string | null
          manager_id?: number | null
        }
      }
      audit_logs: {
        Row: {
          id: number
          action_type: string
          entity_type: string
          entity_id: number
          manager_id: number
          reason: string
          override_type: string | null
          constraint_type: string | null
          created_at: string
        }
        Insert: {
          id?: number
          action_type: string
          entity_type: string
          entity_id: number
          manager_id: number
          reason: string
          override_type?: string | null
          constraint_type?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          action_type?: string
          entity_type?: string
          entity_id?: number
          manager_id?: number
          reason?: string
          override_type?: string | null
          constraint_type?: string | null
          created_at?: string
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