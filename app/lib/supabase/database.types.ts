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
      schedules: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          start_date: string;
          end_date: string;
          status: 'draft' | 'published' | 'archived';
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          start_date: string;
          end_date: string;
          status?: 'draft' | 'published' | 'archived';
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          status?: 'draft' | 'published' | 'archived';
          created_by?: string;
          updated_by?: string;
          metadata?: Json;
        };
      };
      shifts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          schedule_id: string;
          start_time: string;
          end_time: string;
          position: string;
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          schedule_id: string;
          start_time: string;
          end_time: string;
          position: string;
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          schedule_id?: string;
          start_time?: string;
          end_time?: string;
          position?: string;
          created_by?: string;
          updated_by?: string;
          metadata?: Json;
        };
      };
      employees: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          position: string;
          department?: string;
          supervisor_id?: string;
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          position: string;
          department?: string;
          supervisor_id?: string;
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          position?: string;
          department?: string;
          supervisor_id?: string;
          created_by?: string;
          updated_by?: string;
          metadata?: Json;
        };
      };
      assignments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          schedule_id: string;
          shift_id: string;
          employee_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          schedule_id: string;
          shift_id: string;
          employee_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_by: string;
          updated_by?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          schedule_id?: string;
          shift_id?: string;
          employee_id?: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_by?: string;
          updated_by?: string;
          metadata?: Json;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      schedule_status_type: 'draft' | 'published' | 'archived';
      assignment_status_type: 'pending' | 'accepted' | 'declined';
    };
  };
};
