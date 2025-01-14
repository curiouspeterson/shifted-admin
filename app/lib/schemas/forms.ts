/**
 * Forms Schema Module
 * Last Updated: 2024
 * 
 * Defines Zod schemas for form validation in the application.
 * These schemas are used to validate user input in forms for creating
 * and updating schedules and assignments. They extend the base schemas
 * but omit server-controlled fields and add form-specific validations.
 * 
 * Features:
 * - Schedule form validation
 * - Assignment form validation
 * - Form error handling
 * - Type inference helpers
 */

import { z } from 'zod';
import { scheduleSchema, assignmentSchema } from './schedule';

/**
 * Schedule Form Schema
 * Extends the base schedule schema for form validation.
 * Omits server-controlled fields and adds form-specific fields.
 * 
 * Required fields:
 * - name: Schedule name (min 1 character)
 * - start_date: Start date in YYYY-MM-DD format
 * - end_date: End date in YYYY-MM-DD format
 * - status: Schedule status (draft/published/archived)
 * 
 * Optional fields:
 * - description: Schedule description
 */
export const scheduleFormSchema = scheduleSchema
  .omit({
    id: true,
    created_at: true,
    created_by: true,
    published_at: true,
    published_by: true,
    version: true
  })
  .extend({
    name: z.string().min(1, 'Schedule name is required'),
    description: z.string().optional(),
  });

/**
 * Assignment Form Schema
 * Extends the base assignment schema for form validation.
 * Omits server-controlled fields and adds form-specific validations.
 * 
 * Required fields:
 * - employee_id: UUID of the assigned employee
 * - shift_id: UUID of the assigned shift
 * - date: Assignment date in YYYY-MM-DD format
 * 
 * Optional fields:
 * - is_supervisor_shift: Whether this is a supervisor shift (defaults to false)
 * - overtime_hours: Number of overtime hours (nullable)
 * - overtime_status: Status of overtime request (nullable)
 */
export const assignmentFormSchema = assignmentSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    employee: true,
    shift: true,
  })
  .extend({
    employee_id: z.string().uuid('Invalid employee ID'),
    shift_id: z.string().uuid('Invalid shift ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format',
    }),
    is_supervisor_shift: z.boolean().default(false),
    overtime_hours: z.number().min(0).nullable(),
    overtime_status: z.enum(['none', 'pending', 'approved', 'rejected']).nullable(),
  });

/**
 * Type Inference
 * Helper types inferred from the Zod schemas for use in form components
 */
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

/**
 * Form Error Schema
 * Defines the structure of form validation errors
 * 
 * @property message - Main error message
 * @property errors - Optional record of field-specific error messages
 */
export const formErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string()).optional(),
}); 