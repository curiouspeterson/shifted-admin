export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          constraint_type: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          manager_id: string | null
          override_type: string | null
          reason: string
        }
        Insert: {
          action_type: string
          constraint_type?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          manager_id?: string | null
          override_type?: string | null
          reason: string
        }
        Update: {
          action_type?: string
          constraint_type?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          manager_id?: string | null
          override_type?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          default_shift: string | null
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          phone: number | null
          position: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_shift?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          phone?: number | null
          position: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_shift?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: number | null
          position?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      overtime_history: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          overtime_hours: number
          schedule_id: string | null
          total_hours: number
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          overtime_hours: number
          schedule_id?: string | null
          total_hours: number
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          overtime_hours?: number
          schedule_id?: string | null
          total_hours?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_history_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_assignments: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          is_supervisor_shift: boolean
          overtime_hours: number | null
          overtime_status: string | null
          schedule_id: string | null
          shift_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          is_supervisor_shift?: boolean
          overtime_hours?: number | null
          overtime_status?: string | null
          schedule_id?: string | null
          shift_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          is_supervisor_shift?: boolean
          overtime_hours?: number | null
          overtime_status?: string | null
          schedule_id?: string | null
          shift_id?: string | null
          updated_at?: string | null
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
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_active: boolean
          published_at: string | null
          published_by: string | null
          start_date: string
          status: string
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          published_at?: string | null
          published_by?: string | null
          start_date: string
          status?: string
          version?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          published_at?: string | null
          published_by?: string | null
          start_date?: string
          status?: string
          version?: number
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
          },
        ]
      }
      shift_swaps: {
        Row: {
          id: string
          requester_id: string
          accepter_id: string | null
          requester_assignment_id: string
          accepter_assignment_id: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          requester_id: string
          accepter_id?: string | null
          requester_assignment_id: string
          accepter_assignment_id?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          requester_id?: string
          accepter_id?: string | null
          requester_assignment_id?: string
          accepter_assignment_id?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_accepter_id_fkey"
            columns: ["accepter_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      time_based_requirements: {
        Row: {
          id: string
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
          start_time?: string
          end_time?: string
          min_total_staff?: number
          min_supervisors?: number
          crosses_midnight?: boolean
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_scheduling_rules: {
        Row: {
          id: string
          employee_id: string
          max_weekly_hours: number
          min_weekly_hours: number
          preferred_shift_pattern: string
          require_consecutive_days: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          max_weekly_hours?: number
          min_weekly_hours?: number
          preferred_shift_pattern?: string
          require_consecutive_days?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          max_weekly_hours?: number
          min_weekly_hours?: number
          preferred_shift_pattern?: string
          require_consecutive_days?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_scheduling_rules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          crosses_midnight: boolean
          duration_hours: number
          end_time: string
          id: string
          min_staff_count: number
          name: string
          requires_supervisor: boolean
          start_time: string
        }
        Insert: {
          created_at?: string | null
          crosses_midnight?: boolean
          duration_hours: number
          end_time: string
          id?: string
          min_staff_count: number
          name: string
          requires_supervisor?: boolean
          start_time: string
        }
        Update: {
          created_at?: string | null
          crosses_midnight?: boolean
          duration_hours?: number
          end_time?: string
          id?: string
          min_staff_count?: number
          name?: string
          requires_supervisor?: boolean
          start_time?: string
        }
        Relationships: []
      }
      employee_availability: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string | null
          updated_at?: string | null
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
