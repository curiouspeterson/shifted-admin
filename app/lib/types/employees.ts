/**
 * Employee Types
 * Last Updated: 2025-03-19
 * 
 * Type definitions for employee-related data structures.
 */

import type { Database } from '../supabase'

export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type EmployeeWithSchedule = Employee & {
  schedules?: {
    id: string
    title: string
    status: 'draft' | 'published' | 'archived'
  }[]
}

export type EmployeeRole = 'admin' | 'supervisor' | 'employee'

export interface EmployeeFilters {
  role?: EmployeeRole
  status?: 'active' | 'inactive'
  search?: string
}

export interface EmployeeSortOptions {
  field: keyof Employee
  direction: 'asc' | 'desc'
} 