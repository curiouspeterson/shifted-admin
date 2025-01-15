/**
 * Assignment Form Schema Module
 * Last Updated: 2024-03
 * 
 * Defines form validation schemas for assignment-related forms.
 * These schemas extend the base assignment schema but are specifically
 * tailored for form validation, omitting server-controlled fields.
 */

import { z } from 'zod';
import { overtimeStatusSchema } from '../base/assignment';

/**
 * Assignment Form Schema
 * Used for validating assignment creation/update forms
 */
export const assignmentFormSchema = z.object({
  schedule_id: z.string().uuid('Invalid schedule ID'),
  employee_id: z.string().uuid('Invalid employee ID'),
  shift_id: z.string().uuid('Invalid shift ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  is_supervisor_shift: z.boolean(),
  overtime_hours: z.number().min(0).nullable(),
  overtime_status: overtimeStatusSchema.nullable(),
});

/**
 * Assignment Form Data Type
 * TypeScript type for assignment form data
 */
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>; 