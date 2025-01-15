/**
 * Assignment Schema Module
 * Last Updated: 2024-03
 * 
 * Defines the base schema for assignment entities.
 * This schema represents the core data structure of a shift assignment
 * and is used as the foundation for derived schemas (forms, API, etc).
 */

import { z } from 'zod';

/**
 * Overtime Status
 * Defines the possible states of an overtime request
 */
export const overtimeStatusSchema = z.enum(['none', 'pending', 'approved', 'rejected']);
export type OvertimeStatus = z.infer<typeof overtimeStatusSchema>;

/**
 * Base Assignment Schema
 * Core schema for assignment entities
 */
export const assignmentSchema = z.object({
  id: z.string().uuid(),
  schedule_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  shift_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  is_supervisor_shift: z.boolean(),
  overtime_hours: z.number().min(0).nullable(),
  overtime_status: overtimeStatusSchema.nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
});

/**
 * Assignment Type
 * TypeScript type inferred from the assignment schema
 */
export type Assignment = z.infer<typeof assignmentSchema>; 