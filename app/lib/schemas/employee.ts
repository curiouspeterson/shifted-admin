/**
 * Employee Schema Types
 * Last Updated: 2025-01-16
 * 
 * Defines the domain types and validation schemas for employees.
 * Ensures type safety and validation aligned with the database schema.
 */

import { z } from 'zod';
import type { Database } from '@/lib/database/database.types';

// Employee role type from database
export type EmployeeRole = Database['public']['Enums']['employee_role'];

// Employee status type from database
export type EmployeeStatus = Database['public']['Enums']['employee_status'];

// Employee role enum values as const tuple
export const employeeRoles = ['employee', 'supervisor', 'admin'] as const;

// Employee status enum values as const tuple
export const employeeStatuses = ['active', 'inactive'] as const;

// Base employee fields
const employeeBase = {
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.enum(employeeRoles),
  status: z.enum(employeeStatuses),
  department: z.string().min(1).max(100).nullable(),
  position: z.string().min(1).max(100).nullable(),
  metadata: z.record(z.unknown()).nullable()
};

// Employee input schema
export const employeeInputSchema = z.object({
  ...employeeBase,
  user_id: z.string().uuid(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable()
});

// Employee schema (includes all fields)
export const employeeSchema = z.object({
  ...employeeBase,
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  metadata: z.record(z.unknown()).nullable()
});

// Employee update schema
export const employeeUpdateSchema = z.object({
  ...employeeBase,
  user_id: z.string().uuid().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional()
}).partial();

// Infer types from schemas
export type Employee = z.infer<typeof employeeSchema>;
export type EmployeeInput = z.infer<typeof employeeInputSchema>;
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>; 