/**
 * Employee Types
 * Last Updated: 2024-03-21
 * 
 * Single source of truth for employee-related types.
 * These types are derived from the database schema and used throughout the application.
 */

import { z } from 'zod'
import { type DbEmployee, toDbNull } from './database'

/**
 * Employee role enum
 */
export const employeeRoles = ['employee', 'supervisor', 'admin'] as const
export type EmployeeRole = typeof employeeRoles[number]

/**
 * Employee status enum
 */
export const employeeStatuses = ['active', 'inactive'] as const
export type EmployeeStatus = typeof employeeStatuses[number]

/**
 * Base employee schema using Zod
 * This is the core validation schema that matches our database structure
 */
export const employeeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable(),
  role: z.enum(employeeRoles),
  status: z.enum(employeeStatuses),
  department: z.string().nullable(),
  position: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

/**
 * Employee type derived from the schema
 */
export type Employee = z.infer<typeof employeeSchema>

/**
 * Form schema for creating a new employee
 * This schema is specifically for form handling
 */
export const createEmployeeFormSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  role: z.enum(employeeRoles).default('employee'),
  status: z.enum(employeeStatuses).default('active'),
  department: z.string().min(2, 'Department must be at least 2 characters').optional(),
  position: z.string().min(2, 'Position must be at least 2 characters').optional()
})

export type CreateEmployeeFormData = z.infer<typeof createEmployeeFormSchema>

/**
 * Form schema for updating an employee
 * This schema is specifically for form handling
 */
export const updateEmployeeFormSchema = createEmployeeFormSchema
  .extend({
    id: z.string().uuid()
  })
  .partial()
  .required({ id: true })

export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeFormSchema>

/**
 * Employee with additional computed fields
 * Used for display purposes
 */
export interface EmployeeWithDisplay extends Employee {
  full_name: string
  is_active: boolean
}

/**
 * Helper function to create display version of employee
 */
export function createEmployeeDisplay(employee: Employee): EmployeeWithDisplay {
  return {
    ...employee,
    full_name: `${employee.first_name} ${employee.last_name}`,
    is_active: employee.status === 'active'
  }
}

/**
 * Helper function to transform form data to database input
 */
export function createEmployeeInputFromForm(formData: CreateEmployeeFormData): Omit<DbEmployee['Insert'], 'user_id'> {
  return {
    first_name: formData.first_name,
    last_name: formData.last_name,
    email: formData.email,
    phone: toDbNull(formData.phone),
    role: formData.role,
    status: formData.status,
    department: toDbNull(formData.department),
    position: toDbNull(formData.position)
  }
}

/**
 * Helper function to transform form data to database input for updates
 */
export function updateEmployeeInputFromForm(formData: UpdateEmployeeFormData): DbEmployee['Update'] {
  const { id, ...rest } = formData
  return {
    id,
    ...rest,
    phone: toDbNull(rest.phone),
    department: toDbNull(rest.department),
    position: toDbNull(rest.position)
  }
} 