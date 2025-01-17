/**
 * Employee Schemas
 * Last Updated: 2025-01-17
 * 
 * Validation schemas for employee-related data using Zod.
 */

import { z } from 'zod'

const phoneRegex = /^\+?[1-9]\d{1,14}$/

/**
 * Employee roles enum
 */
export const employeeRoles = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

/**
 * Employee statuses enum
 */
export const employeeStatuses = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  TERMINATED: 'terminated',
} as const;

/**
 * Base employee schema
 */
export const employeeSchema = z.object({
  id: z.string().uuid('Invalid employee ID'),
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase(),
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format. Please use international format: +1234567890')
    .nullable(),
  position: z.string()
    .min(2, 'Position must be at least 2 characters')
    .max(50, 'Position must be less than 50 characters'),
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .max(50, 'Department must be less than 50 characters'),
  role: z.enum([employeeRoles.ADMIN, employeeRoles.MANAGER, employeeRoles.EMPLOYEE]),
  status: z.enum([employeeStatuses.ACTIVE, employeeStatuses.INACTIVE, employeeStatuses.PENDING, employeeStatuses.TERMINATED]),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const employeeFormSchema = employeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateEmployeeFormSchema = employeeFormSchema.extend({
  id: z.string().uuid('Invalid employee ID')
});

export type Employee = z.infer<typeof employeeSchema>;
export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeFormSchema>; 