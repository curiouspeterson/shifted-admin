export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          position: string;
          department: string;
          is_active: boolean;
          phone: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          version: number;
        }
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          position: string;
          department: string;
          is_active?: boolean;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          version?: number;
        }
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          position?: string;
          department?: string;
          is_active?: boolean;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          version?: number;
        }
      }
      schedules: {
        Row: {
          id: string;
          status: 'draft' | 'published' | 'archived';
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          published_at: string | null;
          published_by: string | null;
          version: number;
          is_active: boolean;
        }
        Insert: {
          id?: string;
          status?: 'draft' | 'published' | 'archived';
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          version?: number;
          is_active?: boolean;
        }
        Update: {
          id?: string;
          status?: 'draft' | 'published' | 'archived';
          start_date?: string;
          end_date?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          version?: number;
          is_active?: boolean;
        }
      }
      schedule_assignments: {
        Row: {
          id: string;
          schedule_id: string;
          employee_id: string;
          shift_id: string;
          date: string;
          is_supervisor_shift: boolean | null;
          overtime_hours: number | null;
          overtime_status: string | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          version: number;
        }
        Insert: {
          id?: string;
          schedule_id: string;
          employee_id: string;
          shift_id: string;
          date: string;
          is_supervisor_shift?: boolean | null;
          overtime_hours?: number | null;
          overtime_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          version?: number;
        }
        Update: {
          id?: string;
          schedule_id?: string;
          employee_id?: string;
          shift_id?: string;
          date?: string;
          is_supervisor_shift?: boolean | null;
          overtime_hours?: number | null;
          overtime_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          version?: number;
        }
      }
      shifts: {
        Row: {
          id: string;
          name: string;
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
          version: number;
        }
        Insert: {
          id?: string;
          name: string;
          start_time: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
        }
        Update: {
          id?: string;
          name?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
        }
      }
      time_requirements: {
        Row: {
          id: string;
          schedule_id: string;
          start_time: string;
          end_time: string;
          min_employees: number;
          max_employees: number | null;
          min_supervisors: number;
          day_of_week: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          version: number;
        }
        Insert: {
          id?: string;
          schedule_id: string;
          start_time: string;
          end_time: string;
          min_employees: number;
          max_employees?: number | null;
          min_supervisors: number;
          day_of_week: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          version?: number;
        }
        Update: {
          id?: string;
          schedule_id?: string;
          start_time?: string;
          end_time?: string;
          min_employees?: number;
          max_employees?: number | null;
          min_supervisors?: number;
          day_of_week?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          version?: number;
        }
      }
    }
  }
}
