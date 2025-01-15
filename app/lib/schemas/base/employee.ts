/**
 * Employee Schema Module
 * Last Updated: 2024-03
 * 
 * Defines the base schema for employee entities.
 * This schema represents the core data structure of an employee
 * and is used as the foundation for derived schemas (forms, API, etc).
 */

import { z } from 'zod';

/**
 * Employee Position
 * Defines the possible positions an employee can hold
 */
export const employeePositionSchema = z.enum(['dispatcher', 'supervisor', 'manager']);
export type EmployeePosition = z.infer<typeof employeePositionSchema>;

/**
 * Base Employee Schema
 * Core schema for employee entities
 */
export const employeeSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  position: employeePositionSchema,
  is_active: z.boolean(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  termination_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
});

/**
 * Employee Type
 * TypeScript type inferred from the employee schema
 */
export type Employee = z.infer<typeof employeeSchema>; 