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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      schedule_status_type: 'draft' | 'published' | 'archived';
    };
  };
};
