/**
 * Employee Type Mapper
 * Last Updated: 2024-01-15
 * 
 * Handles type mapping between domain and database types for employees.
 */

import { Database } from '@/lib/database/database.types'

type EmployeeTable = 'employees'
type EmployeeRow = Database['public']['Tables'][EmployeeTable]['Row']
type EmployeeInsert = Database['public']['Tables'][EmployeeTable]['Insert']
type EmployeeUpdate = Database['public']['Tables'][EmployeeTable]['Update']

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  version: number
}

export interface EmployeeInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  isActive?: boolean
}

/**
 * Converts domain employee data to database format
 */
export function toDbEmployee(data: EmployeeInput): EmployeeInsert {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    position: data.position,
    department: data.department,
    is_active: data.isActive ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  }
}

/**
 * Converts database employee data to domain format
 */
export function toDomainEmployee(data: EmployeeRow): Employee {
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    position: data.position,
    department: data.department,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    version: data.version
  }
} 